'use strict';

import Joi from 'joi';
import { mergeImportData } from './mergeDataFunctions.js';

const allowedKeys = [
  'agent', 'dashboard', 'domain', 'form', 'locale', 'role',
  'workflow', 'user', 'guide', 'bulletin', 'option',
  'shortcut', 'workspace'
];

const importObjectSchema = Joi.object(
  allowedKeys.reduce((schema, key) => {
    schema[key] = Joi.array().items(Joi.object()).optional();
    return schema;
  }, {})
).description('The JSON object must be in the import format');

const module = {
  name: 'onify',
  routes: [
    {
      method: 'POST',
      path: '/onify/mergeImportData',
      options: {
        description: 'Merge source (from) import data into target (to) data',
        notes: 'Takes two JSON import objects (from /setup/database/config/export) as input and merges the source into the target based on the specified options',
        tags: ['api', 'onify'],
        validate: {
          body: Joi.object({
            source: importObjectSchema.required().description('The source JSON object (current environment)'),
            target: importObjectSchema.required().description('The target JSON object (target environment)'),
          }),
          query: Joi.object({
            overwrite: Joi.boolean().optional().default(false),
            appendArrayValues: Joi.boolean().optional().default(false),
            excludeAttributes: Joi.array().items(Joi.string()).optional().default(["createdate", "createdby", "modifieddate", "modifiedby"]),
          }).optional().description('Merge options'),
        },
      },
      handler: (req, res) => {
        const { source, target } = req.body;
        const options = req.query;

        try {
          const mergeResult = mergeImportData({ source, target, ...options });
          return res.status(200).send({
            updates: mergeResult.updates,
            report: mergeResult.report,
            htmlReport: mergeResult.htmlReport,
          });
        }
        catch (err) {
          return res.status(500).send({ error: err.message });
        }
      },
    },
  ],
};

export { module };
