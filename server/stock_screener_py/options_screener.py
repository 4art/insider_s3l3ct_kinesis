import os
import boto3
import requests
import json
import asyncio
import nest_asyncio
import logging
import aiohttp
import time
from random import randint
from functools import reduce
from pandas import DataFrame
from time import sleep
from datetime import datetime
from datetime import timezone
from aiohttp import ClientSession

#os.environ["select_bucket"] = "myinsiderposition-dev"
BUCKET = os.getenv("select_bucket")
#os.environ["optionsGlueDB"] = "myinsiderpositiondev"
#os.environ["athenaOutput"] = "s3://{}/options_output".format(BUCKET)
#os.environ["optionsGlueTable"] = "optionsdev"

client = boto3.client('lambda')
fh = boto3.client('firehose')
athena = boto3.client('athena')
athenaDB = os.getenv("optionsGlueDB")
optionsGlueTable = os.getenv("optionsGlueTable")
athenaOutput = os.getenv("athenaOutput")
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
        self.option_json = []
        self.optionsDS = os.environ.get('optionsDeliveryStream')

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
        start_time = time.time()
        print("delivery_stream_name: {}".format(self.optionsDS))
        while len(self.tickers) > 0 and (time.time() - start_time)/60 < 13:
            print("Running get Options mins: {}".format(
                (time.time() - start_time)/60))
            input_coroutines = list(map(lambda ticker: asyncio.ensure_future(
                self.addOption(ticker)), self.tickers))
            await asyncio.gather(*input_coroutines, return_exceptions=False)
            input_coroutines = list(map(lambda x: asyncio.ensure_future(write_dataframe_to_parquet_on_s3(
                x["options"], x["ticker"])), self.options))
            queries = await asyncio.gather(*input_coroutines, return_exceptions=False)
            query = reduce(lambda x, y: x+y, queries)

            self.options = []
            # records = list(
            #    map(lambda el: {'Data': el.encode()}, self.option_json))
            # for record in chunks(records, 500):
            #    response = fh.put_record_batch(
            #        DeliveryStreamName=self.optionsDS,
            #        Records=record
            #    )
            #    sleep(1.5)
            #    if response['FailedPutCount'] > 0:
            #        print(response)
            self.option_json = []
        return {"status": "done"}

    def convertOptionsAndpush(self, ticker, options):
        self.tickers.remove(ticker)
        print("saving options for {}, proxies size: {}, tickers size: {}".format(
            ticker, len(self.proxies), len(self.tickers)))
        exp_options = []
        ticker_options = []
        dt = datetime.utcnow()
        try:
            for exp in options['options']:
                for t in options['options'][exp]:
                    for strike in options['options'][exp][t]:
                        option = {
                            "ticker": ticker,
                            "strike": float(strike),
                            "ask": float(options['options'][exp][t][strike]["a"]),
                            "bid": float(options['options'][exp][t][strike]["b"]),
                            "mid": float(options['options'][exp][t][strike]["l"]),
                            "volume": float(options['options'][exp][t][strike]["v"]),
                            "datetime": dt,
                            "year": dt.year,
                            "month": dt.month,
                            "day": dt.day,
                            "hour": dt.hour,
                            "exp": exp,
                            "type": 'CALL' if t == 'c' else 'PUT'
                        }
                        ticker_options.append(option)
                exp_options.append({"exp": exp, "options": ticker_options})
                ticker_options = []
        finally:
            self.options.append({"ticker": ticker, "options": exp_options})

    async def addOption(self, ticker):
        proxy_index = randint(0, len(self.proxies) - 1)
        #proxy = {"http": self.proxies[proxy_index], "https": self.proxies[proxy_index]}
        proxy = self.proxies[proxy_index]
        timeout = aiohttp.ClientTimeout(total=45)
        # response = sqs.send_message(
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


def chunks(lst, n):
    return [lst[i:i + n] for i in range(0, len(lst), n)]


def uploadOptions(event, context):
    print("start")
    if datetime.today().weekday() < 5:
        loop.run_until_complete(Options_screener().getOptions())
    return '''
    {
        "status": "Successfully uploaded options"
    }
    '''

async def write_dataframe_to_parquet_on_s3(exp_arr, ticker):
    """ Write a dataframe to a Parquet on S3 """
    dt = datetime.utcnow()
    queries = []
    for exp_obj in exp_arr:
        dataframe = DataFrame(exp_obj['options'])
        output_file = "s3://{}/options/year={}/month={}/day={}/hour={}/ticker={}/exp={}/{}{}{}.parquet".format(
            BUCKET,
            dt.year,
            dt.month,
            dt.day,
            dt.hour,
            ticker,
            exp_obj['exp'],
            exp_obj['exp'].replace("-", ""),
            ticker,
            dt.strftime("%Y%m%d%H%M%S%f"))
        query = "ALTER TABLE {}.{} ADD PARTITION (dt = '{}', ticker = '{}', year = '{}', month = '{}', day = '{}', hour = '{}', exp = '{}') LOCATION '{}';".format(
            athenaDB, 
            optionsGlueTable, 
            dt.strftime("%Y-%m-%d"), 
            ticker, 
            dt.year,
            dt.month,
            dt.day,
            dt.hour, 
            exp_obj['exp'], 
            output_file)
        queries.append(query)
        print("Writing {} records to {}".format(len(dataframe), output_file))
        dataframe.to_parquet(output_file)
        run_athena_query(query)
    return queries


def run_athena_query(query):
    # Execution
    response = athena.start_query_execution(
        QueryString=query,
        QueryExecutionContext={
            'Database': athenaDB,
        },
        ResultConfiguration={
            'OutputLocation': athenaOutput,
        }
    )
    return response


if __name__ == "__main__":
    uploadOptions("", "")
