const transactionsService = require('./service/tradesService')
const fhService = require('./service/fhService')

module.exports.DE = async event => {
    let transactions = await transactionsService.DE()
    return {
        statusCode: 200,
        body: JSON.stringify({
            transactions: transactions,
            stream: process.env.deliveryStreamDE,
            upload: null
        }),
    }
};
