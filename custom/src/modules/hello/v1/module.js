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
      /**
       * Handles a request and sends a greeting response.
       * @param {Object} req - The request object containing query parameters.
       * @param {Object} res - The response object used to send the HTTP response.
       * @returns {Object} The response object with a 200 status code and a greeting message.
       */
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
      /**
       * Handles HTTP requests and responds with a greeting
       * @param {Object} req - The request object containing method, path, and params
       * @param {Object} res - The response object used to send the HTTP response
       * @returns {Object} JSON object containing a greeting with the name from the request parameters
       */
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
      ```
      /**
       * Handles an HTTP request and responds with a greeting
       * @param {Object} req - The request object containing information about the HTTP request
       * @param {Object} res - The response object used to send the HTTP response
       * @returns {Object} The response object with a 201 status code and a greeting message
       */
      ```
      handler: (req, res) => {
        req.log.debug(`Request ${req.method.toUpperCase()} ${req.path}`);

        return res.status(201).send({ hello: req.body.name });
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
      /**
       * Handles a request and responds with a customized greeting and comment
       * @param {Object} req - The request object containing method, path, params, and body
       * @param {Object} res - The response object used to send the result
       * @returns {Object} The response object with status 200 and a JSON payload containing a greeting and comment
       */
      handler: (req, res) => {
        req.log.debug(`Request ${req.method.toUpperCase()} ${req.path}`);

        const result = {
          hello: req.params.name,
          comment: req.body.comment,
        };

        return res.status(200).send(result);
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
      /**
       * Handles HTTP requests and responds with a farewell message
       * @param {Object} req - The request object containing method, path, and params
       * @param {Object} res - The response object used to send the result
       * @returns {Object} The response object with status 200 and a farewell message
       */
      handler: (req, res) => {
        req.log.debug(`Request ${req.method.toUpperCase()} ${req.path}`);

        const result = {
          'bye bye': req.params.name,
        };

        return res.status(200).send(result);
      },
    },
  ],
};

export { module };
