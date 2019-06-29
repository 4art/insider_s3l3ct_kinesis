'use strict';

const transactionsService = require('./service/tradesService');
const s3Service = require('./service/s3Service');
const converter = require('./service/converter');
const helper = require('./service/helper');

exports.create = async event => {
    var transactions = await transactionsService.DE();
    var e = await s3Service.upload(converter.convertArrToS3Json(transactions), 'transactions.json', process.env.select_bucket);
    return {
        statusCode: 200,
        body: JSON.stringify({
            transactions: transactions,
            bucket: process.env.select_bucket,
            upload: e
        })
    };
};

exports.tradesDE = async event =>
    helper.getLambdaResponse(await s3Service.select(process.env.select_bucket).getLastTrades(event.queryStringParameters ? event.queryStringParameters.limit : null, event.queryStringParameters ? event.queryStringParameters.isin : ""));

exports.companiesDE = async event => helper.getLambdaResponse(await s3Service.select(process.env.select_bucket).getAllCompanies());

exports.insidersDE = async event => helper.getLambdaResponse(await s3Service.select(process.env.select_bucket).getInsiders(event.queryStringParameters ? event.queryStringParameters.isin : null));
