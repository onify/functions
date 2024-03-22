import pkg from 'deep-diff';
const { diff, applyChange } = pkg;

function getUniqueId(item) {
	return item.slug || item.key || item.id;
}

function getNestedProperty(object, pathArray) {
	return pathArray.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : undefined, object);
}

function isImportFormat(data) {
	const validKeys = new Set([
		'agent',
		'dashboard',
		'domain',
		'form',
		'locale',
		'role',
		'workflow',
		'user',
		'guide',
		'bulletin',
		'option',
		'shortcut',
		'workspace'
	]);

	// Check if all keys in the object are valid
	const hasOnlyValidKeys = Object.keys(data).every(key => validKeys.has(key));

	// Check if all values associated with the keys are arrays
	const allValuesAreArrays = Object.values(data).every(value => Array.isArray(value));

	return hasOnlyValidKeys && allValuesAreArrays;
}

function mergeImportData({ source, target, overwrite = false, appendArrayValues = false, excludeAttributes = [] }) {
	function isImportFormat(data) {
		return Object.keys(data).some(key => Array.isArray(data[key]));
	}

	if (!isImportFormat(source) && !isImportFormat(target)) {
		return
	}

	let updates = {};
	let report = { New: {}, Updated: {} };
	let detailedDiffs = {};
	let targetCopy = JSON.parse(JSON.stringify(target));
	let sourceCopy = JSON.parse(JSON.stringify(source));

	function filterObject(obj, excludeKeys) {
		return Object.keys(obj).reduce((acc, key) => {
			if (!excludeKeys.includes(key)) {
				acc[key] = obj[key];
			}
			return acc;
		}, {});
	}

	function mergeArrays(targetArray, sourceArray) {
		let added = [];
		sourceArray.forEach(sourceItem => {
			if (!targetArray.some(targetItem => JSON.stringify(targetItem) === JSON.stringify(sourceItem))) {
				targetArray.push(sourceItem);
				added.push(sourceItem);
			}
		});
		return { mergedArray: targetArray, added };
	}

	Object.keys(source).forEach(node => {
		if (!target[node]) target[node] = [];
		updates[node] = [];
		detailedDiffs[node] = {};

		source[node].forEach(sourceItem => {
			const itemId = getUniqueId(sourceItem);
			let targetItemIndex = target[node].findIndex(item => getUniqueId(item) === itemId);

			if (targetItemIndex !== -1) {
				const targetItem = target[node][targetItemIndex];
				const targetItemFiltered = filterObject(targetItem, excludeAttributes);
				const sourceItemFiltered = filterObject(sourceItem, excludeAttributes);
				let itemDiffs;
				if (overwrite) {
					itemDiffs = diff(targetItemFiltered, sourceItemFiltered) || [];
					target[node][targetItemIndex] = { ...targetItemFiltered, ...sourceItemFiltered };
					if (appendArrayValues) {
						Object.keys(sourceItemFiltered).forEach(key => {
							if (Array.isArray(targetItemFiltered[key]) && Array.isArray(sourceItemFiltered[key])) {
								const { mergedArray, added } = mergeArrays(targetItemFiltered[key], sourceItemFiltered[key]);
								targetItemFiltered[key] = mergedArray;
								added.forEach(addedItem => {
									itemDiffs.push({
										kind: 'A',
										path: [key],
										index: targetItemFiltered[key].indexOf(addedItem),
										item: { kind: 'N', rhs: addedItem }
									});
								});
							}
						});
						target[node][targetItemIndex] = targetItemFiltered;
					}
				} else {
					itemDiffs = [];
					if (appendArrayValues) {
						Object.keys(sourceItemFiltered).forEach(key => {
							if (Array.isArray(targetItemFiltered[key]) && Array.isArray(sourceItemFiltered[key])) {
								const { mergedArray, added } = mergeArrays(targetItemFiltered[key], sourceItemFiltered[key]);
								targetItemFiltered[key] = mergedArray;
								added.forEach(addedItem => {
									itemDiffs.push({
										kind: 'A',
										path: [key],
										index: targetItemFiltered[key].indexOf(addedItem),
										item: { kind: 'N', rhs: addedItem }
									});
								});
							}
						});
						target[node][targetItemIndex] = targetItemFiltered;
					}
				}

				if (itemDiffs && itemDiffs.length > 0) {
					let arrayAdditions = itemDiffs
						.filter(diff => diff.kind === 'A')
						.map(diff => diff.path.join('.'));

					itemDiffs = itemDiffs.filter(diff => {
						if (diff.kind !== 'E') return true;  // Keep non-'E' items
						const parentPath = diff.path.slice(0, -1).join('.');
						return !arrayAdditions.includes(parentPath);
					});
					detailedDiffs[node][itemId] = itemDiffs;
					report.Updated[node] = report.Updated[node] || [];
					report.Updated[node].push(itemId);
					updates[node].push(target[node][targetItemIndex]);
				}
			} else {
				target[node].push(sourceItem);
				updates[node].push(sourceItem);
				report.New[node] = report.New[node] || [];
				report.New[node].push(itemId);
			}
		});

		updates[node] = updates[node].filter(item => item !== undefined);
		if (updates[node].length === 0) {
			delete updates[node];
		}
	});

	return { updates, report: generateTextualReport(report, detailedDiffs, targetCopy, sourceCopy), htmlReport: generateHTMLReport(report, detailedDiffs, targetCopy, sourceCopy) };
}


