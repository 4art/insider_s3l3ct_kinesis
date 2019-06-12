'use strict';

const
  AWS = require('aws-sdk'),
  firehose = new AWS.Firehose();

exports.putToStream = (stream, obj) => {
  var params = {
    DeliveryStreamName: stream,
    Record: {
      Data: JSON.stringify(obj)
    }
  };
  return new Promise((res, rej) => {
    firehose.putRecord(params, function (err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
        rej(err)
      }
      else {
        console.log(data);
        res(data)
      }
    });
  })
}
exports.putToStreamBatch = (stream, arr = []) => {
  var params = {
    DeliveryStreamName: stream,
    Records: arr.map(v => ({Data: JSON.stringify(v)}))
  };
  return new Promise((res, rej) => {
    firehose.putRecordBatch(params, function (err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
        rej(err)
      }
      else {
        console.log(data);
        res(data)
      }
    });
  })
}
