import { request as httpRequest } from './http-request.js';

let basePath = `http://localhost:9595`;

/**
 * @param {RequestInfo} props
 */
const request = (props) => {
  const { url } = props;

  return httpRequest({
    ...props,
    url: `${basePath}/${url}`,
  });
};

export { request };
