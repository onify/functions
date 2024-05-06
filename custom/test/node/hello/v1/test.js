import { describe, expect, it } from 'vitest';
import { request } from '#/lib/test-helper';
import { sep } from 'path';

const version = __dirname.split(sep).reverse()[0];
const endpoint = `${version}/hello`;

describe('hello:', () => {
  it(`GET ${endpoint} - missing "name" query parameter - returns 400`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}`,
    });
    expect(res.statusCode).to.equal(400);
    expect(res.result.error).to.equal('"name" is required');
  });

  it(`GET ${endpoint} - with "name" query parmeter - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}?name=world`,
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result).to.toMatchObject({ hello: 'world' });
  });

  it(`GET ${endpoint}/{name} - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/world`,
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result).to.toMatchObject({ hello: 'world' });
  });

  it(`POST ${endpoint} - returns 201`, async () => {
    const res = await request({
      method: 'POST',
      url: `${endpoint}`,
      body: {
        name: 'world',
      },
    });
    console.log(res);
    expect(res.statusCode).to.equal(201);
    expect(res.result).to.toMatchObject({ hello: 'world' });
  });

  it(`PUT ${endpoint}/{name} - returns 200`, async () => {
    const res = await request({
      method: 'PUT',
      url: `${endpoint}/world`,
      body: {
        comment: 'hello',
      },
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result).to.toMatchObject({ hello: 'world', comment: 'hello' });
  });

  it(`DELETE ${endpoint}/{name} - returns 200`, async () => {
    const res = await request({
      method: 'DELETE',
      url: `${endpoint}/world`,
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result).to.toMatchObject({ 'bye bye': 'world' });
  });
});

/*
('use strict');

const Lab = require('@hapi/lab');
const { expect } = require('@hapi/code');

const { afterEach, beforeEach, describe, it } = (exports.lab = Lab.script());
const Helpers = require('../testHelpers');

const FUNCTION_ENDPOINT = '/hello';

describe('hello:', () => {
  let server;

  beforeEach(async () => {
    server = await Helpers.getServer();
  });

  afterEach(async () => {
    await server.stop();
  });

  it(`GET ${FUNCTION_ENDPOINT} - missing "name" query parameter - returns 400`, async () => {
    const res = await server.inject({
      method: 'GET',
      url: `${FUNCTION_ENDPOINT}`,
    });
    expect(res.statusCode).to.equal(400);
    expect(res.result.message).to.equal('"name" is required');
  });

  it(`GET ${FUNCTION_ENDPOINT} - with "name" query parmeter - returns 200`, async () => {
    const res = await server.inject({
      method: 'GET',
      url: `${FUNCTION_ENDPOINT}?name=world`,
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result).to.equal({ hello: 'world' });
  });

  it(`GET ${FUNCTION_ENDPOINT}/{name} - returns 200`, async () => {
    const res = await server.inject({
      method: 'GET',
      url: `${FUNCTION_ENDPOINT}/world`,
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result).to.equal({ hello: 'world' });
  });

  it(`POST ${FUNCTION_ENDPOINT} - returns 201`, async () => {
    const res = await server.inject({
      method: 'POST',
      url: `${FUNCTION_ENDPOINT}`,
      payload: {
        name: 'world',
      },
    });
    expect(res.statusCode).to.equal(201);
    expect(res.result).to.equal({ hello: 'world' });
  });

  it(`PUT ${FUNCTION_ENDPOINT}/{name} - returns 200`, async () => {
    const res = await server.inject({
      method: 'PUT',
      url: `${FUNCTION_ENDPOINT}/world`,
      payload: {
        comment: 'hello',
      },
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result).to.equal({ hello: 'world', comment: 'hello' });
  });

  it(`DELETE ${FUNCTION_ENDPOINT}/{name} - returns 200`, async () => {
    const res = await server.inject({
      method: 'DELETE',
      url: `${FUNCTION_ENDPOINT}/world`,
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result).to.equal({ 'bye bye': 'world' });
  });
});
*/
