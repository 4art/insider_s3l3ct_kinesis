var assert = require('assert');
const converter = require('./service/converter')


describe('converter', function () {

    it('bafinMoneyToObject', function () {
        const strVal = "6.218.640,02 CAD";
        const floatVal = 6218640.02;
        const currency = "CAD"
        let object = converter.bafinMoneyToObject(strVal);
        assert(object.value === floatVal)
        assert(object.currency === currency)
    });

    it('bafinStringDate', function () {
        const strDate = "26/06/2019";
        const strDateTime = "03/07/2019 15:39:36";
        let date = converter.bafinStringDate(strDate);
        assert(date.getTime() === new Date(2019, 5, 26).getTime())
        let dateTime = converter.bafinStringDate(strDateTime);
        console.log(dateTime)
        assert(dateTime.getTime() === new Date(2019, 6, 3, 15, 39, 36).getTime(), "same time")
    });
});
