import json

class AWS_CRED:
    def __init__(self):
        self.aws_access_key_id = ""
        self.aws_secret_access_key = ""
        self.region_name = ""
        self.select_bucket = ""
        self.create_cred()

    
    def create_cred(self):
        with open('aws_cred.json') as json_file:
            cred = json.load(json_file)
            self.aws_access_key_id = cred["aws_access_key_id"]
            self.aws_secret_access_key = cred["aws_secret_access_key"]
            self.region_name = cred["region_name"]
            self.select_bucket = cred["select_bucket"]
