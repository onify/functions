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
      /**
       * Handles an SFTP file retrieval request asynchronously
       * @param {Object} req - The request object containing query parameters for SFTP connection and file details
       * @param {Object} res - The response object used to send the server's response
       * @returns {Promise<Object>} A promise that resolves with the file content or rejects with an error
       */
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
          /**
           * Retrieves a file using SFTP
           * @param {Object} req - The request object containing query parameters
           * @param {string} req.query.filename - The name of the file to retrieve
           * @returns {Promise<Buffer>} A promise that resolves with the file content as a Buffer
           */
          .then(() => {
            return sftp.get(req.query.filename);
          })
          /**
           * Processes the data received from an SFTP operation
           * @param {Buffer} data - The raw data received from the SFTP operation
           * @returns {Object} An object containing the response content and status code
           */
          .then((data) => {
            const content = data.toString();
            sftp.end();
            return {
              response: content,
              code: 200,
            };
          })
          /**
           * Handles errors in the request processing
           * @param {Error} err - The error object caught during request processing
           * @returns {Response} A response with 500 status code and error message
           */
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
      /**
       * Handles SFTP connection and file listing
       * @param {Object} req - The request object containing query parameters for SFTP connection
       * @param {Object} res - The response object to send the result
       * @returns {Promise<Object>} A promise that resolves with the HTTP response
       */
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
          /**
           * Lists the contents of a specified directory on the SFTP server.
           * @param {string} req.query.path - The path of the directory to list.
           * @returns {Promise<Array>} A promise that resolves to an array of directory contents.
           */
          .then(() => {
            return sftp.list(req.query.path);
          })
          /**
           * Handles the successful completion of an SFTP operation and sends the response
           * @param {Object} data - The data received from the SFTP operation
           * @returns {Object} The HTTP response object with a 200 status and the SFTP operation data
           */
          .then((data) => {
            sftp.end();
            return res.status(200).send(data);
          })
          /**
           * Error handling middleware for catching and logging errors, then sending an appropriate response
           * @param {Error} err - The error object caught in the catch block
           * @returns {Response} A response with 500 status code and the error message
           */
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
