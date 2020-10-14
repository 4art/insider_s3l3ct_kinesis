import boto3
import requests
import json
import random
import asyncio
import nest_asyncio
import logging
import aiohttp
import datetime
from datetime import timezone
from aiohttp import ClientSession

client = boto3.client('lambda')
sqs = boto3.client('sqs')

QUEUE_NAME = "https://sqs.eu-central-1.amazonaws.com/763862102163/options-collect-sqs-dev"
nest_asyncio.apply()
loop = asyncio.get_event_loop()


def get_lambda_json_response(lmbd):
    response = client.invoke(
        FunctionName=lmbd,
        InvocationType='RequestResponse'
    )
    payload = response["Payload"].read()
    json_string = json.loads(payload)['body']
    return json.loads(json_string)


class Options_screener:
    def __init__(self):
        self.proxies = self.get_proxies()
        self.tickers = self.get_tickers()
        self.options = []

    def get_url(self, ticker):
        return "https://www.optionsprofitcalculator.com/ajax/getOptions?stock={}&reqId=1".format(ticker)

    def get_proxies(self):
        proxies = get_lambda_json_response('insider-dev-get_all_proxies')
        return list(map(lambda prx: "http://{}:{}".format(prx['host'], prx['port']), proxies))

    def get_tickers(self):
        companies = get_lambda_json_response('insider-dev-optionalStocks')
        return list(map(lambda com: com['Ticker'], companies))

    async def getOptions(self):
        # for ticker in self.tickers:
        #    self.addOption(ticker)
        while len(self.tickers) > 0:
            print("Running get Options")
            input_coroutines = list(map(lambda ticker: asyncio.ensure_future(
                self.addOption(ticker)), self.tickers))
            await asyncio.gather(*input_coroutines, return_exceptions=False)
        return self.options

    def convertOptionsAndpush(self, ticker, options):
        self.tickers.remove(ticker)
        print("saving options for {}, proxies size: {}, tickers size: {}".format(
            ticker, len(self.proxies), len(self.tickers)))
        obj = {
            "ticker": ticker,
            "datetime": datetime.datetime.now(tz=timezone.utc).strftime("%Y-%d-%m %H:%M:%S"),
            "options": options
        }
        jstr = json.dumps(obj)
        sqs.send_message(QueueUrl=QUEUE_NAME, MessageBody=jstr)
        #print("added options for {}".format(ticker))
        # for exp in options['options']:
        #    for t in options['options'][exp]:
        #        for strike in options['options'][exp][t]:
        #            self.options.append({
        #                "ticker": ticker,
        #                "strike": float(strike),
        #                "ask": float(options['options'][exp][t][strike]["a"]),
        #                "bid": float(options['options'][exp][t][strike]["b"]),
        #                "mid": float(options['options'][exp][t][strike]["l"]),
        #                "volume": float(options['options'][exp][t][strike]["v"]),
        #                "datetime": datetime.datetime.now(),
        #                "exp": exp,
        #                "type": type
        #            })
        # self.options.append(options)

    async def addOption(self, ticker):
        proxy_index = random.randint(0, len(self.proxies) - 1)
        #proxy = {"http": self.proxies[proxy_index], "https": self.proxies[proxy_index]}
        proxy = self.proxies[proxy_index]
        timeout = aiohttp.ClientTimeout(total=45)
        #response = sqs.send_message(
        #    QueueUrl=QUEUE_NAME, MessageBody=json.dumps({"text": "bla bla"}))
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
        try:
            #timeout = aiohttp.ClientTimeout(total=2)
            async with ClientSession(timeout=timeout) as session:
                async with session.get(self.get_url(ticker), headers=headers, proxy=proxy) as response:
                    text = await response.read()
                    content = json.loads(text)
                    self.convertOptionsAndpush(ticker, content)
        except:
            try:
                # self.proxies.remove(proxy)
                logging.debug("removed proxy: {}. Count: {}".format(
                    proxy, len(self.proxies)))
            except:
                logging.debug("{} is already removed".format(proxy))
            self.addOption(ticker)


if __name__ == "__main__":
    loop.run_until_complete(Options_screener().getOptions())
