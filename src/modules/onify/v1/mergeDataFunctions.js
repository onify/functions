import pkg from 'deep-diff';
const { diff, applyChange } = pkg;

```
/**
 * Retrieves a unique identifier for an item.
 * @param {Object} item - The item object to extract the unique identifier from.
 * @returns {string|number} The unique identifier of the item, which can be its slug, key, or id.
 */
```
function getUniqueId(item) {
	return item.slug || item.key || item.id;
}

/**
 * Retrieves a nested property from an object using an array of keys.
 * @param {Object} object - The object to traverse.
 * @param {Array<string|number>} pathArray - An array of keys representing the path to the desired property.
 * @returns {*} The value of the nested property if found, or undefined if the path is invalid.
 */
function getNestedProperty(object, pathArray) {
	/**
	 * Retrieves a nested property value from an object using a path array
	 * @param {Object} object - The source object to traverse
	 * @param {Array} pathArray - An array of keys representing the path to the desired property
	 * @returns {*} The value of the nested property if found, undefined otherwise
	 */
	return pathArray.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : undefined, object);
}

/**
 * Checks if the provided data object adheres to the expected import format.
 * @param {Object} data - The object to be validated for import format.
 * @returns {boolean} True if the data object is in valid import format, false otherwise.
 */
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

/**
 * Merges import data from a source into a target, with various options for handling the merge process.
 * @param {Object} options - The options for merging import data.
 * @param {Object} options.source - The source data to merge from.
 * @param {Object} options.target - The target data to merge into.
 * @param {boolean} [options.overwrite=false] - Whether to overwrite existing data in the target.
 * @param {boolean} [options.appendArrayValues=false] - Whether to append array values instead of replacing them.
 * @param {string[]} [options.excludeAttributes=[]] - Attributes to exclude from the merge process.
 * @returns {Object} An object containing updates, a textual report, and an HTML report of the merge process.
 */
