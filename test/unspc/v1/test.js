'use strict';

import { describe, expect, it } from 'vitest';
import { request } from '#/lib/test-helper';
import { sep } from 'path';

const version = __dirname.split(sep).reverse()[0];
const endpoint = `${version}/unspsc`;

/**
 * Test suite for UNSPSC code endpoint
 * @param {string} endpoint - The base URL endpoint for UNSPSC code queries
 * @returns {void} This function doesn't return a value, it runs test cases
 */
describe('unspsc:', () => {
  /**
   * Tests the GET request for a non-existent code at the specified endpoint.
   * @param {string} endpoint - The API endpoint being tested.
   * @returns {void} This test function doesn't return a value.
   */
  it(`GET ${endpoint}/9999 - code does not exist - returns 404`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/9999`,
    });

    expect(res.statusCode).to.equal(404);
    expect(res.result).toMatchObject({ name: null });
  });

  /**
   * Tests the GET request for a specific commodity code endpoint.
   * @param {string} endpoint - The base endpoint for the API.
   * @returns {void} This test function doesn't return a value, but makes assertions.
   */
  it(`GET ${endpoint}/60104601 - code does exist - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/60104601`,
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result).toMatchObject({
      name: 'Force tables',
      meta: {
        Segment: '60000000',
        'Segment Name':
          'Musical Instruments and Games and Toys and Arts and Crafts and Educational Equipment and Materials and Accessories and Supplies',
        Family: '60100000',
        'Family Name':
          'Developmental and professional teaching aids and materials and accessories and supplies',
        Class: '60104600',
        'Class Name': 'Mechanical physics materials',
        Commodity: '60104601',
        'Commodity Name': 'Force tables',
      },
    });
  });

  /**
   * Tests the GET endpoint with a specific ID and includeMeta set to false
   * @param {void} - No parameters required
   * @returns {void} Doesn't return a value, but expects the response status to be 200 and the result to match the specified object
   */
  it(`GET ${endpoint}/60104601?includeMeta=false - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/60104601?includeMeta=false`,
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result).toMatchObject({ name: 'Force tables' });
  });

  /**
   * Tests the GET endpoint with deep search for a specific item
   * @param {void} - No parameters required
   * @returns {void} Asserts that the response status code is 200 and the result matches the expected object
   */
  it(`GET ${endpoint}/60104600?includeMeta=false&deepSearch=true - find in deep search - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/60104600?includeMeta=false&deepSearch=true`,
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result).toMatchObject({ name: 'Mechanical physics materials' });
  });

  /**
   * Tests the GET request to a specific endpoint with query parameters
   * @param {void} - No parameters required for this test function
   * @returns {Promise<void>} Resolves when the test is complete
   */
  it(`GET ${endpoint}/60104600?includeMeta=false&deepSearch=false - not found because deep search is disabled - returns 404`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/60104600?includeMeta=false&deepSearch=false`,
    });
    expect(res.statusCode).to.equal(404);
    expect(res.result).toMatchObject({ name: null });
  });
});
