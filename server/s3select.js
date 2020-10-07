'use strict';

const tradesService = require('./service/tradesService');
const s3Service = require('./service/s3Service');
const stocksService = require('./service/stocksService');
const proxiesService = require('./service/proxiesService');
const financeService = require('./service/financeService');
const converter = require('./service/converter');
const helper = require('./service/helper');

exports.create = async event => {
    var trades = await tradesService.DE();
    var e = await s3Service.upload(converter.convertArrToS3Json(trades), 'trades.json', process.env.select_bucket);
    return {
        statusCode: 200,
        body: JSON.stringify({
            trades: trades,
            bucket: process.env.select_bucket,
            upload: e
        })
    };
};

exports.tradesDE = async event =>
    helper.getLambdaResponse(await s3Service.tradesSelect(process.env.select_bucket).getLastTrades(event.queryStringParameters ? event.queryStringParameters.limit : null, event.queryStringParameters ? event.queryStringParameters.isin : ""));

exports.companiesDE = async event => helper.getLambdaResponse(await s3Service.tradesSelect(process.env.select_bucket).getAllCompanies());

exports.insidersDE = async event => helper.getLambdaResponse(await s3Service.tradesSelect(process.env.select_bucket).getInsiders(event.queryStringParameters ? event.queryStringParameters.isin : null));

exports.companyHistoricalChartData = async event => helper.getLambdaResponse(await financeService.getCompanyHistoricalChartData(event.queryStringParameters ? event.queryStringParameters.isin : null));

exports.optionalStocks = async event => helper.getLambdaResponse(await stocksService.optional(event.queryStringParameters ? Array.isArray(event.queryStringParameters.keys) ? event.queryStringParameters.keys : null : null));

exports.optionalStock = async event => helper.getLambdaResponse(await stocksService.tickerOptional(event.pathParameters.ticker));

exports.updateAllProxies = async event => helper.getLambdaResponse(await proxiesService.proxiesService.updateAllProxies().then(v => JSON.stringify({proxies: v.filter(v => typeof v.err == 'undefined'), status: "Proxies updated"})));

exports.getAllProxies = async event => helper.getLambdaResponse(await proxiesService.proxiesService.getAllProxies().then(v => JSON.stringify(v)));