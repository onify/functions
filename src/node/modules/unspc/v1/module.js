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
      handler: function (req, res) {
        let csv;
        try {
          csv = Fs.readFileSync(unspscCodesFilename, { encoding: 'utf-8' });
          const csvData = Papa.parse(csv, { header: true }).data;
          let result = {};
          req.body.forEach((code) => {
            let meta = csvData.filter((data) => data.Commodity === code)[0];
            let name = meta ? meta['Commodity Name'] : null;
            if (req.query.deepSearch) {
              if (!meta) {
                meta = csvData.filter((data) => data.Class === code)[0];
                name = meta ? meta['Class Name'] : null;
              }
              if (!meta) {
                meta = csvData.filter((data) => data.Family === code)[0];
                name = meta ? meta['Family Name'] : null;
              }
              if (!meta) {
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
      handler: function (req, res) {
        let csv;
        try {
          csv = Fs.readFileSync(unspscCodesFilename, { encoding: 'utf-8' });
          const csvData = Papa.parse(csv, { header: true }).data;
          const code = req.params.code;
          let meta = csvData.filter((data) => data.Commodity === code)[0];
          let name = meta ? meta['Commodity Name'] : null;
          if (req.query.deepSearch) {
            if (!meta) {
              meta = csvData.filter((data) => data.Class === code)[0];
              name = meta ? meta['Class Name'] : null;
            }
            if (!meta) {
              meta = csvData.filter((data) => data.Family === code)[0];
              name = meta ? meta['Family Name'] : null;
            }
            if (!meta) {
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
