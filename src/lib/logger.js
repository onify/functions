'use strict';

import Pino from 'pino';
import pinoHttp from 'pino-http';

const logger = Pino({
  level:
    process.env.NODE_ENV === 'test'
      ? 'silent'
      : process.env.NODE_ENV === 'production'
      ? 'info'
      : 'trace',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: false,
      include: 'level,time',
    },
  },
});

const httpLogger = pinoHttp({ logger, autoLogging: false });

export { httpLogger, logger };
