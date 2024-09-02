'use strict';

import { describe, expect, it } from 'vitest';
import { request } from '#/lib/test-helper';
import { sep } from 'path';

const version = __dirname.split(sep).reverse()[0];
let endpoint = `${version}/convert`;

/**
 * Describes a suite of tests for XML to JSON and JSON to XML conversion endpoints
 * @param {string} endpoint - The base endpoint for the conversion API
 * @returns {void} This function does not return a value, it runs test assertions
 */
describe('convert:', () => {
  /**
   * Tests POST request to /xml/json endpoint with invalid XML content
   * @param {void} None - This test function doesn't take any parameters
   * @returns {void} Doesn't return a value, but performs assertions
   */
  it(`POST ${endpoint}/xml/json - bad XML content - returns 500`, async () => {
    const res = await request({
      method: 'POST',
      url: `${endpoint}/xml/json`,
      body: '<xml>test</xml',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(res.statusCode).to.equal(500);
    expect(res.result.err.code).to.equal('InvalidTag');
  });

  /**
   * Tests the POST endpoint for XML to JSON conversion with valid XML content
   * @param {Object} request - The HTTP request object
   * @param {string} endpoint - The base endpoint for the API
   * @returns {void} This test function doesn't return a value
   */
  it(`POST ${endpoint}/xml/json - good XML content - returns 200`, async () => {
    const res = await request({
      method: 'POST',
      url: `${endpoint}/xml/json`,
      body: '<xml>test</xml>',
      headers: { 'Content-Type': 'text/plain' },
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result).toMatchObject({ xml: 'test' });
  });

  /**
   * Tests the POST request to convert XML to JSON with attributes preserved.
   * @param {string} endpoint - The base endpoint for the API.
   * @returns {void} No return value, uses assertions to validate the response.
   */
  it(`POST ${endpoint}/xml/json?ignoreAttributes=false - good XML content - returns 200`, async () => {
    const res = await request({
      method: 'POST',
      url: `${endpoint}/xml/json?ignoreAttributes=false`,
      body: '<xml attribute="test">test</xml>',
      headers: { 'Content-Type': 'text/plain' },
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result).toMatchObject({
      xml: { '#text': 'test', '@_attribute': 'test' },
    });
  });

  /**
   * Tests POST request to /json/xml endpoint with invalid JSON content
   * @param {void} None - This function doesn't take any parameters
   * @returns {Promise<void>} Resolves when the test is complete
   */
  it(`POST ${endpoint}/json/xml - bad JSON content - returns 500`, async () => {
    const res = await request({
      method: 'POST',
      url: `${endpoint}/json/xml`,
      body: '{ "var1": "value1"',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(res.statusCode).to.equal(500);
  });

  /**
   * Tests the POST endpoint for converting JSON to XML
   * @param {void} None - This function doesn't take any parameters
   * @returns {Promise<void>} Resolves when the test is complete
   */
  it(`POST ${endpoint}/json/xml - good JSON content - returns 200`, async () => {
    const res = await request({
      method: 'POST',
      url: `${endpoint}/json/xml`,
      body: '{ "var1": "value1" }',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result).to.equal('<var1>value1</var1>');
  });
});
