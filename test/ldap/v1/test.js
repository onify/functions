import { describe, expect, it } from 'vitest';
import { request } from '#/lib/test-helper';
import { sep } from 'path';

const version = __dirname.split(sep).reverse()[0];
const endpoint = `${version}/ldap`;

/**
 * Describes a series of tests for LDAP search functionality
 * @param {string} url - The LDAP server URL
 * @param {string} username - The LDAP username for authentication
 * @param {string} password - The password for LDAP authentication
 * @param {string} base - The LDAP search base
 * @param {string} filter - The LDAP search filter
 * @param {string} scope - The LDAP search scope
 * @param {string} tlsOptions - TLS options for LDAP connection
 * @returns {void} This function doesn't return a value, it contains test cases
 */
describe('ldap:', () => {
  const url = 'ldap%3A%2F%2Fldap.forumsys.com';
  const username = 'cn=read-only-admin,dc=example,dc=com';
  const password = 'password';
  const base = 'dc=example,dc=com';
  const filter = '(objectclass%3D*)';
  const scope = 'sub';
  const tlsOptions = 'rejectUnauthorized%3Dtrue';

  /**
   * Tests the GET /search endpoint for bad request due to missing required query parameter
   * @param {string} endpoint - The base URL of the API endpoint
   * @param {string} username - The username for authentication
   * @param {string} password - The password for authentication
   * @param {string} base - The base parameter for the search query
   * @param {string} filter - The filter parameter for the search query
   * @param {string} scope - The scope parameter for the search query
   * @returns {void} No return value, uses assertions to validate the response
   */
  it(`GET ${endpoint}/search - bad request / missing required query parameter - returns 400`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/search?username=${username}&password=${password}&base=${base}&filter=${filter}&scope=${scope}`,
    });

    expect(res.statusCode).to.equal(400);
    expect(res.result.error).to.equal('"url" is required');
  });

  /**
   * Tests the GET /search endpoint with complete query parameters and correct parameter values
   * @param {string} endpoint - The base endpoint for the API
   * @param {string} url - The URL parameter for the search query
   * @param {string} username - The username parameter for authentication
   * @param {string} password - The password parameter for authentication
   * @param {string} base - The base parameter for the search query
   * @param {string} filter - The filter parameter for the search query
   * @param {string} scope - The scope parameter for the search query
   * @returns {void} This test case doesn't return a value, but asserts the response status code and result length
   */
  it(`GET ${endpoint}/search - complete query parameters and correct parameter values - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/search?url=${url}&username=${username}&password=${password}&base=${base}&filter=${filter}&scope=${scope}`,
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.length > 0).to.equal(true);
  });

  /**
   * Tests the GET /search endpoint for unauthorized access with invalid user credentials
   * @param {string} endpoint - The base API endpoint
   * @param {string} url - The URL parameter for the search query
   * @param {string} username - The username for authentication
   * @param {string} base - The base parameter for the search query
   * @param {string} filter - The filter parameter for the search query
   * @param {string} scope - The scope parameter for the search query
   * @returns {void} No return value, uses assertions to verify the response
   */
  it(`GET ${endpoint}/search - unauthorized / user/password invalid - returns 401`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/search?url=${url}&username=${username}&password=wrongpassword&base=${base}&filter=${filter}&scope=${scope}`,
    });

    expect(res.statusCode).to.equal(401);
    expect(res.result.error).to.equal('Invalid Credentials');
  });

  /**
   * Tests the GET endpoint for searching a user that exists
   * @param {string} endpoint - The base URL for the API endpoint
   * @param {string} url - The LDAP server URL
   * @param {string} username - The username for LDAP authentication
   * @param {string} password - The password for LDAP authentication
   * @param {string} base - The base DN for the LDAP search
   * @param {string} scope - The search scope for the LDAP query
   * @param {string} tlsOptions - TLS options for the LDAP connection
   * @returns {void} This test doesn't return a value, it uses assertions to verify the response
   */
  it(`GET ${endpoint}/search - search for a user that does exist - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/search?url=${url}&username=${username}&password=${password}&base=${base}&filter=(uid%3Dtesla)&scope=${scope}&tlsOptions=${tlsOptions}`,
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.length).to.equal(1);
  });

  /**
   * Tests the GET /search endpoint without a supplied raw parameter
   * @param {string} endpoint - The base endpoint for the API
   * @param {string} url - The URL parameter for the search query
   * @param {string} username - The username for authentication
   * @param {string} password - The password for authentication
   * @param {string} base - The base parameter for the search query
   * @param {string} filter - The filter parameter for the search query
   * @param {string} scope - The scope parameter for the search query
   * @returns {Object} The response object with status code and result
   */
  it(`GET ${endpoint}/search - search result without supplied raw parameter - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/search?url=${url}&username=${username}&password=${password}&base=${base}&filter=${filter}&scope=${scope}`,
    });

    expect(res.statusCode).to.equal(200);
    expect(Object.keys(res.result[0]).includes('messageId')).to.equal(false);
  });

  /**
   * Tests the GET /search endpoint with raw parameter set to false
   * @param {string} endpoint - The base endpoint for the API
   * @param {string} url - The LDAP server URL
   * @param {string} username - The username for LDAP authentication
   * @param {string} password - The password for LDAP authentication
   * @param {string} base - The search base for LDAP
   * @param {string} scope - The search scope for LDAP
   * @returns {void} No return value, uses assertions to validate the response
   */
  it(`GET ${endpoint}/search - search result with supplied raw parameter value false - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/search?url=${url}&username=${username}&password=${password}&base=${base}&filter=(%26(cn%3D*)(sn%3D*))&scope=${scope}&raw=false`,
    });

    const requiredKeys = ['objectName', 'cn', 'sn'];
    const resultKeys = Object.keys(res.result[0]);

    expect(res.statusCode).to.equal(200);
    ```
    /**
     * Checks if all required keys are present in the result keys array
     * @param {Array} requiredKeys - An array of keys that must be present
     * @param {Array} resultKeys - An array of keys to check against
     * @returns {boolean} True if all required keys are present, false otherwise
     */
    ```
    expect(requiredKeys.every((key) => resultKeys.includes(key))).to.equal(
      true
    );
  });

  /**
   * Tests the GET search endpoint with raw parameter set to true
   * @param {string} endpoint - The base endpoint for the API
   * @param {string} url - The LDAP server URL
   * @param {string} username - The username for LDAP authentication
   * @param {string} password - The password for LDAP authentication
   * @param {string} base - The search base for LDAP
   * @param {string} filter - The LDAP search filter
   * @param {string} scope - The search scope for LDAP
   * @returns {void} Does not return a value, but expects a 200 status code and specific response structure
   */
  it(`GET ${endpoint}/search - search result with supplied raw parameter value true - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/search?url=${url}&username=${username}&password=${password}&base=${base}&filter=${filter}&scope=${scope}&raw=true`,
    });

    const requiredKeys = ['objectName', 'attributes', 'type'];
    const resultKeys = Object.keys(res.result[0]);

    expect(res.statusCode).to.equal(200);
    expect(
      /**
       * Checks if all required keys are present in the result keys array
       * @param {string[]} requiredKeys - Array of keys that must be present
       * @param {string[]} resultKeys - Array of keys to check against
       * @returns {boolean} True if all required keys are present, false otherwise
       */
      requiredKeys.every((key) => resultKeys.includes(key)) &&
        res.result[0]['type'] === 'SearchResultEntry' &&
        Array.isArray(res.result[0]['attributes'])
    ).to.equal(true);
  });

  /**
   * Tests the GET /search endpoint with paged parameter set to true
   * @param {string} endpoint - The base endpoint for the API
   * @param {string} url - The URL parameter for the search query
   * @param {string} username - The username for authentication
   * @param {string} password - The password for authentication
   * @param {string} base - The base parameter for the search query
   * @param {string} filter - The filter parameter for the search query
   * @param {string} scope - The scope parameter for the search query
   * @returns {void} No return value
   */
  it(`GET ${endpoint}/search - search result with paged parameter value true - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/search?url=${url}&username=${username}&password=${password}&base=${base}&filter=${filter}&scope=${scope}&paged=true&pageSize=5`,
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.length === 5).to.equal(true);
  });
});
