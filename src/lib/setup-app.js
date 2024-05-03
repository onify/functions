'use strict';

import express from 'express';
import dotenv from 'dotenv';
import { run as nodeRun } from '../node/start.js';
import { logger, httpLogger } from './logger.js';

dotenv.config();

const port = process.env.PORT || 8585;
const resourceURL = `${process.env.ONIFY_API_URL}/admin/resources/file?stream=false&path=`;
const listResourcesURL = `${process.env.ONIFY_API_URL}/admin/resources?tree=true`;
const resourcesHistoryURL = `${process.env.ONIFY_API_URL}/admin/resources/history`;
const apiAdminToken = process.env.ONIFY_API_TOKEN;
const fetchResources = process.env.ONIFY_API_RESOURCES === 'true';
const resourcesSource = process.env.ONIFY_API_RESOURCES_SOURCE || '/';
const resourcesDestination =
  process.env.ONIFY_API_RESOURCES_DESTINATION || '/custom/resources';
const config = {
  port,
};

async function setupApp() {
  const app = express();
  app.use(httpLogger);

  // Increase the limit for JSON payloads
  app.use(
    express.json({ limit: '50mb', extended: true, parameterLimit: 50000 })
  );

  // Increase the limit for plain text payloads
  app.use(
    express.text({ limit: '50mb', extended: true, parameterLimit: 50000 })
  );

  await nodeRun(app);
  // await pwshRun(app); TODO: To be implemented

  app.listen(port, () => {
    logger.info(
      `Server is running on port ${port} in ${process.env.NODE_ENV} mode.`
    );
  });
  return app;
}

export { setupApp, config };