function mergeImportData({ source, target, overwrite = false, appendArrayValues = false, excludeAttributes = [] }) {
	/**
	 * Checks if the given data object is in import format
	 * @param {Object} data - The data object to check
	 * @returns {boolean} True if the data is in import format, false otherwise
	 */
	function isImportFormat(data) {
		/**
		 * Checks if any property of the given object is an array.
		 * @param {Object} data - The object to check for array properties.
		 * @returns {boolean} True if at least one property is an array, false otherwise.
		 */
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

	/**
	 * Filters an object by excluding specified keys
	 * @param {Object} obj - The original object to be filtered
	 * @param {Array} excludeKeys - An array of keys to be excluded from the object
	 * @returns {Object} A new object with the specified keys excluded
	 */
	function filterObject(obj, excludeKeys) {
		/**
		 * Filters an object by excluding specified keys
		 * @param {Object} obj - The input object to be filtered
		 * @param {Array} excludeKeys - An array of keys to be excluded from the result
		 * @returns {Object} A new object with the specified keys excluded
		 */
		return Object.keys(obj).reduce((acc, key) => {
			if (!excludeKeys.includes(key)) {
				acc[key] = obj[key];
			}
			return acc;
		}, {});
	}

	```
	/**
	 * Merges two arrays by adding unique items from the source array to the target array.
	 * @param {Array} targetArray - The array to merge into.
	 * @param {Array} sourceArray - The array to merge from.
	 * @returns {Object} An object containing the merged array and an array of added items.
	 */
	```
	function mergeArrays(targetArray, sourceArray) {
		let added = [];
		/**
		 * Merges unique items from the source array into the target array
		 * @param {Array} sourceArray - The array containing items to be merged
		 * @param {Array} targetArray - The array to merge items into
		 * @param {Array} added - An array to store the newly added items
		 * @returns {void} This function doesn't return a value, it modifies the targetArray and added array in place
		 */
		sourceArray.forEach(sourceItem => {
			```
			/**
			 * Checks if the sourceItem is not present in the targetArray
			 * @param {Array} targetArray - The array to search in
			 * @param {*} sourceItem - The item to search for in the targetArray
			 * @returns {boolean} True if the sourceItem is not found in the targetArray, false otherwise
			 */
			```
			if (!targetArray.some(targetItem => JSON.stringify(targetItem) === JSON.stringify(sourceItem))) {
				targetArray.push(sourceItem);
				added.push(sourceItem);
			}
		});
		return { mergedArray: targetArray, added };
	}

	/**
	 * Merges and updates data from a source object to a target object, tracking changes and generating a report.
	 * @param {Object} source - The source object containing data to be merged.
	 * @param {Object} target - The target object to be updated with source data.
	 * @param {Object} updates - An object to store the updated items.
	 * @param {Object} detailedDiffs - An object to store detailed differences between source and target items.
	 * @param {Object} report - An object to store a summary of changes (new and updated items).
	 * @param {Function} getUniqueId - A function to generate a unique ID for each item.
	 * @param {Array} excludeAttributes - An array of attributes to exclude from comparison.
	 * @param {boolean} overwrite - A flag indicating whether to overwrite existing data in the target.
	 * @param {boolean} appendArrayValues - A flag indicating whether to append array values instead of replacing them.
	 * @param {Function} filterObject - A function to filter object properties based on excludeAttributes.
	 * @param {Function} mergeArrays - A function to merge arrays and track added items.
	 * @param {Function} diff - A function to compute the difference between two objects.
	 * @returns {void} This function doesn't return a value, but modifies the input objects.
	 */
	Object.keys(source).forEach(node => {
		if (!target[node]) target[node] = [];
		updates[node] = [];
		detailedDiffs[node] = {};

		/**
		 * Merges and updates items from a source array to a target array within a specific node, handling overwrites, array appending, and generating detailed difference reports.
		 * @param {Array} source[node] - The source array containing items to be merged or added.
		 * @param {Array} target[node] - The target array where items will be updated or added.
		 * @param {Function} getUniqueId - A function to generate a unique identifier for each item.
		 * @param {Array} excludeAttributes - An array of attributes to be excluded from comparison and merging.
		 * @param {boolean} overwrite - Flag to determine if existing items should be overwritten.
		 * @param {boolean} appendArrayValues - Flag to determine if array values should be appended instead of replaced.
		 * @param {Object} detailedDiffs - An object to store detailed differences for each updated item.
		 * @param {Object} report - An object to store summary report of updates and new additions.
		 * @param {Object} updates - An object to store all updated and new items.
		 * @returns {undefined} This function doesn't return a value but modifies the target array and updates various report objects.
		 */
		source[node].forEach(sourceItem => {
			const itemId = getUniqueId(sourceItem);
			```
			/**
			 * Finds the index of an item in the target array based on its unique ID
			 * @param {Array} target[node] - The array to search within
			 * @param {string} itemId - The unique ID of the item to find
			 * @returns {number} The index of the item in the array, or -1 if not found
			 */
			```
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
						/**
						 * Merges arrays within objects and tracks differences
						 * @param {Object} targetItemFiltered - The target object to merge into
						 * @param {Object} sourceItemFiltered - The source object to merge from
						 * @param {Array} itemDiffs - Array to store the differences
						 * @returns {void} This function doesn't return a value, it modifies the input objects
						 */
						Object.keys(sourceItemFiltered).forEach(key => {
							if (Array.isArray(targetItemFiltered[key]) && Array.isArray(sourceItemFiltered[key])) {
								const { mergedArray, added } = mergeArrays(targetItemFiltered[key], sourceItemFiltered[key]);
								targetItemFiltered[key] = mergedArray;
								```
								/**
								 * Processes added items and generates difference objects for each addition.
								 * @param {Array} added - An array of items that have been added.
								 * @param {Object} targetItemFiltered - The filtered target item containing the array being compared.
								 * @param {string} key - The key of the array property in the targetItemFiltered object.
								 * @param {Array} itemDiffs - The array to which the generated difference objects will be pushed.
								 * @returns {undefined} This function does not return a value, it modifies the itemDiffs array in place.
								 */
								```
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
						/**
						 * Merges arrays in corresponding keys of targetItemFiltered and sourceItemFiltered objects,
						 * updating targetItemFiltered and tracking differences.
						 * @param {Object} targetItemFiltered - The target object to be updated
						 * @param {Object} sourceItemFiltered - The source object containing arrays to merge
						 * @param {Array} itemDiffs - An array to store the differences found during merging
						 * @returns {void} This function doesn't return a value, it modifies the input objects
						 */
						Object.keys(sourceItemFiltered).forEach(key => {
							if (Array.isArray(targetItemFiltered[key]) && Array.isArray(sourceItemFiltered[key])) {
								const { mergedArray, added } = mergeArrays(targetItemFiltered[key], sourceItemFiltered[key]);
								targetItemFiltered[key] = mergedArray;
								/**
								 * Processes added items and creates diff objects for each addition
								 * @param {Array} added - Array of items that were added
								 * @param {Object} targetItemFiltered - The filtered target item containing the array being compared
								 * @param {string} key - The key of the array property in targetItemFiltered
								 * @param {Array} itemDiffs - Array to store the generated diff objects
								 * @returns {void} This function doesn't return a value, it modifies the itemDiffs array in place
								 */
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
						/**
						 * Filters an array to only include elements with a 'kind' property equal to 'A'
						 * @param {Array} diff - An array of objects to be filtered
						 * @returns {Array} A new array containing only the elements where kind === 'A'
						 */
						.filter(diff => diff.kind === 'A')
						/**
						 * Maps the diff objects to their joined path strings
						 * @param {Object} diff - The diff object containing a path property
						 * @returns {string} The joined path string using dot notation
						 */
						.map(diff => diff.path.join('.'));

					/**
					 * Filters the itemDiffs array to remove specific 'E' (edit) type differences
					 * @param {Array} itemDiffs - Array of difference objects to be filtered
					 * @returns {Array} Filtered array of difference objects
					 */
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

		/**
		 * Filters out undefined items from the updates array for a specific node
		 * @param {object} updates - The object containing update arrays for different nodes
		 * @param {string|number} node - The key representing the specific node in the updates object
		 * @returns {Array} The filtered array with undefined items removed
		 */
		updates[node] = updates[node].filter(item => item !== undefined);
		if (updates[node].length === 0) {
			delete updates[node];
		}
	});

	return { updates, report: generateTextualReport(report, detailedDiffs, targetCopy, sourceCopy), htmlReport: generateHTMLReport(report, detailedDiffs, targetCopy, sourceCopy) };
}


/**
 * Formats a report item by converting nested arrays and objects into HTML lists.
 * @param {*} item - The item to format, can be a string, array, object, or primitive value.
 * @returns {string} The formatted item as an HTML string.
 */
function formatReportItem(item) {
	/**
	 * Formats a nested data structure (arrays or objects) into an HTML unordered list.
	 * @param {*} value - The value to be formatted, can be an array, object, or primitive.
	 * @returns {string} HTML string representation of the nested structure.
	 */
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
		/**
		 * Replaces JSON strings within the item with formatted nested JSON
		 * @param {string} item - The string containing potential JSON substrings
		 * @returns {string} The item with JSON substrings replaced by formatted nested JSON
		 */
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

/**
 * Generates a textual report based on a report object and detailed differences.
 * @param {Object} report - An object containing the report data organized by type and node.
 * @param {Object} detailedDiffs - An object containing detailed differences for each node.
 * @returns {string} A formatted string representation of the report, including detailed differences if available.
 */
function generateTextualReport(report, detailedDiffs) {
	let textReport = "";
	/**
	 * Generates a detailed text report from a structured report object and detailed diffs
	 * @param {Object} report - The structured report object containing types, nodes, and items
	 * @param {Object} detailedDiffs - An object containing detailed diff information for each node
	 * @returns {string} A formatted text report with hierarchical structure and detailed diff information
	 */
	Object.keys(report).forEach(type => {
		if (Object.keys(report[type]).length > 0) {
			textReport += `${type}:\n`;
			/**
			 * Generates a detailed text report of changes based on a report object and detailed diffs.
			 * @param {Object} report - The report object containing changes categorized by type and node.
			 * @param {string} type - The type of changes to process from the report.
			 * @param {Object} detailedDiffs - An object containing detailed difference information for each node.
			 * @param {string} textReport - The existing text report to append to.
			 * @returns {string} The updated text report with added details of changes.
			 */
			Object.keys(report[type]).forEach(node => {
				textReport += `  ${node}:\n`;
				/**
				 * Generates a detailed text report for each item in a specific report type and node.
				 * @param {Object} report - The main report object containing different types and nodes.
				 * @param {string} type - The type of report being processed.
				 * @param {string} node - The specific node in the report being processed.
				 * @param {Object} detailedDiffs - Object containing detailed differences for each node and item.
				 * @param {string} textReport - The ongoing text report being built.
				 * @returns {string} Updated text report with added details for each item and its differences.
				 */
				report[type][node].forEach(item => {
					const itemId = item.split(':')[0];
					textReport += `    - ${item}\n`;
					// Include detailed diffs if available
					if (detailedDiffs[node] && detailedDiffs[node][itemId]) {
						const diffs = detailedDiffs[node][itemId];
						/**
						 * Generates a text report of differences between two objects
						 * @param {Array} diffs - An array of diff objects representing the differences
						 * @param {string} textReport - The existing text report to append to
						 * @returns {string} Updated text report with detailed descriptions of the differences
						 */
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

/**
 * Escapes special characters in a string for use in a regular expression.
 * @param {string} string - The input string to escape.
 * @returns {string} A new string with special regex characters escaped.
 */
function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generates an HTML report based on comparison data between original and source data.
 * @param {Object} report - An object containing the report data organized by type and node.
 * @param {Object} detailedDiffs - An object containing detailed differences between original and source data.
 * @param {Object} originalTargetData - The original target data used for comparison.
 * @param {Object} sourceData - The source data used for comparison.
 * @returns {string} An HTML string representing the formatted report with highlighted changes.
 */
function generateHTMLReport(report, detailedDiffs, originalTargetData, sourceData) {
	let htmlReport = "<div>";

	/**
	 * Generates an HTML report of differences between two data sets
	 * @param {Object} report - The report object containing differences
	 * @param {Object} detailedDiffs - Detailed differences between data sets
	 * @param {Object} originalTargetData - The original target data
	 * @param {Object} sourceData - The source data
	 * @returns {string} HTML formatted report of the differences
	 */
	Object.keys(report).forEach(type => {
		if (Object.keys(report[type]).length > 0) {
			htmlReport += `<h2>${type}</h2>`;
			```
			/**
			 * Generates an HTML report of changes between two data sets
			 * @param {Object} report - The report object containing changes
			 * @param {string} type - The type of changes to report
			 * @param {Object} detailedDiffs - Detailed differences between the data sets
			 * @param {Object} originalTargetData - The original target data
			 * @param {Object} sourceData - The source data
			 * @param {function} getUniqueId - Function to get a unique ID for an element
			 * @param {function} applyChange - Function to apply a change to an object
			 * @param {function} escapeRegExp - Function to escape special characters in a string for use in a regular expression
			 * @param {function} formatReportItem - Function to format a report item
			 * @returns {string} HTML string containing the formatted report of changes
			 */
			
			```			Object.keys(report[type]).forEach(node => {
				let items = report[type][node];
				if (items.length > 0) {
					htmlReport += `<h3>${node}</h3><ul>`;
					/**
					 * Processes items and generates an HTML report of changes
					 * @param {Array} items - Array of items to process
					 * @param {Object} detailedDiffs - Object containing detailed differences
					 * @param {Object} originalTargetData - Original target data object
					 * @param {Object} sourceData - Source data object
					 * @param {string} node - Current node being processed
					 * @param {string} htmlReport - Accumulator for the HTML report
					 * @returns {string} Updated HTML report with processed items and their changes
					 */
					items.forEach(item => {
						const itemId = item.split(':')[0];
						const changes = detailedDiffs[node] && detailedDiffs[node][itemId];
						if (changes) {
							/**
							 * Finds an element in the original target data array for a specific node, based on a unique identifier
							 * @param {Array} originalTargetData[node] - The array of elements for the current node in the original target data
							 * @param {string|number} itemId - The unique identifier of the item to find
							 * @returns {Object|undefined} The found element with the matching unique identifier, or undefined if not found
							 */
							let before = originalTargetData[node].find(el => getUniqueId(el) === itemId);
							let after = JSON.parse(JSON.stringify(before));

							/**
							 * Applies a series of changes to a target object.
							 * @param {Object} after - The target object to which changes will be applied.
							 * @param {Array} changes - An array of change objects to be applied.
							 * @returns {void} This function does not return a value.
							 */
							changes.forEach(change => {
								applyChange(after, null, change);
							});

							let beforeStr = JSON.stringify(before, null, 2).replace(/\n/g, '<br>').replace(/\s/g, '&nbsp;');
							let afterStr = JSON.stringify(after, null, 2).replace(/\n/g, '<br>').replace(/\s/g, '&nbsp;');

							/**
							 * Processes an array of changes and generates an HTML report with highlighted differences
							 * @param {Array} changes - An array of change objects to be processed
							 * @returns {void} This function doesn't return a value, but modifies global variables htmlReport and afterStr
							 */
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
												/**
												 * Processes object differences and generates HTML report entries
												 * @param {Array} objDiff - Array of object differences
												 * @param {Object} change - Change object containing path information
												 * @param {string} htmlReport - Current HTML report string
												 * @param {string} afterStr - String representation of the changed state
												 * @returns {Object} Updated htmlReport and afterStr
												 */
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
							/**
							 * Finds an item in the sourceData array by its unique ID, stringifies it, and formats it for HTML display
							 * @param {Array} sourceData[node] - The array of items to search within
							 * @param {string} itemId - The unique identifier of the item to find
							 * @returns {string} A stringified and HTML-formatted representation of the found item
							 */
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