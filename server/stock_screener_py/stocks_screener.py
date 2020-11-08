import re
import boto3
import os
import time
import json
import requests
import logging
from datetime import datetime
import pandas as pd 
from aws_cred import AWS_CRED
from pandas import DataFrame
from bs4 import BeautifulSoup

AWS_CRED = AWS_CRED()


lamb = boto3.client('lambda', aws_access_key_id=AWS_CRED.aws_access_key_id,
                    aws_secret_access_key=AWS_CRED.aws_secret_access_key, region_name=AWS_CRED.region_name)
athena = boto3.client('athena', aws_access_key_id=AWS_CRED.aws_access_key_id,
                    aws_secret_access_key=AWS_CRED.aws_secret_access_key, region_name=AWS_CRED.region_name)
athenaOutput = "s3://{}/stocks_output".format(AWS_CRED.select_bucket)



def get_lambda_json_response(lmbd):
    response = lamb.invoke(
        FunctionName=lmbd,
        InvocationType='RequestResponse'
    )
    payload = response["Payload"].read()
    json_string = json.loads(payload)['body']
    return json.loads(json_string)


def save_all_optionable(event, context):
    print("start")
    logging.info("start logging")
    stocks = Stock_screener().get_stocks("sh_opt_option")
    df = DataFrame(stocks)
    df = df.rename(columns={"No.": "no", "Ticker": "ticker", "Company": "company", "Sector": "sector",
                       "Industry": "industry", "Country": "country", "Market Cap": "market_cap", 
                       "P/E": "p_e", "Fwd P/E": "fwd_p_e", "PEG": "peg", "P/S": "p_s", "P/B": "p_b", 
                       "P/C": "p_c", "P/FCF": "p_fcf", "Dividend": "dividend__pers", "Payout Ratio": "payout_ratio__pers", 
                       "EPS": "eps__pers", "EPS next Y": "eps_this_y__pers", "EPS past 5Y": "eps_past_5y__pers", 
                       "EPS next 5Y": "eps_next_5y__pers", "Sales past 5Y": "sales_past_5y__pers", "EPS Q/Q": "eps_q_q__pers", 
                       "Sales Q/Q": "sales_q_q__pers", "Outstanding": "outstanding", "Float": "float", 
                       "Insider Own": "insider_own__pers", "Insider Trans": "insider_trans__pers", "Inst Own": "inst_own__pers", 
                       "Float Short": "float_short__pers", "Short Ratio": "short_ratio", "ROA": "roa__pers",
                       "ROE": "roe__pers", "ROI": "roi__pers", "Curr R": "curr_r", "Quick R": "quick_r",
                       "LTDebt/Eq": "ltDebt_eq", "Gross M": "gross_m__pers", "Oper M": "oper_m__pers",
                       "Profit M": "profit_m__beta", "Perf Week": "perf_week__beta", "Perf Month": "perf_month__beta",
                       "Perf Quart": "perf_quart__beta", "Perf Half": "perf_half__beta", "Perf Year": "perf_year__beta",
                       "Perf YTD": "perf_ytd__pers", "Beta": "beta", "ATR": "atr", "Volatility W": "volatility_w__pers",
                       "Volatility M": "volatility_m__pers", "SMA20": "sma20__pers", "SMA50": "sma50__pers", "SMA200": "sma200__pers",
                       "50D High": "50d_high__pers", "50D Low": "50d_low__pers", "52W High": "52w_high__pers", "52W Low": "52w_low__pers",
                       "RSI": "rsi", "from Open": "from_open__pers", "Gap": "gap__pers", "Recom": "recom",
                       "Avg Volume": "avg_volume", "Rel Volume": "rel_volume", "Price": "price",
                       "Change": "change__pers", "Volume": "volume", "Earnings": "earnings", "Target Price": "target_price"}).replace(to_replace='%', value='', regex=False)
    df['p_e'] = pd.to_numeric(df['p_e'], errors='coerce').astype(float).fillna(0.0)
    df['fwd_p_e'] = pd.to_numeric(df['fwd_p_e'], errors='coerce').astype(float).fillna(0.0)
    df['peg'] = pd.to_numeric(df['peg'], errors='coerce').astype(float).fillna(0.0)
    df['p_s'] = pd.to_numeric(df['p_s'], errors='coerce').astype(float).fillna(0.0)
    df['p_b'] = pd.to_numeric(df['p_b'], errors='coerce').astype(float).fillna(0.0)
    df['p_c'] = pd.to_numeric(df['p_c'], errors='coerce').astype(float).fillna(0.0)
    df['p_fcf'] = pd.to_numeric(df['p_fcf'], errors='coerce').astype(float).fillna(0.0)
    df['dividend__pers'] = pd.to_numeric(df['dividend__pers'], errors='coerce').astype(float).fillna(0.0)
    df['payout_ratio__pers'] = pd.to_numeric(df['payout_ratio__pers'], errors='coerce').astype(float).fillna(0.0)
    df['eps__pers'] = pd.to_numeric(df['eps__pers'], errors='coerce').astype(float).fillna(0.0)
    df['eps_this_y__pers'] = pd.to_numeric(df['eps_this_y__pers'], errors='coerce').astype(float).fillna(0.0)
    df['eps_past_5y__pers'] = pd.to_numeric(df['eps_past_5y__pers'], errors='coerce').astype(float).fillna(0.0)
    df['eps_next_5y__pers'] = pd.to_numeric(df['eps_next_5y__pers'], errors='coerce').astype(float).fillna(0.0)
    df['sales_past_5y__pers'] = pd.to_numeric(df['sales_past_5y__pers'], errors='coerce').astype(float).fillna(0.0)
    df['eps_q_q__pers'] = pd.to_numeric(df['eps_q_q__pers'], errors='coerce').astype(float).fillna(0.0)
    df['sales_q_q__pers'] = pd.to_numeric(df['sales_q_q__pers'], errors='coerce').astype(float).fillna(0.0)
    df['insider_own__pers'] = pd.to_numeric(df['insider_own__pers'], errors='coerce').astype(float).fillna(0.0)
    df['insider_trans__pers'] = pd.to_numeric(df['insider_trans__pers'], errors='coerce').astype(float).fillna(0.0)
    df['inst_own__pers'] = pd.to_numeric(df['inst_own__pers'], errors='coerce').astype(float).fillna(0.0)
    df['float_short__pers'] = pd.to_numeric(df['float_short__pers'], errors='coerce').astype(float).fillna(0.0)
    df['short_ratio'] = pd.to_numeric(df['short_ratio'], errors='coerce').astype(float).fillna(0.0)
    df['roa__pers'] = pd.to_numeric(df['roa__pers'], errors='coerce').astype(float).fillna(0.0)
    df['roe__pers'] = pd.to_numeric(df['roe__pers'], errors='coerce').astype(float).fillna(0.0)
    df['roi__pers'] = pd.to_numeric(df['roi__pers'], errors='coerce').astype(float).fillna(0.0)
    df['curr_r'] = pd.to_numeric(df['curr_r'], errors='coerce').astype(float).fillna(0.0)
    df['quick_r'] = pd.to_numeric(df['quick_r'], errors='coerce').astype(float).fillna(0.0)
    df['ltDebt_eq'] = pd.to_numeric(df['ltDebt_eq'], errors='coerce').astype(float).fillna(0.0)
    df['gross_m__pers'] = pd.to_numeric(df['gross_m__pers'], errors='coerce').astype(float).fillna(0.0)
    df['oper_m__pers'] = pd.to_numeric(df['oper_m__pers'], errors='coerce').astype(float).fillna(0.0)
    df['profit_m__beta'] = pd.to_numeric(df['profit_m__beta'], errors='coerce').astype(float).fillna(0.0)
    df['perf_week__beta'] = pd.to_numeric(df['perf_week__beta'], errors='coerce').astype(float).fillna(0.0)
    df['perf_month__beta'] = pd.to_numeric(df['perf_month__beta'], errors='coerce').astype(float).fillna(0.0)
    df['perf_quart__beta'] = pd.to_numeric(df['perf_quart__beta'], errors='coerce').astype(float).fillna(0.0)
    df['perf_half__beta'] = pd.to_numeric(df['perf_half__beta'], errors='coerce').astype(float).fillna(0.0)
    df['perf_year__beta'] = pd.to_numeric(df['perf_year__beta'], errors='coerce').astype(float).fillna(0.0)
    df['perf_ytd__pers'] = pd.to_numeric(df['perf_ytd__pers'], errors='coerce').astype(float).fillna(0.0)
    df['beta'] = pd.to_numeric(df['beta'], errors='coerce').astype(float).fillna(0.0)
    df['atr'] = pd.to_numeric(df['atr'], errors='coerce').astype(float).fillna(0.0)
    df['volatility_w__pers'] = pd.to_numeric(df['volatility_w__pers'], errors='coerce').astype(float).fillna(0.0)
    df['volatility_m__pers'] = pd.to_numeric(df['volatility_m__pers'], errors='coerce').astype(float).fillna(0.0)
    df['sma20__pers'] = pd.to_numeric(df['sma20__pers'], errors='coerce').astype(float).fillna(0.0)
    df['sma50__pers'] = pd.to_numeric(df['sma50__pers'], errors='coerce').astype(float).fillna(0.0)
    df['sma200__pers'] = pd.to_numeric(df['sma200__pers'], errors='coerce').astype(float).fillna(0.0)
    df['50d_high__pers'] = pd.to_numeric(df['50d_high__pers'], errors='coerce').astype(float).fillna(0.0)
    df['50d_low__pers'] = pd.to_numeric(df['50d_low__pers'], errors='coerce').astype(float).fillna(0.0)
    df['52w_high__pers'] = pd.to_numeric(df['52w_high__pers'], errors='coerce').astype(float).fillna(0.0)
    df['52w_low__pers'] = pd.to_numeric(df['52w_low__pers'], errors='coerce').astype(float).fillna(0.0)
    df['rsi'] = pd.to_numeric(df['rsi'], errors='coerce').astype(float).fillna(0.0)
    df['from_open__pers'] = pd.to_numeric(df['from_open__pers'], errors='coerce').astype(float).fillna(0.0)
    df['gap__pers'] = pd.to_numeric(df['gap__pers'], errors='coerce').astype(float).fillna(0.0)
    df['recom'] = pd.to_numeric(df['recom'], errors='coerce').astype(float).fillna(0.0)
    df['rel_volume'] = pd.to_numeric(df['rel_volume'], errors='coerce').astype(float).fillna(0.0)
    df['price'] = pd.to_numeric(df['price'], errors='coerce').astype(float).fillna(0.0)
    df['change__pers'] = pd.to_numeric(df['change__pers'], errors='coerce').astype(float).fillna(0.0)
    df['target_price'] = pd.to_numeric(df['target_price'], errors='coerce').astype(float).fillna(0.0)
    
    write_dataframe_to_parquet_on_s3(df)
    return '''
    {
        "status": "Successfully uploaded optional stocks"
    }
    '''

