'use strict';

const transactionsService = require('./server/service/transactionsService')
const s3Service = require('./server/service/s3Service')
const converter = require('./server/service/converter')

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

