'use strict';

import Joi from 'joi';
import Moment from 'moment';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { readFileSync } from 'fs';

const orderBaseXMLFileName = './resources/dustin/orderTemplate.xml';
const orderRowBaseXMLFileName = './resources/dustin/orderRowTemplate.xml';
const orderBaseXML = readFileSync(orderBaseXMLFileName, { encoding: 'utf-8' });
const orderRowBaseXML = readFileSync(orderRowBaseXMLFileName, {
  encoding: 'utf-8',
});

const options = {
  ignoreAttributes: false,
  format: true,
};

const parser = new XMLParser(options);
const builder = new XMLBuilder(options);

const buyerPartyValidation = {
  PartyID: Joi.string()
    .required()
    .default('')
    .description(
      'Order.OrderHeader.OrderParty.BuyerParty.Party.PartyID.Identifier.Ident'
    ),
  TaxIdentifier: Joi.string()
    .required()
    .default('')
    .description(
      'Order.OrderHeader.OrderParty.BuyerParty.PartyTaxInformation.TaxIdentifier.Identifier.Ident'
    ),
  Name: Joi.string()
    .required()
    .default('')
    .description(
      'Order.OrderHeader.OrderParty.BuyerParty.Party.NameAddress.Name1'
    ),
  Street: Joi.string()
    .required()
    .default('')
    .description(
      'Order.OrderHeader.OrderParty.BuyerParty.Party.NameAddress.Street'
    ),
  PostalCode: Joi.string()
    .required()
    .default('')
    .description(
      'Order.OrderHeader.OrderParty.BuyerParty.Party.NameAddress.PostalCode'
    ),
  City: Joi.string()
    .required()
    .default('')
    .description(
      'Order.OrderHeader.OrderParty.BuyerParty.Party.NameAddress.City'
    ),
  Country: Joi.string()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .default('SE')
    .description(
      'Order.OrderHeader.OrderParty.BuyerParty.Party.NameAddress.Country.CountryCoded'
    ),
  ContactName: Joi.string()
    .required()
    .default('')
    .description(
      'Order.OrderHeader.OrderParty.BuyerParty.Party.OrderContact.Contact.ContactName'
    ),
  ContactPhone: Joi.string()
    .optional()
    .default('')
    .description(
      'Order.OrderHeader.OrderParty.BuyerParty.Party.OrderContact.Contact.ListOfContactNumber.ContactNumber[0].ContactNumberValue'
    ),
  ContactEmail: Joi.string()
    .required()
    .default('')
    .description(
      'Order.OrderHeader.OrderParty.BuyerParty.Party.OrderContact.Contact.ListOfContactNumber.ContactNumber[1].ContactNumberValue'
    ),
};

const shipToPartyValidation = {
  PartyID: Joi.string()
    .optional()
    .default('')
    .allow(null, '')
    .description(
      'Order.OrderHeader.OrderParty.ShipToParty.Party.PartyID.Identifier.Ident'
    ),
  TaxIdentifier: Joi.string()
    .optional()
    .default('')
    .allow(null, '')
    .description(
      'Order.OrderHeader.OrderParty.ShipToParty.PartyTaxInformation.TaxIdentifier.Identifier.Ident'
    ),
  Name: Joi.string()
    .optional()
    .default('')
    .allow(null, '')
    .description(
      'Order.OrderHeader.OrderParty.ShipToParty.Party.NameAddress.Name1'
    ),
  Street: Joi.string()
    .optional()
    .default('')
    .allow(null, '')
    .description(
      'Order.OrderHeader.OrderParty.ShipToParty.Party.NameAddress.Street'
    ),
  PostalCode: Joi.string()
    .optional()
    .default('')
    .allow(null, '')
    .description(
      'Order.OrderHeader.OrderParty.ShipToParty.Party.NameAddress.PostalCode'
    ),
  City: Joi.string()
    .optional()
    .default('')
    .allow(null, '')
    .description(
      'Order.OrderHeader.OrderParty.ShipToParty.Party.NameAddress.City'
    ),
  Country: Joi.string()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .default('SE')
    .description(
      'Order.OrderHeader.OrderParty.ShipToParty.Party.NameAddress.Country.CountryCoded'
    ),
  ContactName: Joi.string()
    .optional()
    .default('')
    .allow(null, '')
    .description(
      'Order.OrderHeader.OrderParty.ShipToParty.Party.OrderContact.Contact.ContactName'
    ),
  ContactPhone: Joi.string()
    .optional()
    .default('')
    .allow(null, '')
    .description(
      'Order.OrderHeader.OrderParty.ShipToParty.Party.OrderContact.Contact.ListOfContactNumber.ContactNumber[0].ContactNumberValue'
    ), // Required??
  ContactEmail: Joi.string()
    .optional()
    .default('')
    .allow(null, '')
    .description(
      'Order.OrderHeader.OrderParty.ShipToParty.Party.OrderContact.Contact.ListOfContactNumber.ContactNumber[1].ContactNumberValue'
    ), // Required??
};

