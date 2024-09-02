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
      /**
       * Handles XML to JSON conversion request
       * @param {Object} req - The request object containing XML data in the body and query parameters
       * @param {Object} res - The response object to send the result
       * @returns {Object} The HTTP response with status code and converted JSON or validation error
       */
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
      /**
       * Handles the conversion of JSON to XML
       * @param {Object} req - The request object containing the JSON body and query parameters
       * @param {Object} res - The response object used to send the result
       * @returns {Object} The response object with status and XML data or error message
       */
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
