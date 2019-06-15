const transactionsService = require('./service/transactionsService')
const fhService = require('./service/fhService')

module.exports.putToStream = async event => {
  let transactions = await transactionsService.DE()
  let result = await fhService.putToStreamBatch(process.env.deliveryStreamDE, transactions)

  return {
    statusCode: 200,
    body: JSON.stringify({
      companies: transactions,
      stream: process.env.deliveryStreamDE,
      upload: result
    })
  }
};