const billToPartyValidation = {
  PartyID: Joi.string()
    .optional()
    .default('')
    .allow(null, '')
    .description(
      'Order.OrderHeader.OrderParty.BillToParty.Party.PartyID.Identifier.Ident'
    ),
  TaxIdentifier: Joi.string()
    .optional()
    .default('')
    .allow(null, '')
    .description(
      'Order.OrderHeader.OrderParty.BillToParty.PartyTaxInformation.TaxIdentifier.Identifier.Ident'
    ),
  Name: Joi.string()
    .optional()
    .default('')
    .allow(null, '')
    .description(
      'Order.OrderHeader.OrderParty.BillToParty.Party.NameAddress.Name1'
    ),
  Street: Joi.string()
    .optional()
    .default('')
    .allow(null, '')
    .description(
      'Order.OrderHeader.OrderParty.BillToParty.Party.NameAddress.Street'
    ),
  PostalCode: Joi.string()
    .optional()
    .default('')
    .allow(null, '')
    .description(
      'Order.OrderHeader.OrderParty.BillToParty.Party.NameAddress.PostalCode'
    ),
  City: Joi.string()
    .optional()
    .default('')
    .allow(null, '')
    .description(
      'Order.OrderHeader.OrderParty.BillToParty.Party.NameAddress.City'
    ),
  Country: Joi.string()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .default('SE')
    .description(
      'Order.OrderHeader.OrderParty.BillToParty.Party.NameAddress.Country.CountryCoded'
    ),
  //ContactName: Joi.string().optional().default('').description('Order.OrderHeader.OrderParty.BillToParty.Party.OrderContact.ContactName'),
  //ContactPhone: Joi.string().optional().default('').description('Order.OrderHeader.OrderParty.BillToParty.Party.OrderContact.Contact.ListOfContactNumber.ContactNumber[0].ContactNumberValue'), // Required??
  //ContactEmail: Joi.string().optional().default('').description('Order.OrderHeader.OrderParty.BillToParty.Party.OrderContact.Contact.ListOfContactNumber.ContactNumber[1].ContactNumberValue') // Required??
};

const OrderValidation = {
  BuyerOrderNumber: Joi.string()
    .optional()
    .allow(null, '')
    .default('')
    .description('Order.OrderHeader.OrderNumber.BuyerOrderNumber'),
  Currency: Joi.string()
    .regex(/^[A-Z]{3}$/)
    .required()
    .default('SEK')
    .description('Order.OrderHeader.OrderCurrency.Currency.CurrencyCoded'),
  Notes: Joi.string()
    .optional()
    .allow(null, '')
    .default('')
    .description('Order.OrderHeader.OrderHeaderNote'),
  CostCenter: Joi.string()
    .optional()
    .allow(null, '')
    .default('')
    .description(
      'Order.OrderHeader.ListOfStructuredNote.StructuredNote[0].GeneralNote'
    ),
  GoodsMarking: Joi.string()
    .optional()
    .allow(null, '')
    .default('')
    .description(
      'Order.OrderHeader.ListOfStructuredNote.StructuredNote[1].GeneralNote'
    ),
  BuyerParty: buyerPartyValidation,
  ShipToParty: shipToPartyValidation,
  BillToParty: billToPartyValidation,
};

