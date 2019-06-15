const transactionsService = require('./service/transactionsService')
const fhService = require('./service/fhService')

module.exports.DE = async event => {
    let transactions = await transactionsService.DE()
    console.log(transactions)
    return {
        statusCode: 200,
        body: JSON.stringify({
            transactions: transactions,
            stream: process.env.deliveryStreamDE,
            upload: null
        }),
    }
};
