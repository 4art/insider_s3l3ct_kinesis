exports.convertArrToS3Json = (arr, str = "") => arr.forEach(v => str += JSON.stringify(v))
exports.convertKeysForS3Json = (promise) => promise.then(arr => arr.map(o => {
    Object.keys(o).forEach(old_key => {
        var new_key = old_key.replace(/\s/g, '_')
        if (old_key !== new_key) {
            Object.defineProperty(o, new_key,
                Object.getOwnPropertyDescriptor(o, old_key));
            delete o[old_key];
        }
    })
    return o
}

))