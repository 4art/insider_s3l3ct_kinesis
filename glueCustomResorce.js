'use strict'
const CfnLambda = require('cfn-lambda');
const glueService = require('./service/glueService')

module.exports.handler = function (event, context, callback) {
    // Install watchdog timer as the first thing
    setupWatchdogTimer(event, context, callback)
    console.log('REQUEST RECEIVED:\n' + JSON.stringify(event))
    if (event.RequestType === 'Create') {
        console.log('CREATE!')
        glueService.createDatabase(process.env.insiderDBGlue).then(data => {
            console.log(data);
            return sendResponse(event, context, 'SUCCESS', { 'Message': 'Resource creation successful!' })
        }).catch(err => {
            console.error(err);
            return sendResponse(event, context, 'FAILED')
        })
    } else if (event.RequestType === 'Update') {
        console.log('UPDATE!')
        // Put your custom update logic here
        return sendResponse(event, context, 'SUCCESS', { 'Message': 'Resource update successful!' })
    } else if (event.RequestType === 'Delete') {
        console.log('DELETE!')
        glueService.deleteDatabase(process.env.insiderDBGlue).then(data => {
            console.log(data);
            return sendResponse(event, context, 'SUCCESS', { 'Message': 'Resource creation successful!' })
        }).catch(err => {
            console.error(err);
            return sendResponse(event, context, 'FAILED')
        })
    } else {
        console.log('FAILED!')
        return sendResponse(event, context, 'FAILED')
    }
}

function setupWatchdogTimer(event, context, callback) {
    const timeoutHandler = () => {
        console.log('Timeout FAILURE!')
        // Emit event to 'sendResponse', then callback with an error from this
        // function
        new Promise(() => sendResponse(event, context, 'FAILED'))
            .then(() => callback(new Error('Function timed out')))
    }

    // Set timer so it triggers one second before this function would timeout
    setTimeout(timeoutHandler, context.getRemainingTimeInMillis() - 1000)
}

// Send response to the pre-signed S3 URL
function sendResponse(event, context, responseStatus, responseData) {
    console.log('Sending response ' + responseStatus)
    var responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: 'See the details in CloudWatch Log Stream: ' + context.logStreamName,
        PhysicalResourceId: context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: responseData
    })

    console.log('RESPONSE BODY:\n', responseBody)

    var https = require('https')
    var url = require('url')

    var parsedUrl = url.parse(event.ResponseURL)
    var options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: 'PUT',
        headers: {
            'content-type': '',
            'content-length': responseBody.length
        }
    }

    console.log('SENDING RESPONSE...\n')

    var request = https.request(options, function (response) {
        console.log('STATUS: ' + response.statusCode)
        console.log('HEADERS: ' + JSON.stringify(response.headers))
        // Tell AWS Lambda that the function execution is done
        context.done()
    })

    request.on('error', function (error) {
        console.log('sendResponse Error:' + error)
        // Tell AWS Lambda that the function execution is done
        context.done()
    })

    // write data to request body
    request.write(responseBody)
    request.end()
}
