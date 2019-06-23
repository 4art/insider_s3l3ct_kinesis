'use strict'
const glueService = require('./service/glueService')
const CfnLambda = require('cfn-lambda');

//Clean up S3 bucket
var Delete = (requestPhysicalID, cfnRequestParams, reply) => {
    glueService.deleteDatabase(process.env.insiderDBGlue)
        .then(e => reply(null, requestPhysicalID))
        .catch(err => reply(err, requestPhysicalID))
};

// empty create
var Create = (cfnRequestParams, reply) => {
    glueService.createDatabase(process.env.insiderDBGlue)
        .then(e => reply(null, 'Success'))
        .catch(err => reply(err, 'Failed'))
};

var Update = (requestPhysicalID, cfnRequestParams, oldCfnRequestParams, reply) => {
    reply(null, requestPhysicalID);
};

exports.handler = CfnLambda({
    Create: Create,
    Update: Update,
    Delete: Delete
});
