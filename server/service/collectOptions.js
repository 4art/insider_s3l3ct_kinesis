const { tickerOptional } = require('./stocksService');
const proxiesService = require('./proxiesService').proxiesService;
const arrayChunk = require('array-chunk');

const axios = require('axios').default;
const s3Service = require('./s3Service');

async function collect_options() {
    const stocksPromise = s3Service.stocksSelect(process.env.select_bucket).getOptionalStocks(["Ticker", "Market Cap Val"]).then(v => JSON.parse(v)).then(v => v.sort((a, b) => b["Market Cap Val"] - a["Market Cap Val"]));
    const allProxiesPromise = proxiesService.getWorkedProxies();
    var stocks = await stocksPromise
    let allProxies = await allProxiesPromise;
    let proxiesCopy = [];

    allProxies.forEach(element => proxiesCopy.push(element));
    let iProx = 0
    let getProxy = () => {
        if (allProxies.length == 0) {
            proxiesCopy.forEach(element => allProxies.push(element));;
        }
        if (iProx > allProxies.length) {
            iProx = 0
        }
        let p = allProxies[iProx]
        iProx += 1
        return p
    }

    let removeProxy = proxy => {
        let i = allProxies.findIndex(v =>
            v.host == proxy.host)
        if (i != -1) {
            console.debug(`removing proxy: ${JSON.stringify(proxy)} with index ${i}`)
            allProxies.splice(i, 1)
        }
    }
    /*let optionsPromise = arrayChunk(stocks, allProxies.length).map(async chunk =>
        chunk.map(v => v.Ticker).map(async (ticker, i) => {
            let result = []
            const proxy = { host: proxy.host, port: allProxies[i].port };
            await get_options(ticker, proxy).then(v => {
                if (typeof v !== 'undefined' && v) {
                    result.push(map_option(ticker, v))
                }
            }
            ).catch(err =>
                console.error(`Failed to get options for ${ticker} with proxy: ${proxy}. Error: ${err.toString()}`))
            return result
        })
    )*/

    let optionsPromise = stocks.map(v => v.Ticker).map(async (ticker, i) => {
        return await get_options(ticker).then(v => {
            /*if (typeof v !== 'undefined' && v) {
                const mapedOptions = map_options(ticker, v);
                options.push(mapedOptions)
                stocks.splice(i, 1)
            }*/
            return map_options(ticker, v);
        }).catch(err => {
            console.warn(`Error occupied with ticker: ${ticker} proxy: ${proxy.host}:${proxy.port}`)
        })
    }
    )
    let options = await Promise.all(optionsPromise)
    return options
}

function get_options(ticker, prxies = []) {
    const url = `https://www.optionsprofitcalculator.com/ajax/getOptions?stock=${ticker.toLowerCase()}&reqId=1`;
    console.log(`get option for ticker ${ticker}`)
    if (prxies.length > 0) {
        return new Promise((res, rej) => {
            prxies.map(v => ({ proxy: { host: v.host, port: v.port }, timeout: 30000 })).forEach(async prx => {
                axios.get(url, prx)
                    .then(function (response) {
                        res(response.data)
                    }).catch(err => {
                        console.warn(`Error occupied with ticker: ${ticker} proxy: ${prx.proxy.host}:${prx.proxy.port}`)
                        rej(err)
                    })
            })
        })
    }
    return axios.get(url, { timeout: 30000 })
        .then(function (response) {
            return response.data
        }).catch(err => {
            console.warn(`Error occupied with ticker: ${ticker} error: ${err}`)
        })
}

exports.map_options = (ticker, obj, datetime) => Object.entries(obj.options).map(obj => {
    let result = []
    if (obj[1].c) {
        Object.entries(obj[1].c).forEach(v => {
            result.push({
                datetime: datetime,
                ticker: ticker,
                exp: obj[0],
                type: "CALL",
                strike: parseFloat(v[0]),
                ask: parseFloat(v[1].a),
                bid: parseFloat(v[1].b),
                mid: parseFloat((parseFloat(v[1].l) == 0 ? (parseFloat(v[1].b) + parseFloat(v[1].a)) / 2 : parseFloat(v[1].l)).toFixed(1)),
                volume: parseFloat(v[1].v)
            })
        })
    }
    if (obj[1].p) {
        Object.entries(obj[1].p).forEach(v => {
            result.push({
                datetime: datetime,
                ticker: ticker,
                exp: obj[0],
                type: "PUT",
                strike: parseFloat(v[0]),
                ask: parseFloat(v[1].a),
                bid: parseFloat(v[1].b),
                mid: parseFloat((parseFloat(v[1].l) == 0 ? (parseFloat(v[1].b) + parseFloat(v[1].a)) / 2 : parseFloat(v[1].l)).toFixed(1)),
                volume: parseFloat(v[1].v)
            })
        })
    }
    return result

}).flat()