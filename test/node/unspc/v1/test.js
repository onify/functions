'use strict';

import { describe, expect, it } from 'vitest';
import { request } from '#/lib/test-helper';
import { sep } from 'path';

const version = __dirname.split(sep).reverse()[0];
const endpoint = `${version}/unspsc`;

describe('unspsc:', () => {
  it(`GET ${endpoint}/9999 - code does not exist - returns 404`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/9999`,
    });

    expect(res.statusCode).to.equal(404);
    expect(res.result).toMatchObject({ name: null });
  });

  it(`GET ${endpoint}/60104601 - code does exist - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/60104601`,
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result).toMatchObject({
      name: 'Force tables',
      meta: {
        Segment: '60000000',
        'Segment Name':
          'Musical Instruments and Games and Toys and Arts and Crafts and Educational Equipment and Materials and Accessories and Supplies',
        Family: '60100000',
        'Family Name':
          'Developmental and professional teaching aids and materials and accessories and supplies',
        Class: '60104600',
        'Class Name': 'Mechanical physics materials',
        Commodity: '60104601',
        'Commodity Name': 'Force tables',
      },
    });
  });

  it(`GET ${endpoint}/60104601?includeMeta=false - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/60104601?includeMeta=false`,
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result).toMatchObject({ name: 'Force tables' });
  });

  it(`GET ${endpoint}/60104600?includeMeta=false&deepSearch=true - find in deep search - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/60104600?includeMeta=false&deepSearch=true`,
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result).toMatchObject({ name: 'Mechanical physics materials' });
  });

  it(`GET ${endpoint}/60104600?includeMeta=false&deepSearch=false - not found because deep search is disabled - returns 404`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/60104600?includeMeta=false&deepSearch=false`,
    });
    expect(res.statusCode).to.equal(404);
    expect(res.result).toMatchObject({ name: null });
  });
});
