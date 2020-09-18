import boto3
import os

class S3Service:
    def put_optional_stocks(self, s):
        s3 = boto3.resource('s3')
        object = s3.Object(os.environ.get('select_bucket'), 'stocks_optional.json')
        object.put(Body=s)