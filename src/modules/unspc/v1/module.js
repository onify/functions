'use strict';

import Joi from 'joi';
import Fs from 'fs';
import Papa from 'papaparse';

const unspscCodesFilename = './resources/unspsc/data-unspsc-codes.csv';

const module = {
  name: 'unspsc',
  routes: [
    {
      method: 'POST',
      path: '/unspsc/names',
      options: {
        description: 'Get names by codes',
        notes: 'Get names by UNSPSC® codes',
        tags: ['api', 'unspsc'],
        validate: {
          body: Joi.array()
            .items(Joi.string())
            .required()
            .description('UNSPSC® codes'),
          query: Joi.object({
            includeMeta: Joi.boolean()
              .default(true)
              .optional()
              .description('Includes Segment, Family, Class'),
            deepSearch: Joi.boolean()
              .default(true)
              .optional()
              .description(
                'Also search for code in Segment, Family, Class. Otherwise only Commodity.'
              ),
          }),
        },
      },
      /**
       * Handles UNSPSC code lookup requests and returns corresponding names and metadata
       * @param {Object} req - The request object containing query parameters and body
       * @param {Object} res - The response object for sending back the result
       * @returns {Object} An object with UNSPSC codes as keys and their corresponding names and optional metadata as values
       */
      handler: function (req, res) {
        let csv;
        try {
          csv = Fs.readFileSync(unspscCodesFilename, { encoding: 'utf-8' });
          const csvData = Papa.parse(csv, { header: true }).data;
          let result = {};
          /**
           * Processes an array of commodity codes and retrieves corresponding metadata
           * @param {Object} req - The request object containing body and query parameters
           * @param {Array} req.body - An array of commodity codes to process
           * @param {boolean} req.query.deepSearch - Flag to enable deep search across different levels
           * @param {boolean} req.query.includeMeta - Flag to include full metadata in the result
           * @param {Array} csvData - The dataset containing commodity information
           * @returns {Object} An object with commodity codes as keys and their corresponding information as values
           */
          req.body.forEach((code) => {
            /**
             * Filters the csvData array to find the first item with a matching Commodity code
             * @param {Array} csvData - An array of objects containing CSV data
             * @param {string} code - The Commodity code to search for
             * @returns {Object|undefined} The first matching item from csvData, or undefined if not found
             */
            let meta = csvData.filter((data) => data.Commodity === code)[0];
            let name = meta ? meta['Commodity Name'] : null;
            if (req.query.deepSearch) {
              if (!meta) {
                /**
                 * Filters the csvData array to find the first element with a matching Class property
                 * @param {Array} csvData - An array of objects containing CSV data
                 * @param {string} code - The Class value to filter by
                 * @returns {Object|undefined} The first matching object from csvData, or undefined if no match is found
                 */
                meta = csvData.filter((data) => data.Class === code)[0];
                name = meta ? meta['Class Name'] : null;
              }
              if (!meta) {
                /**
                 * Filters the csvData array to find the first entry matching the specified family code
                 * @param {Array} csvData - An array of objects containing CSV data
                 * @param {string} code - The family code to filter by
                 * @returns {Object|undefined} The first matching object from csvData, or undefined if no match is found
                 */
                meta = csvData.filter((data) => data.Family === code)[0];
                name = meta ? meta['Family Name'] : null;
              }
              if (!meta) {
                /**
                 * Filters the csvData array to find the first element with a matching Segment value
                 * @param {Array} csvData - An array of objects containing CSV data
                 * @param {string} code - The Segment value to filter by
                 * @returns {Object|undefined} The first matching object from csvData, or undefined if no match is found
                 */
                meta = csvData.filter((data) => data.Segment === code)[0];
                name = meta ? meta['Segment Name'] : null;
              }
            }
            result[code] = { name: name };
            if (req.query.includeMeta) {
              result[code].meta = meta;
            }
          });
          return result;
        } catch (err) {
          req.log.error(err.message);
          return res.status(500).json({ error: err.message });
        }
      },
    },
    {
      method: 'GET',
      path: '/unspsc/{code}',
      options: {
        description: 'Get name by code',
        notes: 'Get name by UNSPSC® code',
        tags: ['api', 'unspsc'],
        validate: {
          params: Joi.object({
            code: Joi.string().description('UNSPSC® code'),
          }),
          query: Joi.object({
            includeMeta: Joi.boolean()
              .default(true)
              .optional()
              .description('Includes Segment, Family, Class'),
            deepSearch: Joi.boolean()
              .default(true)
              .optional()
              .description(
                'Also search for code in Segment, Family, Class. Otherwise only Commodity.'
              ),
          }),
        },
      },
      /**
       * Handles requests for UNSPSC code information
       * @param {Object} req - The request object
       * @param {Object} res - The response object
       * @param {string} req.params.code - The UNSPSC code to search for
       * @param {boolean} [req.query.deepSearch] - Whether to perform a deep search across different levels
       * @param {boolean} [req.query.includeMeta] - Whether to include metadata in the response
       * @returns {Object} The response containing the name and optionally metadata for the UNSPSC code
       */
      handler: function (req, res) {
        let csv;
        try {
          csv = Fs.readFileSync(unspscCodesFilename, { encoding: 'utf-8' });
          const csvData = Papa.parse(csv, { header: true }).data;
          const code = req.params.code;
          /**
           * Filters the csvData array to find the first element with a matching Commodity code
           * @param {Array} csvData - An array of objects containing CSV data
           * @param {string} code - The Commodity code to search for
           * @returns {Object|undefined} The first matching object from csvData, or undefined if no match is found
           */
          let meta = csvData.filter((data) => data.Commodity === code)[0];
          let name = meta ? meta['Commodity Name'] : null;
          if (req.query.deepSearch) {
            if (!meta) {
              /**
               * Filters csvData to find the first element with a matching Class value
               * @param {Array} csvData - An array of objects containing CSV data
               * @param {string} code - The Class value to filter by
               * @returns {Object|undefined} The first matching object from csvData, or undefined if no match is found
               */
              meta = csvData.filter((data) => data.Class === code)[0];
              name = meta ? meta['Class Name'] : null;
            }
            if (!meta) {
              /**
               * Filters the csvData array to find the first element with a matching Family property
               * @param {Array} csvData - An array of objects containing CSV data
               * @param {string} code - The Family code to filter by
               * @returns {Object|undefined} The first matching object from csvData, or undefined if no match is found
               */
              meta = csvData.filter((data) => data.Family === code)[0];
              name = meta ? meta['Family Name'] : null;
            }
            if (!meta) {
              /**
               * Filters csvData to find the first row where the Segment matches the given code
               * @param {Array} csvData - An array of objects representing CSV data
               * @param {string} code - The Segment code to filter by
               * @returns {Object|undefined} The first matching row object, or undefined if no match is found
               */
              meta = csvData.filter((data) => data.Segment === code)[0];
              name = meta ? meta['Segment Name'] : null;
            }
          }
          let result = { name: name };
          if (!name) {
            return res.status(404).send(result);
          }
          if (req.query.includeMeta) {
            result.meta = meta;
          }

          return res.status(200).send(result);
        } catch (err) {
          req.log.error(err.message);
          return res.status(500).json({ error: err.message });
        }
      },
    },
  ],
};

export { module };
