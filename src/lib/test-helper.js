import { request as httpRequest } from './http-request.js';
import { config } from './setup-app.js';

let basePath = `http://localhost:${config.port}`;

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
