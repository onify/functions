import express from 'express';
import Joi from 'joi';

const STANDARD_ROUTE_PROPERTIES = ['method', 'path', 'options', 'handler'];

/**
 * Performs schema validation.
 *
 * @param {Object} data - The data input.
 * @param {Joi.ObjectSchema<any>} schema - The schema for data validation.
 * @param {express.Response} res
 * @param {express.NextFunction} next
 * @returns {void} This function does not return a value (void).
 */
const validateSchema = (data, schema, res) => {
  const { error, value: validationResult } = schema.validate(data);

  if (error) {
    const { details } = error;

    const errors = details.map((detail) => {
      const { message, path } = detail;
      return { message, path };
    });

    const result =
      errors.length > 1
        ? { errors: errors.map((error) => error.message) }
        : { error: errors[0].message };

    return { errors: result };
  }

  return { value: validationResult };
};

/**
 * @typedef {Object} RouteInfo
 * @property {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'} method - The method of request.
 * @property {string} path - The request path.
 * @property {Object} options - The route options.
 * @property {express.RequestHandler[]} middlewares - The request handlers before the main operation.
 * @property {express.RequestHandler} handler - The request handler for the main operation.
 */

/**
 * @param {RouteInfo} route
 */
const validateRoute = (moduleName, route) => {
  const { method, options } = route;
	const { body } = options;
  const prefixRegex = /^\/v\d+(\/\w+)+(\/\{\w+\})*$/;

  if (!prefixRegex.test(route.path)) {
    throw new Error(
      `Invalid route path on module ${moduleName}. Path "${route.path}" should start with /v# where # should be an integer.`
    );
  }

  if (
    !STANDARD_ROUTE_PROPERTIES.every((prop) =>
      Object.keys(route).includes(prop)
    )
  ) {
    throw new Error(
      `Invalid or missing route properties on module ${moduleName}.`
    );
  }

  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    throw new Error(`Invalid route method on module ${moduleName}.`);
  }

  if (body && !['multipart/form-data', 'text/plain'].includes(body.allow)) {
    throw new Error(
      `Missing route option property / wrong value on module ${moduleName}. Body should have 'allow' property with valid value`
    );
  }
};

export { validateSchema, validateRoute };
