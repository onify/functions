import { readdirSync, existsSync, rmSync, statSync } from 'fs';
import express from 'express';
import { join, sep } from 'path';
import swaggerUI from 'swagger-ui-express';
import Joi from 'joi';

import { validateRoute, validateSchema } from './lib/validation.js';
import joiToSwagger from 'joi-to-swagger';
import { handleSingleUploadFile } from './lib/upload.js';
import { logger } from './lib/logger.js';
import packageJson from '../package.json' with { type: 'json' };
import { url } from 'inspector';

const CUSTOM_MODULES_DIR = './custom/src/modules';
const SYSTEM_MODULES_DIR = './src/modules';

let swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Onify Functions',
    description:
      '[https://github.com/onify/functions](https://github.com/onify/functions)',
    version: packageJson.version,
  },
};

/**
 * @type {express.Express}
 */
let app;

const loadModules = async (baseDir) => {
  const modulePaths = [];

  if (existsSync(baseDir)) {
    readdirSync(baseDir).forEach((moduleDirectory) => {
      const versionDirectories = readdirSync(join(baseDir, moduleDirectory))
        .filter((versionDirectory) =>
          statSync(
            join(baseDir, moduleDirectory, versionDirectory),
          ).isDirectory(),
        )
        .sort();

      versionDirectories.forEach((versionDir) => {
        const module = readdirSync(
          join(baseDir, moduleDirectory, versionDir),
        ).find((fileName) => fileName === 'module.js');

        if (module) {
          modulePaths.push(join(baseDir, moduleDirectory, versionDir, module));
        }
      });
    });
  }

  const modules = modulePaths.map(async (modulePath) => {
    return {
      path: modulePath,
      module: (await await import(new URL(`../${modulePath}`, import.meta.url)))
        .module,
    };
  });

  return modules;
};

/**
 * @param {Joi.ObjectSchema<any>} schema
 */
const getDocumentParameters = (type, schema) => {
  const { swagger } = joiToSwagger(schema);
  const params = Object.keys(swagger.properties).map((key) => {
    const { required } = swagger;
    const { description, ...schema } = swagger.properties[key];

    const document = {
      name: key,
      in: type,
      description,
      schema,
    };

    if (required !== undefined) {
      document.required = required.includes(key);
    }

    return document;
  });

  return params;
};

/**
 * @param {Joi.ObjectSchema<any>} schema
 * @param {Object | undefined} config
 */
const getDocRequestBody = (schema, config) => {
  const { swagger } = joiToSwagger(schema);
  const contentType = config?.allow ?? 'application/json';

  const content = {};

  switch (contentType) {
    case 'application/json':
      content[contentType] = { schema: swagger };
      break;
    case 'multipart/form-data':
      const { file, ...props } = swagger.properties;

      content[contentType] = {
        schema: {
          type: 'object',
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: file.description,
            },
            ...props,
          },
        },
      };
      break;
    case 'text/plain':
      content[contentType] = { schema: swagger };
      break;
    default:
      throw new Error(`Unknown content type: ${contentType}`);
  }

  return { content };
};

const schemaValidationMiddlewares = (validationSchema) => {
  const { query, body } = validationSchema ?? { query: null, body: null };
  const middlewares = [];

  if (query) {
    middlewares.push((req, res, next) => {
      if (req.query) {
        const { errors, value } = validateSchema(req.query, query, res);

        if (errors) {
          return res.status(400).send(errors);
        }

        req.query = value;

        next();
      }
    });
  }

  if (body) {
    middlewares.push((req, res, next) => {
      if (req.body) {
        const { errors } = validateSchema(req.body, body, res);

        if (errors) {
          if (req.body.file && existsSync(req.body.file.path)) {
            rmSync(req.body.file.path);
          }
          return res.status(400).send(errors);
        }

        next();
      }
    });
  }

  return middlewares;
};

const setDefaultLogger = (req, res, next) => {
  req.log.debug(`Request ${req.method.toUpperCase()} ${req.path}`);

  next();
};

const initRoutes = async (modules) => {
  swaggerDefinition.paths = {};

  for (const module of modules) {
    const { path, module: _module } = await module;
    const { name, routes } = _module;
    const versionPrefix = path.split(sep).reverse()[1];

    for (const route of routes) {
      route.path = `/${versionPrefix}/${route.path.replace(/^\//, '')}`;
      validateRoute(name, route);

      const { method: _method, options, handler, path } = route;

      const {
        validate,
        tags,
        body: routeOptionBody,
        description,
        notes: summary,
      } = options;
      const { query, params, body: validationBody } = validate;
      const method = _method.toLowerCase();

      let { middlewares } = route;

      if (
        method === 'post' &&
        routeOptionBody?.allow === 'multipart/form-data'
      ) {
        middlewares = [handleSingleUploadFile, ...middlewares];
      }

      app[method](path.replace(/{(.*?)}/g, ':$1'), [
        setDefaultLogger,
        ...(middlewares ?? []),
        ...schemaValidationMiddlewares(validate),
        handler,
      ]);

      let parameters = [];

      if (query) {
        parameters = getDocumentParameters('query', query);
      } else if (params) {
        parameters = getDocumentParameters('path', params);
      }

      let requestBody;

      if (validationBody) {
        requestBody = getDocRequestBody(validationBody, routeOptionBody);
      }

      swaggerDefinition.paths[path] = {
        ...swaggerDefinition.paths[path],
        ...{
          [method]: {
            tags: tags.filter((tag) => tag !== 'api'),
            summary,
            description,
            parameters,
            requestBody,
            responses: {
              200: {
                description: 'Successful execution',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        result: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
              400: {
                description: 'Bad request',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        error: {
                          type: 'string',
                        },
                        message: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
              408: {
                description: 'Request Timeout',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        error: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
              500: {
                description: 'Internal Server Error',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        error: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };
    }

    logger.info(`Registered module /${versionPrefix}/${name}`);
  }

  app.use(
    '/documentation',
    swaggerUI.serve,
    swaggerUI.setup(swaggerDefinition),
  );
};

/**
 * Start node modules installation.
 *
 * @param {express.Express} _app - The application instance.
 */
const run = async (_app) => {
  try {
    app = _app;

    const modules = [];

    modules.push(...(await loadModules(CUSTOM_MODULES_DIR)));
    modules.push(...(await loadModules(SYSTEM_MODULES_DIR)));

    await initRoutes(modules);
  } catch (error) {
    console.error(`Node modules initialization failed: ${error.message}`);
    process.exit(1); // This will stop the container
  }
};

export { run };
