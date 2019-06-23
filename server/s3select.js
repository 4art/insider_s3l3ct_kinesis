'use strict';

const transactionsService = require('./service/transactionsService')
const s3Service = require('./service/s3Service')
const converter = require('./service/converter')

exports.create = async event => {
  var transactions = await transactionsService.DE()
  var e = await s3Service.upload(converter.convertArrToS3Json(transactions), 'transactions.json', process.env.select_bucket)
  return {
    statusCode: 200,
    body: JSON.stringify({
      transactions: transactions,
      bucket: process.env.select_bucket,
      upload: e
    })
  };
};

exports.select = async event => {
  return {
    statusCode: 200,
    body: JSON.stringify([], null, 4)
  };
};

