const csv = require('csvtojson')
const request = require('request')
const URL = 'https://portal.mvp.bafin.de/database/DealingsInfo/sucheForm.do?meldepflichtigerName=&zeitraum=0&d-4000784-e=1&emittentButton=Suche+Emittent&emittentName=&zeitraumVon=&emittentIsin=&6578706f7274=1&locale=en_GB&zeitraumBis=';
const converter = require('./converter')

exports.DE = async () => converter.convertKeysForS3Json(csv({ delimiter: ';' }).fromStream(request.get(URL)))
    