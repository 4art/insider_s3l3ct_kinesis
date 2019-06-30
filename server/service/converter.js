const request = require('request');
const isCSV = require('detect-csv');
const underscore = require('underscore');

exports.convertArrToS3Json = (arr, str = "") => {
    arr.forEach(v => str += JSON.stringify(v));
    return str
};
exports.convertKeysForS3Json = (promise) => promise.then(arr => arr.map(o => {
        Object.keys(o).forEach(old_key => {
            var new_key = old_key.replace(/\s/g, '_');
            if (old_key !== new_key) {
                Object.defineProperty(o, new_key,
                    Object.getOwnPropertyDescriptor(o, old_key));
                delete o[old_key];
            }
        });
        return o
    }
));

exports.removeDuplicates = (myArr, prop) => myArr.filter((obj, pos, arr) => arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos);

exports.isScvValidUrl = URL => new Promise((res, rej) => {
    request(URL, null, (err, data) => {
        if (err) rej(err);
        res(isCSV(data.body) != null)
    })
});

exports.getDiffFromTwoArr = (oldArr = [], newArr = []) => oldArr.length === newArr.length ? [] : newArr.filter(v => underscore.isUndefined(oldArr.find(o => underscore.isEqual(v, o))));

exports.bafinMoneyToObject = moneyString => {
    const preparedString = moneyString.replace(/\./g, "").replace(",", ".");
    return {
        value: parseFloat(preparedString),
        currency: preparedString.substr(preparedString.length - 3)
    }
};

exports.bafinStringDate = stringDate => {
    if(stringDate.match(/(0[1-9]|[1-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/[0-9]{4} (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]/)){
        const [day, month, yearTime] = stringDate.split("/");
        let split = yearTime.split(" ");
        const year = split[0];
        const [hours, minutes, seconds] = split[1].split(":");
        return new Date(year, month - 1, day, hours, minutes, seconds)
    }
    if(stringDate.match(/(0[1-9]|[1-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/[0-9]{4}/)) {
        const [day, month, year] = stringDate.split("/");
        return new Date(year, month - 1, day)
    }
    return new Error("Can't parse string date")
};
