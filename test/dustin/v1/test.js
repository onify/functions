'use strict';

import { XMLParser } from 'fast-xml-parser';
import { request } from '#/lib/test-helper';
import { expect, describe, it } from 'vitest';
import { sep } from 'path';

const version = __dirname.split(sep).reverse()[0];
const endpoint = `${version}/dustin`;

/**
 * Describes a suite of tests for the order preparation endpoint.
 * @param {void} - This function doesn't take any parameters as it's a test suite description.
 * @returns {void} This function doesn't return anything as it's a test suite.
 */
describe('dustin:', () => {
  /**
   * Tests the POST endpoint for order preparation with an empty "Order.BuyerParty.PartyID".
   * @param {string} endpoint - The base URL for the API endpoint.
   * @returns {void} This test function does not return a value.
   */
  it(`POST ${endpoint}/prepare/order - NOK - "Order.BuyerParty.PartyID" is not allowed to be empty - returns 400`, async () => {
    const body = `
  	{
  		"Order": {
  			"BuyerOrderNumber": "",
  			"Currency": "SEK",
  			"Notes": "",
  			"CostCenter": "",
  			"GoodsMarking": "",
  			"BuyerParty": {
  				"PartyID": "",
  				"TaxIdentifier": "",
  				"Name": "",
  				"Street": "",
  				"PostalCode": "",
  				"City": "",
  				"Country": "SE",
  				"ContactName": "",
  				"ContactPhone": "",
  				"ContactEmail": ""
  			}

  		}
  	}
  `;
    const res = await request({
      method: 'POST',
      url: `${endpoint}/prepare/order`,
      body,
      headers: { 'Content-Type': 'application/json' },
    });

    expect(res.statusCode).to.equal(400);
    expect(res.result.error).to.equal(
      '"Order.BuyerParty.PartyID" is not allowed to be empty'
    );
  });

  /**
   * Tests the POST request to the /prepare/order endpoint for a negative scenario where "OrderRows" is missing.
   * @param {string} endpoint - The base URL endpoint for the API.
   * @returns {void} This test function doesn't return a value.
   */
  it(`POST ${endpoint}/prepare/order - NOK - "OrderRows" is required - returns 400`, async () => {
    const body = `
    {
      "Order": {
        "Currency": "SEK",
        "BuyerParty": {
          "PartyID": "1234567",
          "TaxIdentifier": "SE1234567",
          "Name": "Company AB",
          "Street": "Street 1",
          "PostalCode": "12345",
          "City": "City",
          "Country": "SE",
          "ContactName": "John Doe",
          "ContactPhone": "555-123456",
          "ContactEmail": "john.doe@company.com"
        }

      }
    }
    `;
    const res = await request({
      method: 'POST',
      url: `${endpoint}/prepare/order`,
      body,
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.statusCode).to.equal(400);
    expect(res.result.error).to.equal('"OrderRows" is required');
  });

  /**
   * Tests the POST endpoint for preparing an order with BuyerParty and OrderRows
   * @param {string} endpoint - The base URL for the API endpoint
   * @returns {void} This test function doesn't return a value
   */
  it(`POST ${endpoint}/prepare/order - OK - BuyerParty and OrderRows - returns 200`, async () => {
    const body = `
    {
      "Order": {
          "Currency": "SEK",
          "BuyerParty": {
              "PartyID": "1234567",
              "TaxIdentifier": "SE1234567",
              "Name": "Company AB",
              "Street": "Street 1",
              "PostalCode": "12345",
              "City": "City",
              "Country": "SE",
              "ContactName": "John Doe",
              "ContactPhone": "555-123456",
              "ContactEmail": "john.doe@company.com"
          }
      },
      "OrderRows": [
          {
              "PartID": "55555",
              "CommodityCode": "12345",
              "Quantity": 1,
              "Price": 100.5,
              "Currency": "SEK"
          }
      ]
    }
    `;
    const res = await request({
      method: 'POST',
      url: `${endpoint}/prepare/order`,
      body,
      headers: { 'Content-Type': 'application/json' },
    });

    const converter = new XMLParser({ ignoreAttributes: true });
    let jsonObj = converter.parse(res.result);

    expect(res.statusCode).to.equal(200);
    expect(
      jsonObj.Order.OrderHeader.OrderParty.BuyerParty.Party.NameAddress.Name1
    ).to.equal('Company AB');
    expect(
      jsonObj.Order.OrderSummary.TotalAmount.MonetaryValue.MonetaryAmount
    ).to.equal(100.5);
  });
});