def write_dataframe_to_parquet_on_s3(dataframe):
    """ Write a dataframe to a Parquet on S3 """
    print("write dataframe into s3 last price")
    dataframe.to_parquet("s3://stocks_optional.parquet")
    print("creating athena query")
    dt = datetime.utcnow()
    output_file = "s3://{}/stocks/year={}/month={}/day={}/hour={}/stocks{}.parquet".format(
        AWS_CRED.select_bucket,
        dt.year,
        dt.month,
        dt.day,
        dt.hour,
        dt.strftime("%Y%m%d%H%M%S%f"))
    query = "ALTER TABLE {}.{} ADD PARTITION (dt = '{}', year = '{}', month = '{}', day = '{}', hour = '{}') LOCATION '{}';".format(
        os.environ.get("athenaDB"), 
        os.environ.get("stocksGlueTable"), 
        dt.strftime("%Y-%m-%d"),
        dt.year,
        dt.month,
        dt.day,
        dt.hour,
        output_file)
    print("writing dataframe with partitioning")
    dataframe.to_parquet(output_file)
    print("run athena query {}".format(query))
    run_athena_query(query)

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
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
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
            print("founded '{}' Ticker".format(conv_obj["Ticker"]))
            duplicates = list(
                filter(lambda v: v["Ticker"] == conv_obj["Ticker"], self.l))
            if duplicates:
                self.done = True
                return
            self.l.append(conv_obj)

    def convert_data_types(self, obj):
        obj['market_cap_val'] = self.convert_big_value(obj['Market Cap'])
        obj['avg_volume_val'] = self.convert_big_value(obj['Avg Volume'])
        obj['outstanding_val'] = self.convert_big_value(obj['Outstanding'])
        obj['float_val'] = self.convert_big_value(obj['Float'])
        obj['volume_val'] = int(re.sub(",", "", re.sub("-", "", obj['Volume']))) if re.sub(",", "", re.sub("-", "", obj['Volume'])) != '' else 0
        obj['avg_volume_val'] = self.convert_big_value(re.sub(",", "", obj['Avg Volume']))
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
            url = 'https://finviz.com/screener.ashx?v=151&o=ticker&c=0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69&r={}'.format(
                len(self.l)+1)
            if option:
                url = 'https://finviz.com/screener.ashx?v=151&f={}&o=ticker&c=0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69&r={}'.format(
                    option, len(self.l)+1)
            self.create_stocks(url)
        return self.l

def run_athena_query(query):
    # Execution
    response = athena.start_query_execution(
        QueryString=query,
        QueryExecutionContext={
            'Database': os.environ.get("athenaDB")
        },
        ResultConfiguration={
            'OutputLocation': athenaOutput,
        }
    )
    return response

class S3Service:
    def put_optional_stocks(self, j):
        print("trying to put stocks into S3")
        self.put_text_to_file(AWS_CRED.select_bucket, 'stocks_optional.json',
                              self.convert_json_to_s3(j))

    def put_stocks(self, j):
        self.put_text_to_file(AWS_CRED.select_bucket, 'stocks.json',
                              self.convert_json_to_s3(j))

    def put_text_to_file(self, bucket, key, text):
        s3 = boto3.resource('s3', aws_access_key_id=AWS_CRED.aws_access_key_id,
                            aws_secret_access_key=AWS_CRED.aws_secret_access_key, region_name=AWS_CRED.region_name)
        #s3 = boto3.resource('s3')
        object = s3.Object(bucket, key)
        object.put(Body=text)

    def convert_json_to_s3(self, j):
        s = json.dumps(j)
        return re.sub(r"\}\,\s+\{", "}\n{", s[1:-1])


if __name__ == "__main__":
    save_all_optionable('', '')
