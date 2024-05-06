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
          .then((pool) => {
            return pool.request().query(req.query.query);
          })
          .then((result) => {
            return {
              response: result.recordset,
              code: 200,
            };
          })
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
