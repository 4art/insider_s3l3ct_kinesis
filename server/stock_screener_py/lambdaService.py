import boto3
import json

client = boto3.client('lambda')

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
