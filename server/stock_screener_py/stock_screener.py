import re
import boto3
import os
import time
import json
import requests
from bs4 import BeautifulSoup

def save_all_optionable(event, context):
    stocks = Stock_screener().get_stocks("sh_opt_option")
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
        self.l = []
        self.done = False

    def create_stocks(self, url):
        headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
        r = requests.get(url, headers=headers)
        soup = BeautifulSoup(r.text)
        div = soup.find(id="screener-content")
        tables = div.find("table").find_all("table")
        table = tables[2]
        table_data = [[cell.text for cell in row("td")]
                                for row in table("tr")]
        self.convert_table_data_to_json(table_data)

    def convert_table_data_to_json(self, table_data):
        r = range(1, len(table_data))
        keys = table_data[0]
        for i in r:
            table = table_data[i]
            obj = {"time": time.time()}
            for key in range(len(table)):
                obj[keys[key]] = table[key]
            if int(obj["No."]) < len(self.l):
                self.done = True
                return
            conv_obj=self.convert_data_types(obj)
            duplicates = list(filter(lambda v: v["Ticker"] == conv_obj["Ticker"], self.l))
            if not duplicates:
                self.l.append(conv_obj)
    
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
        obj['Payout Ratio_val'] = self.convert_percent_string(obj['Payout Ratio'])
        obj['EPS this Y_val'] = self.convert_percent_string(obj['EPS this Y'])
        obj['EPS next Y_val'] = self.convert_percent_string(obj['EPS next Y'])
        obj['EPS past 5Y_val'] = self.convert_percent_string(obj['EPS past 5Y'])
        obj['EPS next 5Y_val'] = self.convert_percent_string(obj['EPS next 5Y'])
        obj['EPS Q/Q_val'] = self.convert_percent_string(obj['EPS Q/Q'])
        obj['Sales past 5Y_val'] = self.convert_percent_string(obj['Sales past 5Y'])
        obj['Sales Q/Q_val'] = self.convert_percent_string(obj['Sales Q/Q'])
        obj['Insider Own_val'] = self.convert_percent_string(obj['Insider Own'])
        obj['Insider Trans_val'] = self.convert_percent_string(obj['Insider Trans'])
        obj['Inst Own_val'] = self.convert_percent_string(obj['Inst Own'])
        obj['Inst Trans_val'] = self.convert_percent_string(obj['Inst Trans'])
        obj['Float Short_val'] = self.convert_percent_string(obj['Float Short'])
        obj['Float Short_val'] = self.convert_percent_string(obj['Float Short'])
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
        obj['Volatility W_val'] = self.convert_percent_string(obj['Volatility W'])
        obj['Volatility M_val'] = self.convert_percent_string(obj['Volatility M'])
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
        obj['Volume_val'] = int(re.sub(",", "", obj['Volume'])) #!!!!!
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

    def get_stocks(self, option=""):
        while not self.done:
            url='https://finviz.com/screener.ashx?v=151&o=ticker&c=0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69&r={}'.format(len(self.l)+1)
            if option:
                url = 'https://finviz.com/screener.ashx?v=151&f={}&o=ticker&c=0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69&r={}'.format(option, len(self.l)+1)
            self.create_stocks(url)
        return self.l
            

class S3Service:
    def put_optional_stocks(self, j):
        self.put_text_to_file(os.environ.get('select_bucket'), 'stocks_optional.json', self.convert_json_to_s3(j))
    
    def put_stocks(self, j):
        self.put_text_to_file(os.environ.get('select_bucket'), 'stocks.json', self.convert_json_to_s3(j))
    
    def put_text_to_file(self, bucket, key, text):
        s3 = boto3.resource('s3')
        object = s3.Object(bucket, key)
        object.put(Body=text)

    def convert_json_to_s3(self, j):
        s=json.dumps(j)
        return re.sub(r"\}\,\s+\{", "}\n{", s[1:-1])

if __name__ == "__main__":
    save_all_optionable('', '')