const transactionsService = require('./server/service/transactionsService')
const fhService = require('./server/service/fhService')

module.exports.putToStream = async event => {
  let transactions = await transactionsService.DE()
  var result = await Promise.all(transactions.map(v => fhService.putToStream(process.env.deliveryStreamDE, v)))
  return {
    statusCode: 200,
    body: JSON.stringify({
      companies: transactions,
      stream: process.env.deliveryStreamDE,
      upload: result
    })
  }
};