import { describe, expect, it } from 'vitest';
import { request } from '#/lib/test-helper';
import { sep } from 'path';

const version = __dirname.split(sep).reverse()[0];
const endpoint = `${version}/hello`;

describe('hello:', () => {
  it('name test', async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}?name=test`,
    });

    expect(res.statusCode).to.equal(200);
  });
});
