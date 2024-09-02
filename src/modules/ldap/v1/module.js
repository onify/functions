'use strict';

import Joi from 'joi';
import LDAP from 'ldapjs';
import { binarySidToStringSid } from '../../../lib/helpers.js';
import Qs from 'qs';

const module = {
  name: 'ldap',
  routes: [
    {
      method: 'GET',
      path: '/ldap/search',
      options: {
        description: 'Search LDAP server',
        notes:
          'Performs a search operation against the LDAP server. We are using ldapjs npm here. Check http://ldapjs.org for full docs.',
        tags: ['api', 'ldap'],
        validate: {
          query: Joi.object({
            url: Joi.string()
              .required()
              .description(
                'A valid LDAP URL (proto/host/port), e.g. `ldap://ad.example.com`.'
              ),
            username: Joi.string()
              .required()
              .description(
                'An account name capable of performing the operations desired, e.g. `test@domain.com`'
              ),
            password: Joi.string()
              .required()
              .description('Password for the given username.'),
            tlsOptions: Joi.object({
              isServer: Joi.boolean()
                .description(
                  'isServer: The SSL/TLS protocol is asymmetrical, TLSSockets must know if they are to behave as a server or a client. If true the TLS socket will be instantiated as a server. Default: false.'
                )
                .default(false),
              reqCert: Joi.boolean()
                .description(
                  'Whether to authenticate the remote peer by reqing a certificate. Clients always req a server certificate. Servers (isServer is true) may set reqCert to true to req a client certificate. Default: false.'
                )
                .default(false),
              rejectUnauthorized: Joi.boolean()
                .description(
                  'If not false the server will reject any connection which is not authorized with the list of supplied CAs. This option only has an effect if reqCert is true. Default: true.'
                )
                .default(true),
              clientCertEngine: Joi.string().description(
                'Name of an OpenSSL engine which can provide the client certificate.'
              ),
            })
              .optional()
              .description(
                'Additional options passed to TLS connection layer when connecting via ldaps://'
              ),
            base: Joi.string()
              .required()
              .description(
                'The root DN from which all searches will be performed, e.g. `dc=example,dc=com`.'
              ),
            filter: Joi.string()
              .required()
              .description(
                'LDAP filter, e.g. `(&(|(objectClass=user)(objectClass=person))(!(objectClass=computer))(!(objectClass=group)))`'
              ),
            scope: Joi.string()
              .valid('base', 'one', 'sub')
              .default('base')
              .required()
              .description('One of `base`, `one`, or `sub`'),
            attributes: Joi.array()
              .items(Joi.string().required())
              .optional()
              .default(['dn', 'sn', 'cn'])
              .description('Attributes to select and return'),
            raw: Joi.boolean()
              .default(false)
              .description(
                'Either return the raw object (true) or a simplified structure (false)'
              ),
            paged: Joi.boolean()
              .default(false)
              .optional()
              .description('Enable and/or configure automatic result paging'),
            pageSize: Joi.number()
              .integer()
              .default(100)
              .max(10000)
              .optional()
              .description(
                'The pageSize parameter sets the size of result pages reqed from the server.'
              ),
          }),
        },
      },
      middlewares: [
        /**
         * Middleware function to process and transform query parameters
         * @param {Object} req - Express request object
         * @param {Object} res - Express response object
         * @param {Function} next - Express next middleware function
         * @returns {void} This function doesn't return a value, it calls the next middleware
         */
        (req, res, next) => {
          let { tlsOptions, attributes } = req.query;

          if (tlsOptions) {
            tlsOptions = Qs.parse(tlsOptions, {
              delimiter: /[;,]/,
            });

            req.query.tlsOptions = tlsOptions;
          }

          if (attributes && !Array.isArray(attributes)) {
            attributes = [attributes];

            req.query.attributes = attributes;
          }

          next();
        },
      ],
      /**
       * Handles LDAP search request and returns the results
       * @param {Object} req - The request object containing query parameters
       * @param {Object} res - The response object to send the result
       * @returns {Promise<void>} Sends a response with search results or an error message
       */
      handler: async (req, res) => {
        const { url, username, password, tlsOptions } = req.query;

        /**
         * Sets up an LDAP client connection asynchronously
         * @returns {Promise<LDAPClient>} A promise that resolves with the connected LDAP client or rejects with an error
         */
        async function setupClient() {
          /**
           * Creates and connects to an LDAP client
           * @param {string} url - The URL of the LDAP server
           * @param {Object} tlsOptions - TLS options for the LDAP connection
           * @returns {Promise<Object>} A promise that resolves with the connected LDAP client
           */
          return new Promise((resolve, reject) => {
            const client = LDAP.createClient({
              url,
              tlsOptions,
            });

            /**
             * Handles client errors and performs cleanup
             * @param {Error} error - The error object received from the client
             * @returns {void} This function doesn't return a value, it rejects a promise
             */
            const clientErrorListener = (error) => {
              if (client) {
                /**
                 * Unbinds the client and handles any potential errors
                 * @param {function} callback - The callback function to handle the unbind operation result
                 * @param {Error} callback.error - The error object if an error occurred during unbinding
                 * @returns {void} This method does not return a value
                 */
                client.unbind((error) => {
                  if (error) {
                    req.log.warn(error.message);
                  }
                });
              }

              reject(error);
            };

            client.on('error', clientErrorListener);

            /**
             * Sets up a connection event listener for the client
             * @param {Function} clientErrorListener - The error listener to be removed upon successful connection
             * @returns {Promise<Client>} A promise that resolves with the connected client
             */
            client.on('connect', () => {
              client.removeListener('error', clientErrorListener);
              resolve(client);
            });
          });
        }

        const { filter, base, scope, attributes, raw, paged, pageSize } =
          req.query;
        const options = {
          filter,
          scope,
          attributes,
          paged: paged ? { pageSize, pagePause: true } : false,
        };

        try {
          const client = await setupClient();

          /**
           * Simplifies an array of row objects by extracting and flattening specific properties.
           * @param {Array} rows - An array of row objects to be simplified.
           * @returns {Array} An array of simplified objects with flattened attributes.
           */
          function simplify(rows) {
            /**
             * Processes rows of data and transforms them into an array of objects with specific properties.
             * @param {Array} rows - An array of row objects containing objectName, objectSid, objectGUID, and attributes.
             * @returns {Array} An array of objects with properties extracted and transformed from the input rows.
             */
            return rows.reduce((accumulator, row) => {
              const { objectName, objectSid, objectGUID, attributes } = row;

              let obj = {
                objectName,
              };

              if (objectSid) {
                obj.objectSid = objectSid;
              }

              if (objectGUID) {
                obj.objectGUID = objectGUID;
              }

              for (const attribute of attributes) {
                const { type, values } = attribute;

                for (const value of values) {
                  obj[type] = value;
                }
              }

              accumulator.push(obj);

              return accumulator;
            }, []);
          }

          /**
           * Performs an asynchronous login operation using LDAP authentication.
           * @param {void} - This function doesn't accept any parameters directly.
           * @returns {Promise<void>} A promise that resolves if the login is successful, or rejects with an error if authentication fails.
           */
          async function login() {
            /**
             * Performs LDAP authentication using the provided username and password
             * @param {string} username - The username for LDAP authentication
             * @param {string} password - The password for LDAP authentication
             * @returns {Promise<void>} A promise that resolves if authentication is successful, or rejects with an error if authentication fails
             */
            return new Promise((resolve, reject) => {
              /**
               * Binds the client with the provided username and password
               * @param {string} username - The username for authentication
               * @param {string} password - The password for authentication
               * @param {function} callback - The callback function to handle the binding result
               * @returns {Promise} A promise that resolves if binding is successful, or rejects with an error if binding fails
               */
              client.bind(username, password, (error) => {
                if (error) {
                  error.statusCode = 401;
                  reject(error);
                }

                resolve();
              });
            });
          }

          /**
           * Performs an asynchronous LDAP search operation and normalizes the results.
           * @returns {Promise<Array>} A promise that resolves to an array of normalized search results.
           *                           If 'raw' is false, the results are simplified and certain binary
           *                           fields (objectSid, objectGUID) are converted to string format.
           *                           If 'raw' is true, the original result objects are returned.
           */
          async function search() {
            /**
             * Performs an LDAP search operation and normalizes the results.
             * @param {Object} client - The LDAP client object.
             * @param {string} base - The search base for the LDAP query.
             * @param {Object} options - The search options for the LDAP query.
             * @param {boolean} raw - Flag to determine if the results should be returned in raw format.
             * @returns {Promise<Array>} A promise that resolves to an array of normalized LDAP search results.
             */
            return new Promise((resolve, reject) => {
              /**
               * Performs an LDAP search operation and processes the results.
               * @param {Object} client - The LDAP client object.
               * @param {string} base - The search base for the LDAP query.
               * @param {Object} options - Search options for the LDAP query.
               * @param {Function} callback - Callback function to handle the search results.
               * @returns {Promise<Array>} A promise that resolves to an array of normalized LDAP entries.
               */
              client.search(base, options, (error, result) => {
                let rows = [];

                /**
                 * Normalizes rows by converting binary SIDs and GUIDs to string format, and optionally simplifies the data structure.
                 * @param {void} - This function doesn't take any parameters directly, but operates on global variables 'rows' and 'raw'.
                 * @returns {Array} An array of normalized and optionally simplified row objects.
                 */
                function normalizeRows() {
                  try {
                    for (const row of rows) {
                      if (!raw) {
                        if (row.objectSid) {
                          row.objectSid = binarySidToStringSid(
                            Buffer.from(row.objectSid, 'binary')
                          );
                        }

                        if (row.objectGUID) {
                          row.objectGUID = binarySidToStringSid(
                            Buffer.from(row.objectGUID, 'binary')
                          );
                        }
                      }
                    }

                    return !raw ? simplify(rows) : rows;
                  } catch (error) {
                    reject(error);
                  }
                }

                /**
                 * Handles the 'searchEntry' event for LDAP search results
                 * @param {Object} entry - The search entry object containing LDAP attribute information
                 * @returns {void} This method doesn't return a value, it adds the entry to the rows array
                 */
                result.on('searchEntry', (entry) => {
                  rows.push(entry.pojo);
                });

                /**
                 * Handles errors emitted by the result object
                 * @param {Error} error - The error object emitted by the result
                 * @returns {void} This function doesn't return a value, it rejects a promise
                 */
                result.on('error', (error) => {
                  reject(error);
                });

                /**
                 * Handles the end event of the result stream and performs cleanup tasks
                 * @param {Function} resolve - The resolve function of a Promise
                 * @returns {void} This function doesn't return a value
                 */
                result.on('end', () => {
                  /**
                   * Unbinds the client and handles any potential errors
                   * @param {Function} callback - The callback function to handle errors
                   * @returns {void} This method doesn't return a value
                   */
                  client.unbind((error) => {
                    if (error) {
                      // Logger.warn(error.message);
                    }
                  });

                  resolve(normalizeRows());
                });

                /**
                 * Handles the 'page' event of the result object and performs cleanup actions
                 * @param {Function} resolve - The resolve function to be called with normalized rows
                 * @returns {void} This method doesn't return a value
                 */
                result.on('page', () => {
                  /**
                   * Unbinds the client and handles any potential errors
                   * @param {function} callback - The callback function to handle the unbind result
                   * @param {Error|null} callback.error - The error object if an error occurred, null otherwise
                   * @returns {void} This method does not return a value
                   */
                  client.unbind((error) => {
                    if (error) {
                      // Logger.warn(error.message);
                    }
                  });

                  resolve(normalizeRows());
                });

                if (error) {
                  reject(error);
                }
              });
            });
          }

          await login();
          let result = await search();

          return res.status(200).send(result);
        } catch (error) {
          // Logger.error(error.message);
          return res
            .status(error.statusCode ?? 500)
            .send({ error: error.message });
        }
      },
    },
  ],
};

export { module };
