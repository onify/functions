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
      handler: async (req, res) => {
        const { url, username, password, tlsOptions } = req.query;

        async function setupClient() {
          return new Promise((resolve, reject) => {
            const client = LDAP.createClient({
              url,
              tlsOptions,
            });

            const clientErrorListener = (error) => {
              if (client) {
                client.unbind((error) => {
                  if (error) {
                    req.log.warn(error.message);
                  }
                });
              }

              reject(error);
            };

            client.on('error', clientErrorListener);

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

          function simplify(rows) {
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

          async function login() {
            return new Promise((resolve, reject) => {
              client.bind(username, password, (error) => {
                if (error) {
                  error.statusCode = 401;
                  reject(error);
                }

                resolve();
              });
            });
          }

          async function search() {
            return new Promise((resolve, reject) => {
              client.search(base, options, (error, result) => {
                let rows = [];

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

                result.on('searchEntry', (entry) => {
                  rows.push(entry.pojo);
                });

                result.on('error', (error) => {
                  reject(error);
                });

                result.on('end', () => {
                  client.unbind((error) => {
                    if (error) {
                      // Logger.warn(error.message);
                    }
                  });

                  resolve(normalizeRows());
                });

                result.on('page', () => {
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