function formatReportItem(item) {
	function formatNested(value) {
		if (Array.isArray(value)) {
			// For arrays, create a list and format each element
			return `<ul>${value.map(element => `<li>${formatNested(element)}</li>`).join('')}</ul>`;
		} else if (typeof value === 'object' && value !== null) {
			// For objects, create a list of key-value pairs
			return `<ul>${Object.entries(value).map(([key, val]) => `<li>${key}: ${formatNested(val)}</li>`).join('')}</ul>`;
		}
		// For primitive values, return the value directly
		return value;
	}

	if (typeof item === 'string') {
		// Match and replace stringified arrays or objects within the string
		const jsonPattern = /(\[\{.*?\}\])|(\{.*?\})/g;
		item = item.replace(jsonPattern, (match) => {
			try {
				const parsedJson = JSON.parse(match);
				return formatNested(parsedJson);
			} catch (e) {
				// Return the original string if parsing fails
				return match;
			}
		});
	}
	return item;
}

function generateTextualReport(report, detailedDiffs) {
	let textReport = "";
	Object.keys(report).forEach(type => {
		if (Object.keys(report[type]).length > 0) {
			textReport += `${type}:\n`;
			Object.keys(report[type]).forEach(node => {
				textReport += `  ${node}:\n`;
				report[type][node].forEach(item => {
					const itemId = item.split(':')[0];
					textReport += `    - ${item}\n`;
					// Include detailed diffs if available
					if (detailedDiffs[node] && detailedDiffs[node][itemId]) {
						const diffs = detailedDiffs[node][itemId];
						diffs.forEach(diff => {
							if (diff.kind === 'E') {
								textReport += `      * Changed ${diff.path.join('.')} from ${JSON.stringify(diff.lhs)} to ${JSON.stringify(diff.rhs)}\n`;
							} else if (diff.kind === 'N') {
								textReport += `      * Added new property ${diff.path.join('.')} with value ${JSON.stringify(diff.rhs)}\n`;
							} else if (diff.kind === 'D') {
								textReport += `      * Deleted property ${diff.path.join('.')} which had value ${JSON.stringify(diff.lhs)}\n`;
							} else if (diff.kind === 'A') {
								textReport += `      * Array ${diff.path.join('.')} modified at index ${diff.index}: ${diff.item.kind === 'N' ? 'Added' : 'Deleted'} value ${JSON.stringify(diff.item.rhs || diff.item.lhs)}\n`;
							}
						});
					}
				});
			});
		}
	});
	return textReport.trim();
}

