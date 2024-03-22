import Joi from 'joi';

const module = {
  name: 'hello',
  routes: [
    {
      method: 'GET',
      path: '/hello',
      options: {
        description: 'Says hello with query name!',
        notes: 'Say hello to {name}',
        tags: ['api', 'hello'],
        validate: {
          query: Joi.object({
            name: Joi.string()
              .required()
              .default('world')
              .description('What is your name?'),
          }),
        },
      },
      handler: (req, res) => {
        return res.status(200).send({ hello: req.query.name });
      },
    },
    {
      method: 'GET',
      path: '/hello/{name}',
      options: {
        description: 'Says hello!',
        notes: 'Say hello to {name}',
        tags: ['api', 'hello'],
        validate: {
          params: Joi.object({
            name: Joi.string().description('What is your name?'),
          }),
        },
      },
      handler: (req, res) => {
        req.log.debug(`Request ${req.method.toUpperCase()} ${req.path}`);

        return res.status(200).send({ hello: req.params.name });
      },
    },
    {
      method: 'POST',
      path: '/hello',
      options: {
        description: 'Says hello!',
        notes: 'Say hello to {name}',
        tags: ['api', 'hello'],
        validate: {
          body: Joi.object({
            name: Joi.string().required().description('What is your name?'),
          }),
        },
      },
      handler: (req, res) => {
        req.log.debug(`Request ${req.method.toUpperCase()} ${req.path}`);

        return res.status(200).send({ hello: req.body.name });
      },
    },
    {
      method: 'PUT',
      path: '/hello/{name}',
      options: {
        description: 'Says hello!',
        notes: 'Say hello to {name}',
        tags: ['api', 'hello'],
        validate: {
          params: Joi.object({
            name: Joi.string().description('What is your name?'),
          }),
          body: Joi.object({
            comment: Joi.string().optional().description('Say something more?'),
          }),
        },
      },
      handler: (req, res) => {
        req.log.debug(`Request ${req.method.toUpperCase()} ${req.path}`);

        const result = {
          hello: req.params.name,
          comment: req.body.comment,
        };

        return res.status(201).send(result);
      },
    },
    {
      method: 'DELETE',
      path: '/hello/{name}',
      options: {
        description: 'Says bye bye!',
        notes: 'Say bye bye to {name}',
        tags: ['api', 'hello'],
        validate: {
          params: Joi.object({
            name: Joi.string().description('Say bye bye to?'),
          }),
        },
      },
      handler: (req, res) => {
        req.log.debug(`Request ${req.method.toUpperCase()} ${req.path}`);

        const result = {
          'bye bye': req.params.name,
        };

        return res.status(201).send(result);
      },
    },
  ],
};

export { module };
