import bigDecimal from 'js-big-decimal'
import moment from 'moment'

const convertFloatToPrice = (float, currency) => typeof float === "number" ? `${bigDecimal.getPrettyValue(float)} ${currency}` : float;

const convertDateToString = date => {
    let dateStr = moment(date).format('DD/MM/YYYY');
    if (dateStr !== "Invalid date") {
        return dateStr
    }
    console.log("date: ", date)
};

const tableKeyToSqlKey = key => {
    switch (key) {
        case 'Company':
            return 'Issuer';
        case 'Issuer':
            return 'Parties_subject_to_the_notification_requirement';
        case 'Position':
            return 'Position_/_status';
        case 'Instrument':
            return 'Typ_of_instrument';
        case 'Typ':
            return 'Nature_of_transaction';
        case 'Volume':
            return 'Aggregated_volume';
        case 'Price':
            return 'Averrage_price';
        case 'Date':
            return 'Date_of_transaction';
        default:
            return key
    }
};

const bafinMoneyToObject = moneyString => {
    if (!moneyString) return {value: 0, currency: ""}
    const preparedString = moneyString.replace(/[,]/g, "")
    return {
        value: parseFloat(preparedString),
        currency: preparedString.substr(preparedString.length - 3)
    }
};

const bafinStringDate = stringDate => {
    if (stringDate.match(/(0[1-9]|[1-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/[0-9]{4} (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]/)) {
        const [day, month, yearTime] = stringDate.split("/");
        let split = yearTime.split(" ");
        const year = split[0];
        const [hours, minutes, seconds] = split[1].split(":");
        return new Date(year, month - 1, day, hours, minutes, seconds)
    }
    if (stringDate.match(/(0[1-9]|[1-2][0-9]|3[0-1])\/(0[1-9]|1[0-2])\/[0-9]{4}/)) {
        const [day, month, year] = stringDate.split("/");
        return new Date(year, month - 1, day)
    }
    return new Error("Can't parse string date")
};

export {convertFloatToPrice}
export {convertDateToString}
export {tableKeyToSqlKey}
export {bafinMoneyToObject}
export {bafinStringDate}

