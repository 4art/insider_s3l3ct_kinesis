exports.getLambdaResponse = bodyString => {
    try {
        return {
            statusCode: 200,
            body: bodyString,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
    };
    } catch (e) {
        return {
            statusCode: 500,
            body: e,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
        };
    }
};
