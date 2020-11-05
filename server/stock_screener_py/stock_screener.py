import re
import boto3
import os
import itertools
import time
import json
import requests
import logging
import asyncio
import aiohttp
from aiohttp import ClientSession
from bs4 import BeautifulSoup

loop = asyncio.get_event_loop()
client = boto3.client('lambda')


def save_all_optionable(event, context):
    stocks = loop.run_until_complete(
        Stock_screener().get_stocks("sh_opt_option"))
    S3Service().put_optional_stocks(stocks)
    return '''
    {
        "status": "Successfully uploaded optional stocks"
    }
    '''


def save_all(event, context):
    stocks = Stock_screener().get_stocks()
    S3Service().put_stocks(stocks)
    return '''
    {
        "status": "Successfully uploaded stocks"
    }
    '''


class Stock_screener:
    def __init__(self):
        self.optStocksLen = self.getRList(4500)
        self.allStocksLen = self.getRList(8000)
        self.l = []
        self.done = False
        self.proxies = self.get_proxies()
        self.proxyIndex = 0
        self.workingProxies = []

    def getRList(self, len):
        l = []
        iter = 0
        while iter <= len:
            l.append(iter)
            iter += 20
        return l

    def getProxy(self):
        if self.proxyIndex >= len(self.proxies):
            self.proxyIndex = 0
        proxy = self.proxies[self.proxyIndex]
        self.proxyIndex += 1
        return proxy

    def get_proxies(self):
        proxies = get_lambda_json_response('insider-dev-get_all_proxies')
        return list(map(lambda prx: "http://{}:{}".format(prx['host'], prx['port']), proxies))

    async def create_stocks(self, url, proxy):
        timeout = aiohttp.ClientTimeout(total=45)
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
        #print("run {}, {}".format(url, proxy))
        try:
            #timeout = aiohttp.ClientTimeout(total=2)
            async with ClientSession(timeout=timeout) as session:
                async with session.get(url, headers=headers, proxy=proxy) as response:
                    text = await response.read()
                    soup = BeautifulSoup(text)
                    div = soup.find(id="screener-content")
                    if div != None:
                        self.workingProxies.append(proxy)
                        tables = div.find("table").find_all("table")
                        table = tables[2]
                        table_data = [[cell.text for cell in row("td")]
                                      for row in table("tr")]
                        j = self.convert_table_data_to_json(table_data)
                        self.l.extend(j)
                        self.urls.remove(url)
                        print("rest URL's count: {}".format(len(self.urls)))
                    else:
                        self.proxies.remove(proxy)
                        self.workingProxies.remove(proxy)

        except:
            try:
                # self.proxies.remove(proxy)
                self.workingProxies.remove(proxy)
                logging.info("removed proxy: {}. Count: {}".format(
                    proxy, len(self.proxies)))
            except:
                logging.debug("{} is already removed".format(proxy))

    def convert_table_data_to_json(self, table_data):
        r = range(1, len(table_data))
        keys = table_data[0]
        l = []
        for i in r:
            table = table_data[i]
            obj = {"time": time.time()}
            for key in range(len(table)):
                obj[keys[key]] = table[key]
            if int(obj["No."]) < len(self.l):
                self.done = True
                return
            #conv_obj = self.convert_data_types(obj)
            conv_obj = obj
            duplicates = list(
                filter(lambda v: v["Ticker"] == conv_obj["Ticker"], self.l))
            if duplicates:
                self.done = True
                return
            l.append(conv_obj)
        return l

    def convert_data_types(self, obj):
        obj['Market Cap Val'] = self.convert_big_value(obj['Market Cap'])
        obj['No.'] = int(obj['No.'])
        obj['P/E_val'] = self.convert_to_float(obj['P/E'])
        obj['Fwd P/E_val'] = self.convert_to_float(obj['Fwd P/E'])
        obj['PEG_val'] = self.convert_to_float(obj['PEG'])
        obj['P/S_val'] = self.convert_to_float(obj['P/S'])
        obj['P/B_val'] = self.convert_to_float(obj['P/B'])
        obj['P/C_val'] = self.convert_to_float(obj['P/C'])
        obj['P/FCF_val'] = self.convert_to_float(obj['P/FCF'])
        obj['P/FCF_val'] = self.convert_to_float(obj['P/FCF'])
        obj['EPS_val'] = self.convert_to_float(obj['EPS'])
        obj['Dividend_val'] = self.convert_percent_string(obj['Dividend'])
        obj['Payout Ratio_val'] = self.convert_percent_string(
            obj['Payout Ratio'])
        obj['EPS this Y_val'] = self.convert_percent_string(obj['EPS this Y'])
        obj['EPS next Y_val'] = self.convert_percent_string(obj['EPS next Y'])
        obj['EPS past 5Y_val'] = self.convert_percent_string(
            obj['EPS past 5Y'])
        obj['EPS next 5Y_val'] = self.convert_percent_string(
            obj['EPS next 5Y'])
        obj['EPS Q/Q_val'] = self.convert_percent_string(obj['EPS Q/Q'])
        obj['Sales past 5Y_val'] = self.convert_percent_string(
            obj['Sales past 5Y'])
        obj['Sales Q/Q_val'] = self.convert_percent_string(obj['Sales Q/Q'])
        obj['Insider Own_val'] = self.convert_percent_string(
            obj['Insider Own'])
        obj['Insider Trans_val'] = self.convert_percent_string(
            obj['Insider Trans'])
        obj['Inst Own_val'] = self.convert_percent_string(obj['Inst Own'])
        obj['Inst Trans_val'] = self.convert_percent_string(obj['Inst Trans'])
        obj['Float Short_val'] = self.convert_percent_string(
            obj['Float Short'])
        obj['Float Short_val'] = self.convert_percent_string(
            obj['Float Short'])
        obj['ROA_val'] = self.convert_percent_string(obj['ROA'])
        obj['ROE_val'] = self.convert_percent_string(obj['ROE'])
        obj['ROI_val'] = self.convert_percent_string(obj['ROI'])
        obj['Short Ratio_val'] = self.convert_to_float(obj['Short Ratio'])
        obj['Curr R_val'] = self.convert_to_float(obj['Curr R'])
        obj['Quick R_val'] = self.convert_to_float(obj['Quick R'])
        obj['LTDebt/Eq_val'] = self.convert_to_float(obj['LTDebt/Eq'])
        obj['Debt/Eq_val'] = self.convert_to_float(obj['Debt/Eq'])
        obj['Gross M_val'] = self.convert_percent_string(obj['Gross M'])
        obj['Oper M_val'] = self.convert_percent_string(obj['Oper M'])
        obj['Profit M_val'] = self.convert_percent_string(obj['Profit M'])
        obj['Perf Week_val'] = self.convert_percent_string(obj['Perf Week'])
        obj['Perf Month_val'] = self.convert_percent_string(obj['Perf Month'])
        obj['Perf Quart_val'] = self.convert_percent_string(obj['Perf Quart'])
        obj['Perf Half_val'] = self.convert_percent_string(obj['Perf Half'])
        obj['Perf Year_val'] = self.convert_percent_string(obj['Perf Year'])
        obj['Perf YTD_val'] = self.convert_percent_string(obj['Perf YTD'])
        obj['Beta_val'] = self.convert_to_float(obj['Beta'])
        obj['ATR_val'] = self.convert_to_float(obj['ATR'])
        obj['Volatility W_val'] = self.convert_percent_string(
            obj['Volatility W'])
        obj['Volatility M_val'] = self.convert_percent_string(
            obj['Volatility M'])
        obj['SMA20_val'] = self.convert_percent_string(obj['SMA20'])
        obj['SMA50_val'] = self.convert_percent_string(obj['SMA50'])
        obj['SMA200_val'] = self.convert_percent_string(obj['SMA200'])
        obj['50D High_val'] = self.convert_percent_string(obj['50D High'])
        obj['50D Low_val'] = self.convert_percent_string(obj['50D Low'])
        obj['52W High_val'] = self.convert_percent_string(obj['52W High'])
        obj['52W Low_val'] = self.convert_percent_string(obj['52W Low'])
        obj['RSI_val'] = self.convert_to_float(obj['RSI'])
        obj['from Open_val'] = self.convert_percent_string(obj['from Open'])
        obj['Gap_val'] = self.convert_percent_string(obj['Gap'])
        obj['Recom_val'] = self.convert_to_float(obj['Recom'])
        obj['Avg Volume_val'] = self.convert_big_value(obj['Avg Volume'])
        obj['Price_val'] = self.convert_to_float(obj['Price'])
        obj['Change_val'] = self.convert_percent_string(obj['Change'])
        obj['Volume_val'] = int(re.sub(",", "", obj['Volume']))  # !!!!!
        obj['Target Price_val'] = self.convert_to_float(obj['Target Price'])
        return obj

    def convert_percent_string(self, str):
        return self.convert_to_float(re.sub("%", "", str))

    def convert_big_value(self, str):
        fls = re.sub("[a-zA-Z]", "", str)
        val = self.convert_to_float(fls)
        if "B" in str:
            val = val * 1000000000
        elif "T" in str:
            val = val * 1000000000000
        elif "M" in str:
            val = val * 1000000
        if val is None:
            return val
        return int(val)

    def convert_to_float(self, str=""):
        if re.match(r'^-?\d+(?:\.\d+)?$', str) is None:
            return None
        return float(str)

    def getUrlsWithWorkingProxies(self):
        if len(self.workingProxies) == 0 or len(self.urls) == 0:
            return []
        if len(self.workingProxies) > len(self.urls):
            return [{"url": self.urls[i], "proxy": proxy} for i,proxy in enumerate(self.workingProxies[:len(self.urls)])] 
            #return list(map(lambda proxy: {"url": self.urls[self.workingProxies.index(proxy)], "proxy": proxy}, self.workingProxies))
        return [{"url": url, "proxy": self.workingProxies[i]} for i,url in enumerate(self.urls[:len(self.workingProxies)])] 
        #return list(map(lambda url: {"url": url, "proxy": self.workingProxies[self.urls.index(url)]}, self.urls))

    async def get_stocks(self, option=""):
        self.urls = list(map(lambda r: 'https://finviz.com/screener.ashx?v=151&o=ticker&c=0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69&r={}'.format(
            r), self.allStocksLen))
        if option:
            self.urls = list(map(lambda r: 'https://finviz.com/screener.ashx?v=151&f={}&o=ticker&c=0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69&r={}'.format(
                option, r), self.optStocksLen))
        stocks = []
        #len(self.proxies) % len(self.urls)
        while len(self.urls) != 0:
            print("running async urls")
            urls = []
            input_coroutines = []
            if len(self.workingProxies) < 100:
                print("looking for working proxies")
                urls = list(map(lambda iter: self.urls, [None] * int(600/len(self.urls))))
                urls = list(itertools.chain.from_iterable(urls))
                input_coroutines = list(map(lambda url: asyncio.ensure_future(
                    self.create_stocks(url, self.getProxy())), urls))
            else:
                print("using working proxies")
                urls_proxies = self.getUrlsWithWorkingProxies()
                input_coroutines = list(map(lambda obj: asyncio.ensure_future(
                    self.create_stocks(obj["url"], obj["proxy"])), urls_proxies))
            res = await asyncio.gather(*input_coroutines, return_exceptions=False)
            stocks.extend(res)
        return stocks


class S3Service:
    def put_optional_stocks(self, j):
        self.put_text_to_file(os.environ.get(
            'select_bucket'), 'stocks_optional.json', self.convert_json_to_s3(j))

    def put_stocks(self, j):
        self.put_text_to_file(os.environ.get(
            'select_bucket'), 'stocks.json', self.convert_json_to_s3(j))

    def put_text_to_file(self, bucket, key, text):
        s3 = boto3.resource('s3')
        object = s3.Object(bucket, key)
        object.put(Body=text)

    def convert_json_to_s3(self, j):
        s = json.dumps(j)
        return re.sub(r"\}\,\s+\{", "}\n{", s[1:-1])


def get_lambda_json_response(lmbd):
    response = client.invoke(
        FunctionName=lmbd,
        InvocationType='RequestResponse'
    )
    payload = response["Payload"].read()
    json_string = json.loads(payload)['body']
    return json.loads(json_string)


if __name__ == "__main__":
    save_all_optionable('', '')
