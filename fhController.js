'use strict';

const companies = require('./companies')
const fhService = require('./service/fhService')

module.exports.putToStream = (event, context, callback) => {
  fhService.putToStream(process.env.deliveryStreamDE, companies).then(e => {
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        companies: companies,
        stream: process.env.deliveryStreamDE,
        upload: e
      }),
    };
  
    callback(null, response);
  }).catch(e => {
    const response = {
      statusCode: 500,
      body: JSON.stringify({
        status: e,
        info: `Can't put file to ${process.env.deliveryStreamDE}`,
        companies: companies
      }),
    };
    callback(null, response);
  })
};