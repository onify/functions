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

const port =
  process.env.PORT || 8585;
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

/**
 * Recursively searches for an item with a specified path in a nested item list
 * @param {Array} itemList - The list of items to search through
 * @param {string} path - The path to search for
 * @returns {Object|null} The found item object, or null if not found
 */
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

/**
 * Downloads a file from a remote resource and saves it locally.
 * @param {string} resourcePath - The path of the resource to download.
 * @param {string} destinationPath - The local path where the file will be saved.
 * @returns {Promise<void>} A promise that resolves when the file has been downloaded and saved.
 */
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
    'base64',
  ).toString('utf-8');

  // Save the decoded content as a utf-8 encoded file. Creating the directory if it doesn't exist.
  mkdirSync(path.dirname(destinationPath), {
    recursive: true,
  });

  writeFileSync(destinationPath, decodedContent, { encoding: 'utf-8' });
}

/**
 * Converts a resource path to a local file system path
 * @param {string} resourcePath - The path of the resource, starting with a forward slash
 * @returns {string} The corresponding local file system path
 */
function localPathFromResourcePath(resourcePath) {
  return join(resourcesPath, resourcePath.slice(1));
}

/**
 * Asynchronously downloads resources from a specified folder path.
 * @param {string} folderPath - The path of the folder to download resources from.
 * @returns {Promise<void>} A promise that resolves when all resources have been downloaded.
 */
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
        }`,
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

/**
 * Downloads and saves resources associated with a specific commit ID.
 * @param {string} commitID - The ID of the commit to download resources for.
 * @returns {Promise<void>} A promise that resolves when the download and save operation is complete.
 */
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
    /**
     * Filters an array to include only directory-type elements
     * @param {Array} data - The array of data objects to filter
     * @returns {Array} A new array containing only the elements with type 'directory'
     */
    .filter((data) => data.type === 'directory')
    /**
     * Maps an array of objects to extract the 'path' property from each object
     * @param {Array} data - An array of objects containing a 'path' property
     * @returns {Array} An array of path values extracted from the input objects
     */
    .map((data) => data.path);

  logger.info('Downloading resources...');

  for (const path of paths) {
    await downloadResourcesFromFolder(path);
  }

  logger.info('Resources downloaded.');

  writeFileSync(commitIDFilepath, commitID);
};

/**
 * Handles the response from a resource request.
 * @param {Object} response - The response object from the resource request.
 * @param {number} response.statusCode - The HTTP status code of the response.
 * @param {Object|Array} response.result - The result data from the response.
 * @returns {boolean} Returns true if the request was successful and resources are available, false otherwise.
 */
const handleResourceRequest = (response) => {
  const { statusCode, result } = response;

  if (statusCode !== 200) {
    logger.warn(
      `Failed to fetch resources history. Received status code ${statusCode}. ${
        result.errors ? JSON.stringify(result.errors, null, 2) : ''
      }`,
    );

    return false;
  }

  if (result.length === 0) {
    logger.warn(
      'Git in Onify API (resources) is not configured or working! Skipping (cannot) download resources.',
    );

    return false;
  }

  return true;
};

/**
 * Synchronizes resources by fetching the latest commit ID, clearing the existing resources directory, and downloading the new resources.
 * @returns {Promise<void>} A promise that resolves when the synchronization is complete.
 */
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

/**
 * Checks if resources have been updated by comparing the latest commit ID with the stored one.
 * @param {void} - This function doesn't take any parameters.
 * @returns {Promise<boolean>} A promise that resolves to true if resources are updated, false otherwise.
 */const isResourcesUpdated = async () => {
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

/**
 * Sets up and initializes the Express application with various middleware, routes, and background tasks.
 * @param {void} - This function doesn't take any parameters.
 * @returns {Promise<express.Application>} A Promise that resolves to the configured Express application instance.
 */
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

  /**
   * Starts the server and listens for incoming connections on the specified port
   * @param {number} port - The port number on which the server will listen
   * @param {Function} callback - A callback function to be executed when the server starts listening
   * @returns {void} This method does not return a value
   */
  app.listen(port, () => {
    logger.info(
      `Server version ${packageJson.version} is running on port ${port} in ${process.env.NODE_ENV} mode.`,
    );
  });

  if (fetchResources) {
    /**
     * Sets up an interval to periodically check for resource updates and restart the service if updates are detected.
     * @param {number} resourcesPullInterval - The interval in milliseconds between each check for resource updates.
     * @returns {NodeJS.Timeout} The interval object returned by setInterval.
     */
    setInterval(async () => {
      logger.debug('Checking resource updates...');

      const renewedResources = await isResourcesUpdated();

      if (renewedResources) {
        logger.info(
          'Resources are updated. Stopping (and restarting) service...',
        );
        process.exit(0);
      }
    }, resourcesPullInterval);
  }

  return app;
}

export { setupApp, config };