function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generateHTMLReport(report, detailedDiffs, originalTargetData, sourceData) {
	let htmlReport = "<div>";

	Object.keys(report).forEach(type => {
		if (Object.keys(report[type]).length > 0) {
			htmlReport += `<h2>${type}</h2>`;
			Object.keys(report[type]).forEach(node => {
				let items = report[type][node];
				if (items.length > 0) {
					htmlReport += `<h3>${node}</h3><ul>`;
					items.forEach(item => {
						const itemId = item.split(':')[0];
						const changes = detailedDiffs[node] && detailedDiffs[node][itemId];
						if (changes) {
							let before = originalTargetData[node].find(el => getUniqueId(el) === itemId);
							let after = JSON.parse(JSON.stringify(before));

							changes.forEach(change => {
								applyChange(after, null, change);
							});

							let beforeStr = JSON.stringify(before, null, 2).replace(/\n/g, '<br>').replace(/\s/g, '&nbsp;');
							let afterStr = JSON.stringify(after, null, 2).replace(/\n/g, '<br>').replace(/\s/g, '&nbsp;');

							changes.forEach(change => {
								if (change.kind === 'E' || change.kind === 'N' || (change.kind === 'A' && change.item.kind === 'N')) {
									// Handle array additions separately
									if (change.kind === 'A' && change.item.kind === 'N') {
										htmlReport += `<li>${change.path.join('.')} extended with ${JSON.stringify(change.item.rhs)}</li>`;
										const arrayValueToHighlight = JSON.stringify(change.item.rhs).replace(/ /g, '&nbsp;');
										const escapedArrayValueToHighlight = escapeRegExp(arrayValueToHighlight);
										afterStr = afterStr.replace(new RegExp(escapedArrayValueToHighlight, "g"), `<strong>${arrayValueToHighlight}</strong>`);
									} else if (change.kind === 'E' || change.kind === 'N') {
										try {
											const lhsObj = JSON.parse(change.lhs);
											const rhsObj = JSON.parse(change.rhs);

											if (typeof lhsObj === 'object' && typeof rhsObj === 'object') {
												// It's a nested object; find and highlight the differences
												const objDiff = diff(lhsObj, rhsObj);
												objDiff.forEach(diff => {
													const diffPath = change.path.concat(diff.path).join('.');
													htmlReport += `<li>${diffPath} changed from ${JSON.stringify(diff.lhs)} to ${JSON.stringify(diff.rhs)}</li>`;

													const diffValue = diff.rhs.replace(/ /g, '&nbsp;');
													const escapedDiffValue = escapeRegExp(diffValue);
													afterStr = afterStr.replace(new RegExp(escapedDiffValue, "g"), `<strong>${diffValue}</strong>`);
												});
											} else {
												// Handle primitive types or non-JSON strings
												htmlReport += `<li>${change.path.join('.')} changed from ${JSON.stringify(change.lhs)} to ${JSON.stringify(change.rhs)}</li>`;
												let valueToHighlight = JSON.stringify(change.rhs).replace(/ /g, '&nbsp;');
												const escapedValueToHighlight = escapeRegExp(valueToHighlight);
												afterStr = afterStr.replace(new RegExp(escapedValueToHighlight, "g"), `<strong>${valueToHighlight}</strong>`);
											}
										} catch (e) {
											// Handle primitive types or non-JSON strings
											htmlReport += `<li>${change.path.join('.')} changed from ${JSON.stringify(change.lhs)} to ${JSON.stringify(change.rhs)}</li>`;
											let valueToHighlight = JSON.stringify(change.rhs).replace(/ /g, '&nbsp;');
											const escapedValueToHighlight = escapeRegExp(valueToHighlight);
											afterStr = afterStr.replace(new RegExp(escapedValueToHighlight, "g"), `<strong>${valueToHighlight}</strong>`);
										}
									}
								}
							});

							htmlReport += `<br><div><div style="display: flex;"><div style="flex: 1; padding-right: 20px;"><pre>Before: ${beforeStr}</pre></div><div style="flex: 1;"><pre>After: ${afterStr}</pre></div></div></div></li>`;
						} else {
							let newItemStr = JSON.stringify(sourceData[node].find(el => getUniqueId(el) === itemId), null, 2).replace(/\n/g, '<br>').replace(/\s/g, '&nbsp;');
							htmlReport += `<li>${formatReportItem(item)}<br><pre>${newItemStr}</pre></li>`;
						}
					});
					htmlReport += "</ul>";
				}
			});
		}
	});

	htmlReport += "</div>";
	return htmlReport;
}

export { mergeImportData };