import React, {Component} from 'react';
import {
    Chart,
    HighchartsChart,
    Legend,
    AreaSeries,
    Subtitle,
    Title,
    withHighcharts,
    XAxis,
    YAxis
} from 'react-jsx-highcharts'
import Highcharts from 'highcharts';
import {getCompanyHistoricalChartPrices} from "../apiService";

const plotOptions = {
    series: {
        stacking: 'normal'
    }
};


class HistoricalStockChart extends Component {
    constructor(props) {
        super(props);

        this.state = {
            chartData: []
        };
    }

    async componentDidMount() {
        await this.loadChart();
    }

    async loadChart() {
        const chartData = await getCompanyHistoricalChartPrices(this.props.company.value)
        this.setState({...this.state, chartData: chartData}, () => console.log(this.state))
    }

    render() {
        return (
            <div>
                <div className="app">
                    <HighchartsChart plotOptions={plotOptions}>
                        <Chart/>

                        <Title>{this.props.company.label}</Title>

                        <Subtitle>{this.props.company.value}</Subtitle>

                        <XAxis id="myXaxis" type="datetime">
                        </XAxis>

                        <YAxis>
                            <YAxis.Title>Price</YAxis.Title>
                            <AreaSeries color="#000000" name={this.props.company.label}
                                        data={this.state.chartData}/>
                        </YAxis>
                    </HighchartsChart>
                </div>
            </div>
        )
    }
}

export default withHighcharts(HistoricalStockChart, Highcharts);
