import React, {Component} from 'react';
import {
    AreaSeries,
    BubbleSeries,
    Chart,
    HighchartsStockChart,
    Subtitle,
    Title,
    Tooltip,
    withHighcharts,
    XAxis,
    YAxis
} from 'react-jsx-highstock'
import Highcharts from 'highcharts/highstock';
import {getCompanyHistoricalChartPrices} from "../apiService";
import {convertCurrentTradesToTooltip, findClosestTradeDate, getTradesChartData} from "./converter";
import addHighchartsMore from "highcharts/highcharts-more"

const plotOptions = {
    bubble: {
        minSize: 14,
        maxSize: 14
    }
};


class HistoricalStockChart extends Component {
    constructor(props) {
        super(props);

        this.state = {
            chartData: {
                prices: [],
                trades: {
                    buy: [],
                    sell: [],
                    other: [],
                }
            }
        };
    }

    async componentDidMount() {
        this.props.onRef(this)
        console.log("highstock did mount");
        await this.loadChart();
    }

    componentWillUnmount() {
        this.props.onRef(undefined)
    }

    async loadChart() {
        const companyHistoricalChartPricesPromise = getCompanyHistoricalChartPrices(this.props.company.value);
        const tradesChartData = getTradesChartData(this.props.trades, this.props.company.value);
        const chartData = await companyHistoricalChartPricesPromise;
        this.setState({
            ...this.state, chartData: {
                prices: chartData,
                trades: tradesChartData
            }
        }, () => console.log(this.state, this.props.trades))
    }

    render() {
        const self = this;
        const formatToolTip = function () {
            let trades = JSON.parse(JSON.stringify(self.props.trades));
            if (this.series.name === "buy") {
                let companyTrades = trades.filter(v => v["Nature_of_transaction"].includes("Buy") && v.ISIN === self.props.company.value);
                let closestTradeDate = findClosestTradeDate(companyTrades, this.x);
                let currentTrades = companyTrades.filter(v => v["Date_of_transaction"] === closestTradeDate);
                return convertCurrentTradesToTooltip(currentTrades, "Buy", this.color)
            }
            else if (this.series.name === "sell") {
                let companyTrades = trades.filter(v => v["Nature_of_transaction"].includes("Sell") && v.ISIN === self.props.company.value);
                let closestTradeDate = findClosestTradeDate(companyTrades, this.x);
                let currentTrades = companyTrades.filter(v => v["Date_of_transaction"] === closestTradeDate);
                return convertCurrentTradesToTooltip(currentTrades, "Sell", this.color)
            }
            else if (this.series.name === "other") {
                let companyTrades = trades.filter(v => v["Nature_of_transaction"].includes("Other") && v.ISIN === self.props.company.value);
                let closestTradeDate = findClosestTradeDate(companyTrades, this.x);
                let currentTrades = companyTrades.filter(v => v["Date_of_transaction"] === closestTradeDate);
                return convertCurrentTradesToTooltip(currentTrades, "Other", this.color)
            }


        };

        return (
            <div>
                <div className="app">
                    <HighchartsStockChart plotOptions={plotOptions}>
                        <Chart/>

                        <Title>{this.props.company.label}</Title>

                        <Subtitle>{this.props.company.value}</Subtitle>
                        <Tooltip padding={10} hideDelay={250} shape="square" formatter={formatToolTip}/>

                        <XAxis id="myXaxis" type="datetime">
                        </XAxis>

                        <YAxis>
                            <YAxis.Title>Price</YAxis.Title>
                            <AreaSeries color="#000000" name={this.props.company.label}
                                        data={this.state.chartData.prices}/>
                            <BubbleSeries marker={{
                                symbol: "triangle",
                                fillColor: "#339",
                                lineColor: "#339"
                            }} name="buy" data={this.state.chartData.trades.buy}/>
                            <BubbleSeries marker={{
                                symbol: "triangle-down",
                                fillColor: "#c00",
                                lineColor: "#c00"
                            }} name="sell" data={this.state.chartData.trades.sell}/>
                            <BubbleSeries marker={{
                                symbol: "diamond",
                                fillColor: "#86592d",
                                lineColor: "#86592d"
                            }} name="other" data={this.state.chartData.trades.other}/>
                        </YAxis>
                    </HighchartsStockChart>
                </div>
            </div>
        )
    }
}

addHighchartsMore(Highcharts);
export default withHighcharts(HistoricalStockChart, Highcharts);
