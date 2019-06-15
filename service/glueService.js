'use strict';

const
    AWS = require('aws-sdk'),
    glue = new AWS.Glue();

exports.createDatabase = name =>
    glue.createDatabase({
        DatabaseInput: { Name: name }
    }).promise()

exports.deleteDatabase = name =>
    glue.deleteDatabase({
        Name: name
    }).promise()