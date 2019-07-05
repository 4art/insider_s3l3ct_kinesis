import axios from 'axios';
import queryString from 'query-string';
const apiUrl = 'https://api.myinsiderposition.com';


const getTradesDE = async (limit, isin) => getAxiosData(`${apiUrl}/trades/de?${queryString.stringify({limit: limit, isin: isin})}`);

const getCompaniesDE = async () => getAxiosData(`${apiUrl}/companies/de`);

const getInsidersDE = async isin => getAxiosData(`${apiUrl}/insiders/de?${queryString.stringify({isin: isin})}`);

const getCompanyHistoricalChartPrices = isin => getAxiosData(`${apiUrl}/chart/historical`);

const getAxiosData = async url => axios.get(url).then(v => v.data);

export {getTradesDE}
export {getCompaniesDE}
export {getInsidersDE}
export {getCompanyHistoricalChartPrices}
