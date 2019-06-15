'use strict';

const
  AWS = require('aws-sdk'),
  firehose = new AWS.Firehose();

exports.putToStream = (stream, obj) =>
  firehose.putRecord({
    DeliveryStreamName: stream,
    Record: {
      Data: JSON.stringify(obj)
    }
  }).promise();

exports.putToStreamBatch = (stream, arr = []) =>
  firehose.putRecordBatch({
    DeliveryStreamName: stream,
    Records: arr.map(v => ({ Data: JSON.stringify(v) }))
  }).promise();
