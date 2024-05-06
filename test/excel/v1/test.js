'use strict';

import { describe, expect, it } from 'vitest';
import { request } from '#/lib/test-helper';
import ExcelJS from 'exceljs';
import FormData from 'form-data';
import { sep } from 'path';

const version = __dirname.split(sep).reverse()[0];
const endpoint = `${version}/excel`;

describe('excel read:', () => {
  it(`POST ${endpoint}/read - content with correct headers - returns 200`, async () => {
    const headerRow = ['Förnamn', 'Efternamn', 'Epost'];
    const dataRow = ['First', 'Last', 'first@mail.com'];
    const schema = {
      Förnamn: {
        prop: 'firstname',
        type: 'String',
      },
      Efternamn: {
        prop: 'lastname',
        type: 'String',
      },
      Epost: {
        prop: 'email',
        type: 'String',
      },
    };

    const data = [headerRow, dataRow];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Test');

    sheet.addRows(data);

    const bufferData = await workbook.xlsx.writeBuffer();
    const form = new FormData();

    form.append('file', bufferData, { filename: 'test.xlsx' });
    form.append('schema', JSON.stringify(schema));

    const res = await request({
      method: 'POST',
      url: `${endpoint}/read`,
      body: form.getBuffer(),
      headers: form.getHeaders(),
    });

    const { statusCode, result } = res;

    expect(statusCode).to.equal(200);
    expect(result.rows).toMatchObject([
      {
        firstname: 'First',
        lastname: 'Last',
        email: 'first@mail.com',
      },
    ]);
    expect(result.errors).to.be.empty;
  });

  it(`POST ${endpoint}/read - content with multiple data rows - returns 200`, async () => {
    const headerRow = ['Förnamn', 'Efternamn', 'Epost'];
    const dataRows = [
      ['First1', 'Last1', 'first1@mail.com'],
      ['First2', 'Last2', 'first2@mail.com'],
      ['First3', 'Last3', 'first3@mail.com'],
    ];
    const schema = {
      Förnamn: {
        prop: 'firstname',
        type: 'String',
      },
      Efternamn: {
        prop: 'lastname',
        type: 'String',
      },
      Epost: {
        prop: 'email',
        type: 'String',
      },
    };

    const data = [headerRow, ...dataRows];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Test');

    sheet.addRows(data);

    const bufferData = await workbook.xlsx.writeBuffer();
    const form = new FormData();

    form.append('file', bufferData, { filename: 'test.xlsx' });
    form.append('schema', JSON.stringify(schema));

    const res = await request({
      method: 'POST',
      url: `${endpoint}/read`,
      body: form.getBuffer(),
      headers: form.getHeaders(),
    });

    const { statusCode, result } = res;

    expect(statusCode).to.equal(200);
    expect(result.rows).toMatchObject([
      { firstname: 'First1', lastname: 'Last1', email: 'first1@mail.com' },
      { firstname: 'First2', lastname: 'Last2', email: 'first2@mail.com' },
      { firstname: 'First3', lastname: 'Last3', email: 'first3@mail.com' },
    ]);
    expect(result.errors).to.be.empty;
  });

  it(`POST ${endpoint}/read - content with un-mapped header - returns 200`, async () => {
    const headerRow = ['Förnamn', 'Efternamn_skip', 'Epost'];
    const dataRows = [
      ['First1', 'Last1', 'first1@mail.com'],
      ['First2', 'Last2', 'first2@mail.com'],
      ['First3', 'Last3', 'first3@mail.com'],
    ];
    const schema = {
      Förnamn: {
        prop: 'firstname',
        type: 'String',
      },
      Efternamn: {
        prop: 'lastname',
        type: 'String',
      },
      Epost: {
        prop: 'email',
        type: 'String',
      },
    };

    const data = [headerRow, ...dataRows];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Test');

    sheet.addRows(data);

    const bufferData = await workbook.xlsx.writeBuffer();
    const form = new FormData();

    form.append('file', bufferData, { filename: 'test.xlsx' });
    form.append('schema', JSON.stringify(schema));

    const res = await request({
      method: 'POST',
      url: `${endpoint}/read`,
      body: form.getBuffer(),
      headers: form.getHeaders(),
    });

    const { statusCode, result } = res;

    expect(statusCode).to.equal(200);
    expect(result.rows).toMatchObject([
      { firstname: 'First1', email: 'first1@mail.com' },
      { firstname: 'First2', email: 'first2@mail.com' },
      { firstname: 'First3', email: 'first3@mail.com' },
    ]);
    expect(result.errors).to.be.empty;
  });

  it(`POST ${endpoint}/read - invalid email supplied should include row in error array - returns 200`, async () => {
    const headerRow = ['Förnamn', 'Efternamn', 'Epost'];
    const dataRows = [
      ['First1', 'Last1', 'invalidmail.com'],
      ['First2', 'Last2', 'first2@mail.com'],
      ['First3', 'Last3', 'first3@mail.com'],
    ];
    const schema = {
      Efternamn: {
        prop: 'lastname',
        type: 'String',
      },
      Epost: {
        prop: 'email',
        type: 'Email',
      },
    };

    const data = [headerRow, ...dataRows];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Test');

    sheet.addRows(data);

    const bufferData = await workbook.xlsx.writeBuffer();
    const form = new FormData();

    form.append('file', bufferData, { filename: 'test.xlsx' });
    form.append('schema', JSON.stringify(schema));

    const res = await request({
      method: 'POST',
      url: `${endpoint}/read`,
      body: form.getBuffer(),
      headers: form.getHeaders(),
    });

    const { statusCode, result } = res;

    expect(statusCode).to.equal(200);
    expect(
      result.errors.findIndex((error) => {
        const { row, column, reason } = error;
        return row === 2 && column === 'Epost' && reason === 'not_an_email';
      })
    ).to.not.equal(-1);
  });

  it(`POST ${endpoint}/read - no schema supplied - returns 200`, async () => {
    const headerRow = ['Förnamn', 'Efternamn', 'Epost'];
    const dataRows = [
      ['First1', 'Last1', 'first1@mail.com'],
      ['First2', 'Last2', 'first2@mail.com'],
      ['First3', 'Last3', 'first3@mail.com'],
    ];

    const data = [headerRow, ...dataRows];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Test');

    sheet.addRows(data);

    const bufferData = await workbook.xlsx.writeBuffer();
    const form = new FormData();

    form.append('file', bufferData, { filename: 'test.xlsx' });

    const res = await request({
      method: 'POST',
      url: `${endpoint}/read`,
      body: form.getBuffer(),
      headers: form.getHeaders(),
    });

    const { statusCode, result } = res;

    expect(statusCode).to.equal(200);
    expect(result.rows).toMatchObject([
      { Förnamn: 'First1', Efternamn: 'Last1', Epost: 'first1@mail.com' },
      { Förnamn: 'First2', Efternamn: 'Last2', Epost: 'first2@mail.com' },
      { Förnamn: 'First3', Efternamn: 'Last3', Epost: 'first3@mail.com' },
    ]);
    expect(result.errors).to.be.empty;
  });

  it(`POST ${endpoint}/read - sheet is supplied - returns 200`, async () => {
    const headerRow = ['Förnamn', 'Efternamn', 'Epost'];
    const dataRows = [
      ['First1', 'Last1', 'first1@mail.com'],
      ['First2', 'Last2', 'first2@mail.com'],
      ['First3', 'Last3', 'first3@mail.com'],
    ];
    const sheetName = 'Sheet1';

    const data = [headerRow, ...dataRows];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);

    sheet.addRows(data);

    const bufferData = await workbook.xlsx.writeBuffer();
    const form = new FormData();

    form.append('file', bufferData, { filename: 'test.xlsx' });
    form.append('sheet', sheetName);

    const res = await request({
      method: 'POST',
      url: `${endpoint}/read`,
      body: form.getBuffer(),
      headers: form.getHeaders(),
    });

    const { statusCode, result } = res;

    expect(statusCode).to.equal(200);
    expect(result.rows).toMatchObject([
      { Förnamn: 'First1', Efternamn: 'Last1', Epost: 'first1@mail.com' },
      { Förnamn: 'First2', Efternamn: 'Last2', Epost: 'first2@mail.com' },
      { Förnamn: 'First3', Efternamn: 'Last3', Epost: 'first3@mail.com' },
    ]);
    expect(result.errors).to.be.empty;
  });

  it(`POST ${endpoint}/read - an unknown sheet name is supplied - returns 500`, async () => {
    const headerRow = ['Förnamn', 'Efternamn', 'Epost'];
    const dataRows = [
      ['First1', 'Last1', 'first1@mail.com'],
      ['First2', 'Last2', 'first2@mail.com'],
      ['First3', 'Last3', 'first3@mail.com'],
    ];

    const data = [headerRow, ...dataRows];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Test');

    sheet.addRows(data);

    const bufferData = await workbook.xlsx.writeBuffer();
    const form = new FormData();

    form.append('file', bufferData, { filename: 'test.xlsx' });
    form.append('sheet', 'unknown_sheet');

    const res = await request({
      method: 'POST',
      url: `${endpoint}/read`,
      body: form.getBuffer(),
      headers: form.getHeaders(),
    });

    expect(res.statusCode).to.equal(500);
  });

  it(`POST ${endpoint}/read - invalid json input is supplied - returns 400`, async () => {
    const headerRow = ['Förnamn', 'Efternamn', 'Epost'];
    const dataRows = [
      ['First1', 'Last1', 'invalidmail.com'],
      ['First2', 'Last2', 'first2@mail.com'],
      ['First3', 'Last3', 'first3@mail.com'],
    ];
    const schema = 'gg';

    const data = [headerRow, ...dataRows];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Test');

    sheet.addRows(data);

    const bufferData = await workbook.xlsx.writeBuffer();
    const form = new FormData();

    form.append('file', bufferData, { filename: 'test.xlsx' });
    form.append('schema', JSON.stringify(schema));

    const res = await request({
      method: 'POST',
      url: `${endpoint}/read`,
      body: form.getBuffer(),
      headers: form.getHeaders(),
    });

    const { statusCode, result } = res;

    expect(statusCode).to.equal(400);
    expect(result.error).to.equal('"schema" must be of type object');
  });
});
