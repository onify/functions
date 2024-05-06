'use strict';

import Joi from 'joi';
import { XMLParser, XMLValidator, XMLBuilder } from 'fast-xml-parser';

const module = {
  name: 'convert',
  routes: [
    {
      method: 'POST',
      path: '/convert/xml/json',
      options: {
        description: 'Convert XML content to JSON',
        notes: 'Converts XML content and returns JSON',
        tags: ['api', 'convert'],
        body: {
          allow: 'text/plain',
        },
        validate: {
          body: Joi.string().required().description('XML content'),
          query: Joi.object({
            ignoreAttributes: Joi.boolean().required().optional().default(true),
          }),
        },
      },
      handler: (req, res) => {
        const resultValidator = XMLValidator.validate(req.body);

        if (resultValidator !== true) {
          return res.status(500).send(resultValidator);
        }
        const convertOptions = {
          ignoreAttributes: req.query.ignoreAttributes,
        };
        const converter = new XMLParser(convertOptions);
        let jsonObj = converter.parse(req.body);
        return res.status(200).send(jsonObj);
      },
    },
    {
      method: 'POST',
      path: '/convert/json/xml',
      options: {
        description: 'Convert JSON content to XML',
        notes: 'Converts JSON content and returns XML',
        tags: ['api', 'convert'],
        body: {
          allow: 'text/plain',
        },
        validate: {
          body: Joi.string().required().description('JSON content'),
          query: Joi.object({
            ignoreAttributes: Joi.boolean().required().optional().default(true),
          }),
        },
      },
      handler: (req, res) => {
        let jsonObj;
        try {
          jsonObj = JSON.parse(req.body);
        } catch (err) {
          return res.status(500).send({ error: err.message });
        }
        const convertOptions = {
          ignoreAttributes: req.query.ignoreAttributes,
        };
        const builder = new XMLBuilder(convertOptions);
        const xmlDataStr = builder.build(jsonObj);
        return res.status(200).send(xmlDataStr);
      },
    },
  ],
};

export { module };
