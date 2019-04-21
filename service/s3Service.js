'use strict';

const
    AWS = require('aws-sdk'),
    S3 = new AWS.S3();

exports.upload = (body, key, bucket) => {
    console.log(`FUNCTION STARTED: ${new Date()}`);
    return S3.putObject({
        Bucket: bucket,
        Key: key,
        Body: body
    }).promise()
};