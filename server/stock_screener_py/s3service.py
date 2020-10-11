import os
import json
import boto3
import re

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