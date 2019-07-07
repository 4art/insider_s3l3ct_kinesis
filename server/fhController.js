const transactionsService = require('./service/tradesService')
const fhService = require('./service/fhService')

module.exports.putToStream = async event => {
  let transactions = await transactionsService.DE()
    const result = await Promise.all(transactions.map(v => fhService.putToStream(process.env.deliveryStreamDE, v)));
    return {
    statusCode: 200,
    body: JSON.stringify({
      companies: transactions,
      stream: process.env.deliveryStreamDE,
      upload: result
    })
  }
};
