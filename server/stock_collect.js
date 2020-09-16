'use strict';
const HtmlTableToJson = require('html-table-to-json');
var JSSoup = require('jssoup').default;
const axios = require('axios').default

var getStocks = () => axios.get('https://finviz.com/screener.ashx?v=151&f=sh_opt_option&o=ticker&c=0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69&r=1').then(data => {
    var soup = new JSSoup(data.data);
    //tables = parser.parseFromString(tables).getElementsByTagName('table').innerHTML
    //tables = parser.parseFromString(tables).getElementsByTagName('table').innerHTML
    //let json1 = HtmlTableToJson.parse(tables).results;  
    return soup
})

getStocks().then(v => 
    console.log(v.data))
