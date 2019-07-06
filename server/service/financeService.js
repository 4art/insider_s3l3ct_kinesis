const request = require('request');

exports.getCompanyHistoricalChartData = async isin => new Promise((resolve, reject) => {
    request('https://www.highcharts.com/samples/data/aapl-c.json', (error, response, body) => {
        if (error) return reject(error);

        return resolve(body)
    })

});


