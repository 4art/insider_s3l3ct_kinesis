'use strict';

const
    AWS = require('aws-sdk'),
    S3 = new AWS.S3();
const helper = require('./converter');

exports.upload = (body, key, bucket) => {
    console.log(`FUNCTION STARTED: ${new Date()}`);
    return S3.putObject({
        Bucket: bucket,
        Key: key,
        Body: body
    }).promise()
};

exports.select = (bucket) => new TradesSelect(bucket);

function TradesSelect(bucket) {

    this.getLastTrades = (limit, isin = "") => {
        if(!limit || typeof limit === "undefined"){
            limit = 20
        }
        return select(bucket, 'trades.json', isin === ""
        ? `SELECT *
           FROM s3object s LIMIT ${parseInt(limit)}`
        : `SELECT * 
          FROM s3object s WHERE s.ISIN = '${isin}' LIMIT ${parseInt(limit)}`)
    };

    this.getAllCompanies = () => select(bucket, 'trades.json', 'SELECT s.Issuer, s.ISIN FROM s3object s').then(data => JSON.stringify(helper.removeDuplicates(JSON.parse(data), 'ISIN')));

    this.getInsiders = isin => select(bucket, "trades.json", `SELECT s.Issuer, s."BaFin-ID", s.ISIN, s."Parties_subject_to_the_notification_requirement", s."Position_/_status" FROM s3object s WHERE s.ISIN = '${isin}'`).then(data => JSON.stringify(helper.removeDuplicates(JSON.parse(data), 'Parties_subject_to_the_notification_requirement')))
}

const select = (bucket, key, query) => {
    const params = {
        Bucket: bucket,
        Expression: query,
        ExpressionType: 'SQL',
        Key: key,
        InputSerialization: {
            CompressionType: 'NONE',
            JSON: {
                Type: 'LINES'
            }
        },
        OutputSerialization: {
            JSON: {}
        }
    };
    console.log(`select function started ${new Date()} bucket: "${bucket}", key: "${key}", query: "${query}"`);

    return new Promise((res, rej) => {

        S3.selectObjectContent(params, function (err, data) {
            if(data == null){
                res('[]');
                return
            }
            const eventStream = data.Payload;

            if (err) {
                console.error(err, err.stack);
                rej(err)
            }
            let arr = [];

            // Read events as they are available
            eventStream.on('data', (event) => {
                if (event.Records) {
                    arr.push(event.Records.Payload.toString())

                } else if (event.Stats) {
                    console.log(`Processed ${event.Stats.Details.BytesProcessed} bytes`);
                } else if (event.End) {
                    console.log('SelectObjectContent completed');

                }
            });

            // Handle errors encountered during the API call
            eventStream.on('error', (err) => {
                console.error('error', err);
                res("[]")
            });

            eventStream.on('end', () => {
                console.log("finished event stream")
                let result = `[${arr.join('').replace(/\}\s+\{/g, '}, {')}]`;
                res(result)
            });

        });
    })
};
