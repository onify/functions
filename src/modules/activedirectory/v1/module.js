'use strict';

import Joi from 'joi';
import ActiveDirectory from 'activedirectory2';

const module = {
  name: 'activedirectory',
  routes: [
    {
      method: 'GET',
      path: '/activedirectory/users',
      options: {
        description: 'Get users from Active Directory',
        notes:
          'Get users from Active Directory based on filter. Based on https://github.com/jsumners/node-activedirectory.',
        tags: ['api', 'activedirectory'],
        validate: {
          query: Joi.object({
            url: Joi.string()
              .required()
              .description(
                'Active Directory server to connect to, e.g. `ldap://ad.example.com`.'
              ),
            username: Joi.string()
              .required()
              .description(
                'An account name capbable of performing the operations desired, e.g. `test@domain.com`'
              ),
            password: Joi.string()
              .required()
              .description('Password for the given username.'),
            filter: Joi.string()
              .required()
              .description(
                'LDAP filter, e.g. `(&(|(objectClass=user)(objectClass=person))(!(objectClass=computer))(!(objectClass=group)))`'
              ),
            baseDN: Joi.string()
              .required()
              .description(
                'The root DN from which all searches will be performed, e.g. `dc=example,dc=com`.'
              ),
            scope: Joi.string()
              .valid('base', 'one', 'sub')
              .default('base')
              .optional()
              .description('One of base, one, or sub. Defaults to base.'),
            attributes: Joi.array()
              .items(Joi.string().required())
              .optional()
              .default([
                'objectGUID',
                'uSNChanged',
                'manager',
                'mail',
                'displayName',
                'givenName',
                'sn',
                'company',
                'department',
                'telephoneNumber',
                'mobile',
                'title',
                'distinguishedName',
                'sAMAccountName',
                'description',
                'cn',
                'employeeID',
                'userPrincipalName',
              ]),
            paged: Joi.boolean()
              .default(false)
              .optional()
              .description('Enable and/or configure automatic result paging'),
            startFrom: Joi.number()
              .integer()
              .default(0)
              .optional()
              .description(
                'Offset for pagination. When not provided, this method returns the first page only, which means startFrom = 0.'
              ),
            rejectUnauthorized: Joi.boolean()
              .default(false)
              .optional()
              .description(
                'Similar to the `NODE_TLS_REJECT_UNAUTHORIZED` flag. Can be used if you have self signed certs. Only use when connecting to internal systems.'
              ),
            sizeLimit: Joi.number()
              .integer()
              .default(200)
              .max(10000)
              .optional()
              .description(
                'The maximum number of entries to return. Max 10 000 entries.'
              ),
          }),
        },
      },
      /**
       * Handles an asynchronous request to search for users in an Active Directory.
       * @param {Object} req - The request object containing query parameters for AD configuration and search options.
       * @param {Object} res - The response object used to send the result back to the client.
       * @returns {Promise<Object>} A promise that resolves with the search results or rejects with an error.
       */
      handler: async (req, res) => {
        var config = {
          url: req.query.url,
          username: req.query.username,
          password: req.query.password,
          tlsOptions: {
            rejectUnauthorized: req.query.rejectUnauthorized,
          },
        };

        var ad = {};
        try {
          ad = new ActiveDirectory(config);
        } catch (error) {
          req.log.error(err.message);

          return res.response({ error: err.message }).code(500);
        }

        var opts = {
          filter: req.query.filter,
          baseDN: req.query.baseDN,
          scope: req.query.scope,
          paged: req.query.paged,
          sizeLimit: req.query.sizeLimit,
          attributes: req.query.attributes,
        };

        try {
          /**
           * Asynchronously finds users in Active Directory using provided options
           * @param {Object} opts - Options for searching users in Active Directory
           * @returns {Promise<Array>} A promise that resolves to an array of found users
           */
          const users = await new Promise((resolve, reject) => {
            /**
             * Searches for users in Active Directory based on provided options
             * @param {Object} opts - Options for filtering and searching users
             * @param {Function} callback - Callback function to handle the result
             * @returns {Promise} A promise that resolves with the found users or rejects with an error
             */
            ad.findUsers(opts, (error, users) => {
              if (error) {
                return reject(error);
              }
              return resolve(users);
            });
          });
          return res
            .status(200)
            .send(users.slice(req.query.startFrom, req.query.sizeLimit));
        } catch (error) {
          return res.status(500).send({ error: error.message });
        }
      },
    },
  ],
};

export { module };
