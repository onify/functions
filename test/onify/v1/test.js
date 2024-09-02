import { describe, expect, it } from 'vitest';
import { request } from '#/lib/test-helper';
import { sep } from 'path';

const version = __dirname.split(sep).reverse()[0];
const endpoint = `${version}/onify`;

const source = {
  form: [
    { slug: "new-form", title: "New Form" },
    { slug: "existing-form", title: "Updated Existing Form Title" },
  ],
  workspace: [
    { slug: "new-workspace", title: "New Workspace" },
  ],
};

const target = {
  form: [
    { slug: "existing-form", title: "Existing Form" },
    { slug: "another-existing-form", title: "Another Existing Form" },
  ],
  workspace: [
    { slug: "existing-workspace", title: "Existing Workspace" },
  ],
};

/**
 * Merges import data into the target, with an option to overwrite existing data.
 * @param {Object} source - The source data to be merged.
 * @param {Object} target - The target data to merge into.
 * @param {boolean} [overwrite=false] - Whether to overwrite existing data in the target.
 * @returns {Object} An object containing the merged data updates for forms and workspaces.
 */
describe('mergeImportData:', () => {
  /**
   * Tests the merge functionality of import data without overwriting existing data.
   * @param {Object} source - The source data to be merged.
   * @param {Object} target - The target data to be merged into.
   * @param {boolean} overwrite - Flag to determine if existing data should be overwritten (set to false in this test).
   * @returns {Object} The response object containing the status code and merged data results.
   */
  it('should merge data without overwriting existing data', async () => {
    const res = await request({
      method: 'POST',
      url: `${endpoint}/mergeImportData`,
      body: {
        source: source,
        target: target,
      },
      query: {
        overwrite: false,
      },
    });

    expect(res.statusCode).toEqual(200);
    expect(res.result.updates.form).toContainEqual({ slug: "new-form", title: "New Form" }); // Unchanged due to no overwrite
    expect(res.result.updates.workspace).toContainEqual({ slug: "new-workspace", title: "New Workspace" });
  });

  /**
   * Tests the behavior of merging import data with overwrite option
   * @param {void} - No parameters
   * @returns {void} This test function doesn't return a value
   */
  it('should overwrite data when specified', async () => {
    const res = await request({
      method: 'POST',
      url: `${endpoint}/mergeImportData?overwrite=true`,
      body: {
        source: source,
        target: target,
      },
      query: {
        overwrite: true,
      },
    });

    expect(res.statusCode).toEqual(200);
    expect(res.result.updates.form).toContainEqual({ slug: "new-form", title: "New Form" });
    expect(res.result.updates.form).toContainEqual({ slug: "existing-form", title: "Updated Existing Form Title" }); // Changed due to overwrite
    expect(res.result.updates.workspace).toContainEqual({ slug: "new-workspace", title: "New Workspace" });
  });
});