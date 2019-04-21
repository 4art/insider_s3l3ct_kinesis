'use strict';

const companies = require('./companies')
const s3Service = require('./service/s3Service')

module.exports.create = (event, context, callback) => {
  s3Service.upload(JSON.stringify({companies: companies}, null, 4), 'companies.json', process.env.select_bucket).then(e => {
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        companies: companies,
        bucket: process.env.select_bucket,
        upload: e
      }),
    };
  
    callback(null, response);
  }).catch(e => {
    const response = {
      statusCode: 500,
      body: JSON.stringify({
        status: e,
        info: `Can't upload file to ${process.env.select_bucket}`,
        companies: companies
      }),
    };
    callback(null, response);
  })
};

