'use strict';

import Joi from 'joi';
import readXlsxFile, { Email, Integer, URL } from 'read-excel-file/node';
import { existsSync, rmSync } from 'fs';

const module = {
  name: 'excel',
  routes: [
    {
      method: 'POST',
      path: '/excel/read',
      options: {
        description: 'Read excel file and return data in JSON-format',
        notes:
          'Parse uploaded excel file and return contents in JSON-format. Please see https://www.npmjs.com/package/read-excel-file for more details parser.',
        tags: ['api', 'excel'],
        body: {
          multipart: {
            output: 'file',
          },
          allow: 'multipart/form-data',
          maxBytes: 5242880, // 5mb default limit. Large file may be chunked in a separate hub-function.
        },
        validate: {
          body: Joi.object({
            schema: Joi.object()
              .optional()
              .description(
                'This should be valid JSON, see https://gitlab.com/catamphetamine/read-excel-file#json for more information. Eg. `{"firstname":{"prop":"First name","type":"String"},"lastname":{"prop":"Last name","type":"String"},"email":{"prop":"E-mail","type":"String"}}`'
              ),
            sheet: Joi.string()
              .allow('')
              .optional()
              .description(
                'By default, it reads the first sheet in the document. If you have multiple sheets in your spreadsheet then pass sheet name.'
              ),
            file: Joi.object()
              .required()
              .description('The excel file to be read.'),
          }),
        },
      },
      middlewares: [
        (req, res, next) => {
          function getParsedType(type) {
            switch (type) {
              case 'String':
                return String;
              case 'Number':
                return Number;
              case 'Boolean':
                return Boolean;
              case 'Date':
                return Date;
              case 'Integer':
                return Integer;
              case 'Email':
                return Email;
              case 'URL':
                return URL;
              default:
                return type;
            }
          }

          const { schema } = req.body;

          try {
            let parsedSchema = schema ? JSON.parse(schema) : {};

            for (const key of Object.keys(parsedSchema)) {
              const _parsedSchema = parsedSchema[key];

              if (_parsedSchema.type) {
                _parsedSchema.type = getParsedType(_parsedSchema.type);
              }
            }

            req.body.schema = parsedSchema;
          } catch (error) {
            // do nothing
          }

          next();
        },
      ],
      handler: async (req, res) => {
        const { file, sheet } = req.body;
        let { schema } = req.body;

        try {
          if (Object.keys(schema).length === 0) {
            schema = await readXlsxFile(file.path).then((rows) => {
              const obj = {};

              for (const key of rows[0]) {
                obj[key] = {
                  prop: key,
                  type: String,
                };
              }

              return obj;
            });
          }

          const options = { schema };

          Object.assign(options, { sheet: !!sheet ? sheet : 1 });

          const records = await readXlsxFile(file.path, options);

          if (existsSync(file.path)) {
            rmSync(file.path);
          }

          return res.status(200).send(records);
        } catch (error) {
          const { message } = error;

          if (existsSync(file.path)) {
            rmSync(file.path);
          }

          req.log.error(message);
          return res.status(500).send({ error: message });
        }
      },
    },
  ],
};

export { module };
