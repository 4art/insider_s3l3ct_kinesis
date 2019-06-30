var assert = require('assert');
const converter = require('./service/converter')


describe( 'converter', function() {
 
    it( 'bafinMoneyToObject', function() {
        const strVal = "6.218.640,02 CAD";
        const floatVal = 6218640.02;
        const currency = "CAD"
        let object = converter.bafinMoneyToObject(strVal);
        assert(object.value, floatVal)
        assert(object.currency, currency)
    });

    it( 'bafinStringDate', function() {
        const strDate = "26/06/2019";
        const strDateTime = "26/06/2019 18:06:09";
        let date = converter.bafinStringDate(strDate);
        assert(date.getDate(), new Date(2019, 5, 26).getDate())
        let dateTime = converter.bafinStringDate(strDateTime);
        assert(dateTime.getDate(), new Date(2019, 5, 26, 18, 6, 9).getDate())
    });
});
