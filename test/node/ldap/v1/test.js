import { describe, expect, it } from 'vitest';
import { request } from '#/lib/test-helper';
import { sep } from 'path';

const version = __dirname.split(sep).reverse()[0];
const endpoint = `${version}/ldap`;

describe('ldap:', () => {
  const url = 'ldap%3A%2F%2Fldap.forumsys.com';
  const username = 'cn=read-only-admin,dc=example,dc=com';
  const password = 'password';
  const base = 'dc=example,dc=com';
  const filter = '(objectclass%3D*)';
  const scope = 'sub';
  const tlsOptions = 'rejectUnauthorized%3Dtrue';

  it(`GET ${endpoint}/search - bad request / missing required query parameter - returns 400`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/search?username=${username}&password=${password}&base=${base}&filter=${filter}&scope=${scope}`,
    });

    expect(res.statusCode).to.equal(400);
    expect(res.result.error).to.equal('"url" is required');
  });

  it(`GET ${endpoint}/search - complete query parameters and correct parameter values - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/search?url=${url}&username=${username}&password=${password}&base=${base}&filter=${filter}&scope=${scope}`,
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.length > 0).to.equal(true);
  });

  it(`GET ${endpoint}/search - unauthorized / user/password invalid - returns 401`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/search?url=${url}&username=${username}&password=wrongpassword&base=${base}&filter=${filter}&scope=${scope}`,
    });

    expect(res.statusCode).to.equal(401);
    expect(res.result.error).to.equal('Invalid Credentials');
  });

  it(`GET ${endpoint}/search - search for a user that does exist - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/search?url=${url}&username=${username}&password=${password}&base=${base}&filter=(uid%3Dtesla)&scope=${scope}&tlsOptions=${tlsOptions}`,
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.length).to.equal(1);
  });

  it(`GET ${endpoint}/search - search result without supplied raw parameter - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/search?url=${url}&username=${username}&password=${password}&base=${base}&filter=${filter}&scope=${scope}`,
    });

    expect(res.statusCode).to.equal(200);
    expect(Object.keys(res.result[0]).includes('messageId')).to.equal(false);
  });

  it(`GET ${endpoint}/search - search result with supplied raw parameter value false - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/search?url=${url}&username=${username}&password=${password}&base=${base}&filter=(%26(cn%3D*)(sn%3D*))&scope=${scope}&raw=false`,
    });

    const requiredKeys = ['objectName', 'cn', 'sn'];
    const resultKeys = Object.keys(res.result[0]);

    expect(res.statusCode).to.equal(200);
    expect(requiredKeys.every((key) => resultKeys.includes(key))).to.equal(
      true
    );
  });

  it(`GET ${endpoint}/search - search result with supplied raw parameter value true - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/search?url=${url}&username=${username}&password=${password}&base=${base}&filter=${filter}&scope=${scope}&raw=true`,
    });

    const requiredKeys = ['objectName', 'attributes', 'type'];
    const resultKeys = Object.keys(res.result[0]);

    expect(res.statusCode).to.equal(200);
    expect(
      requiredKeys.every((key) => resultKeys.includes(key)) &&
        res.result[0]['type'] === 'SearchResultEntry' &&
        Array.isArray(res.result[0]['attributes'])
    ).to.equal(true);
  });

  it(`GET ${endpoint}/search - search result with paged parameter value true - returns 200`, async () => {
    const res = await request({
      method: 'GET',
      url: `${endpoint}/search?url=${url}&username=${username}&password=${password}&base=${base}&filter=${filter}&scope=${scope}&paged=true&pageSize=5`,
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.length === 5).to.equal(true);
  });
});
