exports.getLambdaResponse = bodyString => {
    try {
        return {
            statusCode: 200,
            body: bodyString
    };
    } catch (e) {
        return {
            statusCode: 500,
            body: e
        };
    }
};
