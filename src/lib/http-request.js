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

  return new Promise((resolve) => {
    requestFn
      .then((res) => {
        const { status: statusCode, data } = res;
        resolve({
          statusCode,
          result: data,
        });
      })
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
