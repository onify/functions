'use strict';

import Joi from 'joi';
import Client from 'ssh2-sftp-client';

const module = {
  name: 'sftp',
  routes: [
    {
      method: 'GET',
      path: '/sftp/readfile',
      options: {
        description: 'Read file from STFP server',
        notes: 'Reads file from SFTP server and returns raw content.',
        tags: ['api', 'sftp'],
        validate: {
          query: Joi.object({
            filename: Joi.string().required(),
            host: Joi.string()
              .required()
              .description('Hostname or IP of server'),
            port: Joi.number()
              .required()
              .default('22')
              .optional()
              .description('Port number of the server'),
            username: Joi.string()
              .required()
              .description('Username for authentication'),
            password: Joi.string()
              .required()
              .description('Password for password-based user authentication'),
          }),
        },
      },
      handler: async (req, res) => {
        let sftp = new Client();
        let r = await sftp
          .connect({
            // options
            host: req.query.host,
            port: req.query.port,
            username: req.query.username,
            password: req.query.password,
          })
          .then(() => {
            return sftp.get(req.query.filename);
          })
          .then((data) => {
            const content = data.toString();
            sftp.end();
            return {
              response: content,
              code: 200,
            };
          })
          .catch((err) => {
            req.log.error(err.message);
            return res.status(500).send(err.message);
          });
        return res.status(r.code).send(r.response);
      },
    },
    {
      method: 'GET',
      path: '/sftp/list',
      options: {
        description: 'List files/folders on STFP server',
        notes:
          'List files and folders in selected folder on SFTP server and returns array of files.',
        tags: ['api', 'sftp'],
        validate: {
          query: Joi.object({
            path: Joi.string().required().description('Remote directory path'),
            host: Joi.string()
              .required()
              .description('Hostname or IP of server'),
            port: Joi.number()
              .required()
              .default('22')
              .optional()
              .description('Port number of the server'),
            username: Joi.string()
              .required()
              .description('Username for authentication'),
            password: Joi.string()
              .required()
              .description('Password for password-based user authentication'),
          }),
        },
      },
      handler: async (req, res) => {
        let sftp = new Client();
        let r = await sftp
          .connect({
            // options
            host: req.query.host,
            port: req.query.port,
            username: req.query.username,
            password: req.query.password,
          })
          .then(() => {
            return sftp.list(req.query.path);
          })
          .then((data) => {
            sftp.end();
            return res.status(200).send(data);
          })
          .catch((err) => {
            req.log.error(err.message);
            return res.status(500).send(err.message);
          });

        return res.status(r.code).send(r.response);
      },
    },
  ],
};

export { module };
