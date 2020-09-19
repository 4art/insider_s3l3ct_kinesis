const csv = require('csvtojson');
const s3Service = require('./s3Service');

const defaultKeys = ["Ticker", "Company", "Sector", "Industry", "Country", "Price_val"]

exports.optional = async keys => s3Service.stocksSelect(process.env.select_bucket).getOptionalStocks(keys ? keys : defaultKeys)

exports.tickerOptional = async ticker => s3Service.stocksSelect(process.env.select_bucket).getOptionalStock(ticker)