import React, {Component} from '../../node_modules/react';
import {withStyles} from '../../node_modules/@material-ui/core';
import Paper from '@material-ui/core/Paper'
import makeAnimated from 'react-select/animated';
import Select from 'react-select';
import DeleteIcon from '@material-ui/icons/Delete';
import {getCompaniesDE, getTradesDE} from "../apiService";
import MUIDataTable from "mui-datatables";
import RingLoader from 'react-spinners/RingLoader';
import {
    bafinMoneyToObject,
    bafinStringDate,
    convertDateToString,
    convertFloatToPrice,
    tableKeyToSqlKey
} from "./converter";

const styles = theme => ({
    root: {
        margin: 'auto',
        width: '80%',
        height: '100%',
        paddingTop: theme.spacing(2),
        align: 'center',
        overflowX: 'auto',
    },
    paper: {
        margin: 'auto',
        width: '90%',
        overflowX: 'auto',
        marginBottom: theme.spacing(2),
    },
    table: {
        margin: 'auto',
        maxWidth: 10
    },
    typography: {
        margin: "10px",
        textAlign: 'center'
    },
    selectSearchDiv: {
        margin: 'auto',
        textAlign: 'center',
        paddingTop: 20
    },
    selectSearch: {
        width: 300,
        textAlign: 'center',
        margin: 'auto',
        display: 'inline-block',
        paddingRight: 10
    },
    removeIcon: {
        cursor: 'pointer'
    }
});

class Trades extends Component {
    constructor() {
        super();
        this.state = {
            trades: [],
            companies: [],
            currentCompany: {
                value: null,
                label: null
            },
            tradesLimit: 5000,
            tradesLoading: false,
            tradesTableData: {
                columns: [],
                data: []
            }
        }
    }

    async componentDidMount() {
        this.updateTrades();
        this.updateCompanies();

    }

    async updateCompanies() {
        let companiesDePromise = getCompaniesDE();
        const companies = await companiesDePromise;
        this.setState({...this.state, companies: companies});
        return companies;
    }

    async updateTrades() {
        this.setState({...this.state, tradesLoading: true})
        let tradesDePromise = getTradesDE(this.state.tradesLimit, this.state.currentCompany.value);
        const trades = await tradesDePromise;
        this.setState({
            ...this.state,
            trades: trades,
            tradesLoading: false,
            tradesTableData: this.getTradesTableData(trades)
        })
    }

    currentCompanyOnChange(v) {
        this.setState({...this.state, currentCompany: v}, this.updateTrades)
    }

    isCompanyChosed() {
        return this.state.currentCompany.value != null
    }

    removeCurrentCompany() {
        this.setState({
            ...this.state, currentCompany: {
                value: null,
                label: null
            }
        }, this.updateTrades)
    }

    getTradesTable() {
        const {classes} = this.props;
        const options = {
            filterType: "dropdown",
            responsive: 'stacked',
            customSort: (data, colIndex, order) => {
                const columnsFormats = {
                    "Aggregated_volume": "float",
                    "Averrage_price": "float",
                    "Date_of_transaction": "date",

                };
                if (typeof this.state.tradesTableData.columns[colIndex] !== "undefined") {
                    if (columnsFormats[tableKeyToSqlKey(this.state.tradesTableData.columns[colIndex])] === "float") {
                        return data.sort((a, b) => {
                            return (bafinMoneyToObject(a.data[colIndex]).value < bafinMoneyToObject(b.data[colIndex]).value ? -1: 1 ) * (order === 'desc' ? 1 : -1);
                        })
                    }
                    if (columnsFormats[tableKeyToSqlKey(this.state.tradesTableData.columns[colIndex])] === "date") {
                        return data.sort((a, b) => {
                            return (bafinStringDate(a.data[colIndex]).getTime() < bafinStringDate(b.data[colIndex]).getTime() ? -1: 1 ) * (order === 'desc' ? 1 : -1);
                        })
                    }
                }
                return data.sort((a, b) => {
                    return (a.data[colIndex].toLowerCase() < b.data[colIndex].toLowerCase() ? -1: 1 ) * (order === 'desc' ? 1 : -1);
                });
            }
        };

        let table = <MUIDataTable
            title="Last trades"
            data={this.state.tradesTableData.data}
            columns={this.state.tradesTableData.columns}
            options={options}
        />;
        return <div className={classes.root}>
            <RingLoader
                sizeUnit={"px"}
                size={130}
                color={'black'}
                loading={this.state.tradesLoading}
                css={{margin: 'auto'}}/>
            {!this.state.tradesLoading ? table : <><br/><br/><br/><br/></>}
        </div>
    }

    getTradesTableData(trades) {
        return {
            columns: !this.isCompanyChosed() ? ['ISIN', 'Company', 'Issuer', 'Position', 'Instrument', 'Typ', 'Volume', 'Price', 'Date'] : ['Issuer', 'Position', 'Instrument', 'Typ', 'Volume', 'Price', 'Date'],
            data: trades.map(v => !this.isCompanyChosed() ?
                [v.ISIN, v.Issuer, v["Parties_subject_to_the_notification_requirement"], v["Position_/_status"], v["Typ_of_instrument"], v["Nature_of_transaction"], convertFloatToPrice(v["Aggregated_volume"], v.currency), convertFloatToPrice(v["Averrage_price"], v.currency), convertDateToString(v["Date_of_transaction"])]
                : [v["Parties_subject_to_the_notification_requirement"], v["Position_/_status"], v["Typ_of_instrument"], v["Nature_of_transaction"], convertFloatToPrice(v["Aggregated_volume"], v.currency), convertFloatToPrice(v["Averrage_price"], v.currency), convertDateToString(v["Date_of_transaction"])]
            )
        }
    }

    render() {
        const {classes} = this.props;
        return <Paper className={classes.paper}>
            <div className={classes.selectSearchDiv}>
                <Select
                    className={classes.selectSearch}
                    closeMenuOnSelect={true}
                    value={this.state.currentCompany}
                    components={makeAnimated}
                    onChange={this.currentCompanyOnChange.bind(this)}
                    options={this.state.companies.map(v => ({value: v.ISIN, label: v.Issuer}))}
                    theme={(theme) => ({
                        ...theme,
                        borderRadius: 0,
                        colors: {
                            ...theme.colors,
                            primary25: 'gray',
                            primary: 'black',
                        },
                    })
                    }
                />
                <DeleteIcon onClick={this.removeCurrentCompany.bind(this)}/>
            </div>
            {this.getTradesTable()}
        </Paper>
    }
}

export default withStyles(styles)(Trades)
