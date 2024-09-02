import axios from 'axios';

/**
 * @typedef {Object} RequestInfo
 * @property {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'} method - The method of request.
 * @property {string} url - The URL to perform request at.
 * @property {Object | Buffer} body - The body of request.
 * @property {Object} headers - The headers of request.
 */

/**
 * @param {RequestInfo} props
 */
async function request(props) {
	const { method, url, body, headers } = props;
	const requestFn = ['get', 'delete'].includes(method.toLowerCase())
    ? axios[method.toLowerCase()](url, { headers })
    : axios[method.toLowerCase()](url, body, { headers });

  /**
   * Wraps a request function in a Promise, handling both successful and error responses
   * @param {Promise} requestFn - The request function to be executed
   * @returns {Promise<Object>} A Promise that resolves to an object containing statusCode and result
   */
  return new Promise((resolve) => {
    requestFn
      /**
       * Handles the response from an asynchronous operation
       * @param {Object} res - The response object from the asynchronous operation
       * @param {number} res.status - The HTTP status code of the response
       * @param {*} res.data - The data returned in the response
       * @returns {Object} An object containing the status code and result
       */
      .then((res) => {
        const { status: statusCode, data } = res;
        resolve({
          statusCode,
          result: data,
        });
      })
      /**
       * Handles errors in an asynchronous operation, extracting status code and result data.
       * @param {Error} err - The caught error object, potentially containing a response property.
       * @returns {Object} An object containing the status code and result data.
       */
      .catch((err) => {
        const { status: statusCode, data: result } = err.response ?? {
          status: 500,
          data: { errors: [{ message: err.cause }] },
        };

        resolve({
          statusCode,
          result,
        });
      });
  });
}

export { request };
