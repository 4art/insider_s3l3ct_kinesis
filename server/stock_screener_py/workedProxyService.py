from aiohttp import ClientSession
import logging
import nest_asyncio
import json
import asyncio
import random
import logging
import boto3
import re
import os

class LambdaService:
    def get_lambda_json_response(self, lmbd, content=b""):
        response = client.invoke(
                FunctionName=lmbd,
                InvocationType='RequestResponse',
                Payload=content
            )
        payload = response["Payload"].read()
        json_string = json.loads(payload)['body']
        return json.loads(json_string)

class S3Service:
    def put_optional_stocks(self, j):
        self.put_text_to_file(os.environ.get('select_bucket'), 'stocks_optional.json', self.convert_json_to_s3(j))
    
    def put_stocks(self, j):
        self.put_text_to_file(os.environ.get('select_bucket'), 'stocks.json', self.convert_json_to_s3(j))
    
    def put_worked_proxies(self, j):
        self.put_text_to_file(os.environ.get('select_bucket'), 'testedProxies.json', self.convert_json_to_s3(j))
    
    def put_text_to_file(self, bucket, key, text):
        s3 = boto3.resource('s3')
        object = s3.Object(bucket, key)
        object.put(Body=text)

    def convert_json_to_s3(self, j):
        s=json.dumps(j)
        return re.sub(r"\}\,\s+\{", "}\n{", s[1:-1])

nest_asyncio.apply()
loop = asyncio.get_event_loop()
lambdaService = LambdaService()
s3Service = S3Service()
client = boto3.client('lambda')

def uploadWorkedProxies(event, context):
    print("start")
    loop.run_until_complete(WorkedProxyService().uploadWorked())
    return '''
    {
        "status": "Successfully uploaded worked proxies"
    }
    '''

class WorkedProxyService:
    def __init__(self):
        self.proxies = self.get_proxies()
        self.workedProxies = []
        self.wrongProxiesCount = 0

    def get_proxies(self):
        print("get all proxies")
        proxies = lambdaService.get_lambda_json_response('insider-dev-get_all_proxies')
        return proxies
        #return list(map(lambda prx: "http://{}:{}".format(prx['host'], prx['port']), proxies))

    async def uploadWorked(self):
        print("start worked test")
        input_coroutines = list(
            map(lambda prx: asyncio.ensure_future(self.testProxy(prx)), self.proxies))
        await asyncio.gather(*input_coroutines, return_exceptions=False)
        print("Put worked proxies")
        s3Service.put_worked_proxies(self.workedProxies)
        print("preparing response")

    async def testProxy(self, proxy):
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36'}
        try:
            async with ClientSession() as session:
                async with session.get('https://demo-live-data.highcharts.com/aapl-c.json', headers=headers, proxy="http://{}:{}".format(proxy['host'], proxy['port'])) as response:
                    text = await response.read()
                    jsonstring = json.loads(text)
                    self.workedProxies.append(proxy)
                    print("Added proxy {}. worked: {}, wrong: {}, allCount: {}".format(proxy, len(self.workedProxies), self.wrongProxiesCount, len(self.proxies)))
        except:
            logging.debug("proxy {} is wrong".format(proxy))
            self.wrongProxiesCount += 1

if __name__ == "__main__":
    uploadWorkedProxies("", "")