const OrderRowValidation = {
  PartID: Joi.string()
    .required()
    .default('')
    .description(
      'ItemDetail.BaseItemDetail.ItemIdentifiers.PartNumbers.SellerPartNumber.PartNum.PartID'
    ),
  CommodityCode: Joi.string()
    .optional()
    .default('')
    .description(
      'ItemDetail.BaseItemDetail.ItemIdentifiers.CommodityCode.Identifier.Ident'
    ),
  Quantity: Joi.number()
    .integer()
    .min(1)
    .required()
    .description(
      'ItemDetail.BaseItemDetail.TotalQuantity.Quantity.QuantityValue'
    ),
  Price: Joi.number()
    .required()
    .description(
      'ItemDetail.PricingDetail.ListOfPrice.Price.UnitPrice.UnitPriceValue'
    ),
  Currency: Joi.string()
    .regex(/^[A-Z]{3}$/)
    .required()
    .default('SEK')
    .description(
      'ItemDetail.PricingDetail.ListOfPrice.Price.UnitPrice.Currency.CurrencyCoded'
    ),
  LineItemNote: Joi.string()
    .optional()
    .allow(null, '')
    .default('')
    .description('ItemDetail.LineItemNote'),
};

const module = {
  name: 'dustin',
  routes: [
    {
      method: 'POST',
      path: '/dustin/prepare/order',
      options: {
        description: 'Prepare Dustin order',
        notes: 'Takes inputs and outputs XML order in Dustin (xcbl) format ',
        tags: ['api', 'dustin'],
        validate: {
          body: Joi.object({
            Order: OrderValidation,
            OrderRows: Joi.array()
              .items(
                Joi.object({
                  ...OrderRowValidation,
                })
              )
              .required(),
          }),
        },
      },
      /**
       * Handles an order request, processes the order details, and generates an XML response.
       * @param {Object} req - The request object containing order information.
       * @param {Object} res - The response object used to send the result back to the client.
       * @returns {Object} The response containing either the XML string of the processed order or an error message.
       */
      handler: (req, res) => {
        const currentDateTime = Moment(new Date()).format().replaceAll('-', ''); //Format: YYYYMMDDTHH:MM:SS[[+-]HH:MM]? (the first MM is Months, the other two are minutes)

        let order;
        try {
          order = parser.parse(orderBaseXML);
        } catch (err) {
          return res.status(500).send({ error: err.message });
        }

        try {
          order.Order.OrderHeader.OrderNumber.BuyerOrderNumber =
            req.body.Order.BuyerOrderNumber; // Can be blank?
          order.Order.OrderHeader.OrderIssueDate = currentDateTime; // Current date/time?
          order.Order.OrderHeader.OrderCurrency.Currency.CurrencyCoded =
            req.body.Order.Currency; // Support other currency?
          order.Order.OrderHeader.OrderHeaderNote = req.body.Order.Notes; // Can be blank?
          order.Order.OrderHeader.ListOfStructuredNote.StructuredNote[0].GeneralNote =
            req.body.Order.CostCenter; // CostCenter - can be blank, needed?
          order.Order.OrderHeader.ListOfStructuredNote.StructuredNote[1].GeneralNote =
            req.body.Order.GoodsMarking; // GoodsMarking - can be blank, needed?

          order.Order.OrderHeader.OrderParty.BuyerParty.Party.PartyID.Identifier.Ident =
            req.body.Order.BuyerParty.PartyID;
          order.Order.OrderHeader.OrderParty.BuyerParty.Party.NameAddress.Name1 =
            req.body.Order.BuyerParty.Name;
          order.Order.OrderHeader.OrderParty.BuyerParty.Party.NameAddress.Street =
            req.body.Order.BuyerParty.Street;
          order.Order.OrderHeader.OrderParty.BuyerParty.Party.NameAddress.PostalCode =
            req.body.Order.BuyerParty.PostalCode;
          order.Order.OrderHeader.OrderParty.BuyerParty.Party.NameAddress.City =
            req.body.Order.BuyerParty.City;
          order.Order.OrderHeader.OrderParty.BuyerParty.Party.NameAddress.Country.CountryCoded =
            req.body.Order.BuyerParty.Country;
          order.Order.OrderHeader.OrderParty.BuyerParty.Party.OrderContact.Contact.ContactName =
            req.body.Order.BuyerParty.ContactName;
          order.Order.OrderHeader.OrderParty.BuyerParty.Party.OrderContact.Contact.ListOfContactNumber.ContactNumber[0].ContactNumberValue =
            req.body.Order.BuyerParty.ContactPhone; // Can be blank?
          order.Order.OrderHeader.OrderParty.BuyerParty.Party.OrderContact.Contact.ListOfContactNumber.ContactNumber[1].ContactNumberValue =
            req.body.Order.BuyerParty.ContactEmail; // Can be blank?
          order.Order.OrderHeader.OrderParty.BuyerTaxInformation.PartyTaxInformation.TaxIdentifier.Identifier.Ident =
            req.body.Order.BuyerParty.TaxIdentifier;

          order.Order.OrderHeader.OrderParty.ShipToParty.Party.PartyID.Identifier.Ident =
            req.body.Order.ShipToParty?.PartyID ||
            req.body.Order.BuyerParty.PartyID;
          order.Order.OrderHeader.OrderParty.ShipToParty.Party.NameAddress.Name1 =
            req.body.Order.ShipToParty?.Name || req.body.Order.BuyerParty.Name;
          order.Order.OrderHeader.OrderParty.ShipToParty.Party.NameAddress.Street =
            req.body.Order.ShipToParty?.Street ||
            req.body.Order.BuyerParty.Street;
          order.Order.OrderHeader.OrderParty.ShipToParty.Party.NameAddress.PostalCode =
            req.body.Order.ShipToParty?.PostalCode ||
            req.body.Order.BuyerParty.PostalCode;
          order.Order.OrderHeader.OrderParty.ShipToParty.Party.NameAddress.City =
            req.body.Order.ShipToParty?.City || req.body.Order.BuyerParty.City;
          order.Order.OrderHeader.OrderParty.ShipToParty.Party.NameAddress.Country.CountryCoded =
            req.body.Order.ShipToParty?.Country ||
            req.body.Order.BuyerParty.Country;
          order.Order.OrderHeader.OrderParty.ShipToParty.Party.OrderContact.Contact.ContactName =
            req.body.Order.ShipToParty?.ContactName ||
            req.body.Order.BuyerParty.ContactName;
          order.Order.OrderHeader.OrderParty.ShipToParty.Party.OrderContact.Contact.ListOfContactNumber.ContactNumber[0].ContactNumberValue =
            req.body.Order.ShipToParty?.ContactPhone ||
            req.body.Order.BuyerParty.ContactPhone; // Can be blank?
          order.Order.OrderHeader.OrderParty.ShipToParty.Party.OrderContact.Contact.ListOfContactNumber.ContactNumber[1].ContactNumberValue =
            req.body.Order.ShipToParty?.ContactEmail ||
            req.body.Order.BuyerParty.ContactEmail; // Can be blank?

          order.Order.OrderHeader.OrderParty.BillToParty.Party.PartyID.Identifier.Ident =
            req.body.Order.BillToParty?.PartyID ||
            req.body.Order.BuyerParty.PartyID;
          order.Order.OrderHeader.OrderParty.BillToParty.Party.NameAddress.Name1 =
            req.body.Order.BillToParty?.Name || req.body.Order.BuyerParty.Name;
          order.Order.OrderHeader.OrderParty.BillToParty.Party.NameAddress.Street =
            req.body.Order.BillToParty?.Street ||
            req.body.Order.BuyerParty.Street;
          order.Order.OrderHeader.OrderParty.BillToParty.Party.NameAddress.PostalCode =
            req.body.Order.BillToParty?.PostalCode ||
            req.body.Order.BuyerParty.PostalCode;
          order.Order.OrderHeader.OrderParty.BillToParty.Party.NameAddress.City =
            req.body.Order.BillToParty?.City || req.body.Order.BuyerParty.City;
          order.Order.OrderHeader.OrderParty.BillToParty.Party.NameAddress.Country.CountryCoded =
            req.body.Order.BillToParty?.Country ||
            req.body.Order.BuyerParty.Country;
          //order.Order.OrderHeader.OrderParty.BillToParty.Party.OrderContact.ContactName = req.body.Order.BillToParty?.ContactName || req.body.Order.BuyerParty.ContactName; // Needed ?
          //order.Order.OrderHeader.OrderParty.BillToParty.Party.OrderContact.Contact.ListOfContactNumber.ContactNumber[0].ContactNumberValue = req.body.Order.BillToParty?.ContactPhone || req.body.Order.BuyerParty.ContactPhone; // Needed ?
          //order.Order.OrderHeader.OrderParty.BillToParty.Party.OrderContact.Contact.ListOfContactNumber.ContactNumber[1].ContactNumberValue = req.body.Order.BillToParty?.ContactEmail || req.body.Order.BuyerParty.ContactEmail; // Needed ?
        } catch (err) {
          return res.status(500).send({ error: err.message });
        }

        order.Order.OrderDetail.ListOfItemDetail = {
          ItemDetail: [],
        };

        let orderRowsCount = 0;
        let totalMonetaryAmount = 0.0;

        ```
        /**
         * Processes order rows from the request body and adds them to the order detail.
         * @param {Object} req - The request object containing the order rows.
         * @param {Object} res - The response object for sending error responses.
         * @param {Object} parser - The parser object for parsing XML.
         * @param {string} orderRowBaseXML - The base XML template for order rows.
         * @param {Object} order - The order object to which item details are added.
         * @param {string} currentDateTime - The current date and time.
         * @returns {undefined} This function doesn't return a value, but modifies the order object and may send an error response.
         */
        ```
        req.body.OrderRows.forEach((requestOrderRow) => {
          ++orderRowsCount;
          try {
            let monetaryAmount;
            if (requestOrderRow.Price > 0) {
              monetaryAmount = (
                parseFloat(requestOrderRow.Price) *
                parseInt(requestOrderRow.Quantity)
              ).toFixed(2);
              totalMonetaryAmount =
                totalMonetaryAmount + parseFloat(monetaryAmount);
            }
            let orderRow = parser.parse(orderRowBaseXML);
            orderRow.ItemDetail.BaseItemDetail.LineItemNum.BuyerLineItemNum =
              orderRowsCount;
            orderRow.ItemDetail.BaseItemDetail.ItemIdentifiers.PartNumbers.SellerPartNumber.PartNum.PartID =
              requestOrderRow.PartID;
            orderRow.ItemDetail.BaseItemDetail.ItemIdentifiers.CommodityCode.Identifier.Ident =
              requestOrderRow.CommodityCode; // US-UN-SPSC - Always exists/needed?
            orderRow.ItemDetail.BaseItemDetail.TotalQuantity.Quantity.QuantityValue =
              requestOrderRow.Quantity;
            orderRow.ItemDetail.PricingDetail.ListOfPrice.Price.UnitPrice.UnitPriceValue =
              requestOrderRow.Price;
            orderRow.ItemDetail.PricingDetail.ListOfPrice.Price.UnitPrice.Currency.CurrencyCoded =
              requestOrderRow.Currency;
            orderRow.ItemDetail.PricingDetail.ListOfPrice.Price.PriceBasisQuantity.Quantity.QuantityValue =
              requestOrderRow.Quantity;
            orderRow.ItemDetail.PricingDetail.TotalValue.MonetaryValue.MonetaryAmount =
              monetaryAmount;
            orderRow.ItemDetail.DeliveryDetail.ListOfScheduleLine.ScheduleLine.Quantity.QuantityValue =
              requestOrderRow.Quantity;
            orderRow.ItemDetail.DeliveryDetail.ListOfScheduleLine.ScheduleLine.RequestedDeliveryDate =
              currentDateTime;
            orderRow.ItemDetail.LineItemNote = requestOrderRow.LineItemNote;
            order.Order.OrderDetail.ListOfItemDetail.ItemDetail.push(
              orderRow.ItemDetail
            );
          } catch (err) {
            return res.status(500).send({ error: err.message });
          }
        });

        try {
          order.Order.OrderSummary.NumberOfLines =
            order.Order.OrderDetail.ListOfItemDetail.length;
          order.Order.OrderSummary.TotalAmount.MonetaryValue.MonetaryAmount =
            parseFloat(totalMonetaryAmount).toFixed(2); // Calculate
          order.Order.OrderSummary.TotalAmount.MonetaryValue.Currency.CurrencyCoded =
            req.body.Order.Currency; // Correct where to get it from?
        } catch (err) {
          return res.status(500).send({ error: err.message });
        }

        let xmlDataStr;
        try {
          xmlDataStr = builder.build(order);
        } catch (err) {
          return res.status(500).send({ error: err.message });
        }

        return res.status(200).send(xmlDataStr);
      },
    },
  ],
};

export { module };
