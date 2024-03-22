'use strict';

import { describe, expect, it } from 'vitest';
import { request } from '#/lib/test-helper';
import { sep } from 'path';

const version = __dirname.split(sep).reverse()[0];
let endpoint = `${version}/convert`;

describe('convert:', () => {
  it(`POST ${endpoint}/xml/json - bad XML content - returns 500`, async () => {
    const res = await request({
      method: 'POST',
      url: `${endpoint}/xml/json`,
      body: '<xml>test</xml',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(res.statusCode).to.equal(500);
    expect(res.result.err.code).to.equal('InvalidTag');
  });

  it(`POST ${endpoint}/xml/json - good XML content - returns 200`, async () => {
    const res = await request({
      method: 'POST',
      url: `${endpoint}/xml/json`,
      body: '<xml>test</xml>',
      headers: { 'Content-Type': 'text/plain' },
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result).toMatchObject({ xml: 'test' });
  });

  it(`POST ${endpoint}/xml/json?ignoreAttributes=false - good XML content - returns 200`, async () => {
    const res = await request({
      method: 'POST',
      url: `${endpoint}/xml/json?ignoreAttributes=false`,
      body: '<xml attribute="test">test</xml>',
      headers: { 'Content-Type': 'text/plain' },
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result).toMatchObject({
      xml: { '#text': 'test', '@_attribute': 'test' },
    });
  });

  it(`POST ${endpoint}/json/xml - bad JSON content - returns 500`, async () => {
    const res = await request({
      method: 'POST',
      url: `${endpoint}/json/xml`,
      body: '{ "var1": "value1"',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(res.statusCode).to.equal(500);
  });

  it(`POST ${endpoint}/json/xml - good JSON content - returns 200`, async () => {
    const res = await request({
      method: 'POST',
      url: `${endpoint}/json/xml`,
      body: '{ "var1": "value1" }',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result).to.equal('<var1>value1</var1>');
  });
});
