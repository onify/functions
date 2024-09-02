'use strict';

import Joi from 'joi';
import sql from 'mssql';

const module = {
  name: 'mssql',
  routes: [
    {
      method: 'GET',
      path: '/mssql/query',
      options: {
        description: 'Microsoft SQL Server Query',
        notes: 'Query Microsoft SQL Server',
        tags: ['api', 'mssql'],
        validate: {
          query: Joi.object({
            server: Joi.string().required(),
            query: Joi.string().required(),
            port: Joi.number().required().default('1433').optional(),
            encrypt: Joi.boolean().required().default(false).optional(),
            trustServerCertificate: Joi.boolean()
              .required()
              .default(false)
              .optional(),
            database: Joi.string().required(),
            username: Joi.string().required(),
            password: Joi.string().required(),
          }),
        },
      },
      /**
       * Handles database connection and query execution based on request parameters
       * @param {Object} req - The request object containing query parameters for database connection and SQL query
       * @param {Object} res - The response object used to send the result back to the client
       * @returns {Promise<void>} Sends a response with the query result or error message
       */
      handler: async (req, res) => {
        const sqlConfig = {
          user: req.query.username,
          password: req.query.password,
          database: req.query.database,
          server: req.query.server,
          options: {
            encrypt: req.query.encrypt,
            trustServerCertificate: req.query.trustServerCertificate,
          },
        };
        let r = await sql
          .connect(sqlConfig)
          /**
           * Executes a SQL query on the database pool
           * @param {Object} pool - The database connection pool
           * @param {string} req.query.query - The SQL query to execute
           * @returns {Promise<Object>} A promise that resolves with the query results
           */
          .then((pool) => {
            return pool.request().query(req.query.query);
          })
          ```
          /**
           * Processes the result of a database query and returns a formatted response object
           * @param {Object} result - The result object from the database query
           * @returns {Object} An object containing the query response and HTTP status code
           */
          
          ```          .then((result) => {
            return {
              response: result.recordset,
              code: 200,
            };
          })
          /**
           * Handles errors in an asynchronous operation
           * @param {Error} err - The error object caught in the catch block
           * @returns {Object} An object containing the error response and status code
           */
          .catch((err) => {
            req.log.error(err.message);
            return {
              response: {
                error: err.message,
              },
              code: 500,
            };
          });
        return res.status(r.code).send(r.response);
      },
    },
  ],
};

export { module };
