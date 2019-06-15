'use strict';

const companies = require('./companies')
// const transactionsService = require('./service/transactionsService')
const s3Service = require('./service/s3Service')

exports.create = async event => {
  // var transactions = await transactionsService.DE()
  var e = await s3Service.upload(JSON.stringify({ companies: companies }, null, 4), 'companies.json', process.env.select_bucket)
  return {
    statusCode: 200,
    body: JSON.stringify({
      companies: companies,
      bucket: process.env.select_bucket,
      upload: e
    })
  };
};

