'use strict';

import express from 'express';
import dotenv from 'dotenv';
import { run as nodeRun } from '../start.js';
import { resolve, join } from 'path';
import { logger, httpLogger } from './logger.js';
import { request } from './http-request.js';
import { rmSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import packageJson from '../../package.json' assert { type: 'json' };

dotenv.config();

const rootDir = resolve();
let allResources = null; // This will store the entire resources tree.

const port = process.env.PORT || 8585;
const resourcesSource = process.env.ONIFY_API_RESOURCES_SOURCE || '/';
const resourceURL = `${process.env.ONIFY_API_URL}/admin/resources/file?stream=false&path=${resourcesSource}`;
const listResourcesURL = `${process.env.ONIFY_API_URL}/admin/resources?tree=true`;
const resourcesHistoryURL = `${process.env.ONIFY_API_URL}/admin/resources/history`;
const apiAdminToken = process.env.ONIFY_API_TOKEN;
const fetchResources = process.env.ONIFY_API_RESOURCES_DOWNLOAD === 'true';
const resourcesDestination =
  process.env.ONIFY_API_RESOURCES_DESTINATION || '/custom/resources';
const resourcesPath = join(rootDir, resourcesDestination);
const resourcesPullInterval =
  (process.env.ONIFY_API_RESOURCES_PULL_INTERVAL || 30) * 60 * 1000;
const commitIDFilepath = join(resourcesPath, '/commitId.txt');

const config = {
  port,
  resourceURL,
  listResourcesURL,
  apiAdminToken,
  resourcesPullInterval,
  resourcesHistoryURL,
  resourcesPath,
  commitIDFilepath,
  resourcesSource,
  fetchResources,
};

function findItemByPath(itemList, path) {
  for (const item of itemList) {
    if (item.path === path) {
      return item;
    }
    if (item.children && item.type === 'directory') {
      const foundItem = findItemByPath(item.children, path);
      if (foundItem) return foundItem;
    }
  }
  return null;
}

async function downloadFile(resourcePath, destinationPath) {
  const url = `${resourceURL}${encodeURIComponent(resourcePath)}`;

  const response = await request({
    method: 'GET',
    url,
    headers: {
      Authorization: apiAdminToken,
    },
  });

  // Decode the base64 content
  const decodedContent = Buffer.from(
    response.result.content,
    'base64'
  ).toString('utf-8');

  // Save the decoded content as a utf-8 encoded file. Creating the directory if it doesn't exist.
  mkdirSync(path.dirname(destinationPath), {
    recursive: true,
  });

  writeFileSync(destinationPath, decodedContent, { encoding: 'utf-8' });
}

function localPathFromResourcePath(resourcePath) {
  return join(resourcesPath, resourcePath.slice(1));
}

const downloadResourcesFromFolder = async (folderPath) => {
  if (!allResources) {
    const response = await request({
      method: 'GET',
      url: listResourcesURL,
      headers: {
        Authorization: apiAdminToken,
      },
    });

    allResources = response.result;

    if (response.statusCode !== 200) {
      throw new Error(
        `Failed to fetch resources. ${
          allResources.errors
            ? JSON.stringify(allResources.errors, null, 2)
            : ''
        }`
      );
    }
  }

  const targetItem = findItemByPath(allResources, folderPath);

  let targetItems = targetItem ? targetItem.children : [];

  for (const item of targetItems) {
    if (item.type === 'directory') {
      await downloadResourcesFromFolder(item.path); // Recursively fetch for sub-folders
    } else if (item.type === 'file') {
      const localFilePath = localPathFromResourcePath(item.path);
      await downloadFile(item.path, localFilePath);
    }
  }
};

const downloadAndSaveCommitID = async (commitID) => {
  allResources = null;

  const response = await request({
    method: 'GET',
    url: listResourcesURL,
    headers: {
      Authorization: apiAdminToken,
    },
  });

  const paths = response.result
    .filter((data) => data.type === 'directory')
    .map((data) => data.path);

  logger.info('Downloading resources...');

  for (const path of paths) {
    await downloadResourcesFromFolder(path);
  }

  logger.info('Resources downloaded.');

  writeFileSync(commitIDFilepath, commitID);
};

const handleResourceRequest = (response) => {
  const { statusCode, result } = response;

  if (statusCode !== 200) {
    logger.warn(
      `Failed to fetch resources history. Received status code ${statusCode}. ${
        result.errors ? JSON.stringify(result.errors, null, 2) : ''
      }`
    );

    return false;
  }

  if (result.length === 0) {
    logger.warn(
      'Git in Onify API (resources) is not configured or working! Skipping (cannot) download resources.'
    );

    return false;
  }

  return true;
};

const syncResources = async () => {
  const response = await request({
    method: 'GET',
    url: resourcesHistoryURL,
    headers: {
      Authorization: apiAdminToken,
    },
  });

  if (!handleResourceRequest(response)) {
    return;
  }

  const { result } = response;
  const { commitid } = result[0];

  if (existsSync(resourcesPath)) {
    rmSync(resourcesPath, { recursive: true });
  }

  mkdirSync(resourcesPath, { recursive: true });

  await downloadAndSaveCommitID(commitid);
};

const isResourcesUpdated = async () => {
  const response = await request({
    method: 'GET',
    url: resourcesHistoryURL,
    headers: {
      Authorization: apiAdminToken,
    },
  });

  if (!handleResourceRequest(response)) {
    return false;
  }

  const { result } = response;
  const { commitid } = result[0];

  if (existsSync(commitIDFilepath)) {
    const lastCommitID = readFileSync(commitIDFilepath, 'utf-8');

    if (commitid !== lastCommitID) {
      return true;
    } else {
      return false;
    }
  } else {
    return true;
  }
};

async function setupApp() {
  const app = express();

  app.use(express.json(), express.text());
  app.use(httpLogger);

  if (existsSync(commitIDFilepath)) {
    rmSync(commitIDFilepath);
  }

  if (fetchResources) {
    await syncResources();
  }

  await nodeRun(app);
  // await pwshRun(app); TODO: To be implemented

  app.listen(port, () => {
    logger.info(
      `Server version ${packageJson.version} is running on port ${port} in ${process.env.NODE_ENV} mode.`
    );
  });

  if (fetchResources) {
    setInterval(async () => {
      logger.debug('Checking resource updates...');

      const renewedResources = await isResourcesUpdated();

      if (renewedResources) {
        logger.info(
          'Resources are updated. Stopping (and restarting) service...'
        );
        process.exit(0);
      }
    }, resourcesPullInterval);
  }

  return app;
}

export { setupApp, config };
