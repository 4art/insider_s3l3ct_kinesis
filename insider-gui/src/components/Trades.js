import React, {Component} from '../../node_modules/react';
import {withStyles} from '../../node_modules/@material-ui/core';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper'
import makeAnimated from 'react-select/animated';
import Select from 'react-select';
import DeleteIcon from '@material-ui/icons/Delete';
import RingLoader from 'react-spinners/RingLoader';
import {getCompaniesDE, getTradesDE} from "../apiService";

const styles = theme => ({
    root: {
        margin: 'auto',
        width: '80%',
        paddingLeft: theme.spacing(10),
        paddingTop: theme.spacing(5),
        align: 'center',
        overflowX: 'auto',
    },
    paper: {
        margin: 'auto',
        width: '100%',
        overflowX: 'auto',
        marginBottom: theme.spacing(2),
    },
    table: {
        margin: 'auto',
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
            tradesLimit: 7,
            tradesLoading: false
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
        this.setState({...this.state, trades: trades, tradesLoading: false})
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
        const table = <Table size="small" padding="checkbox" className={classes.table}>
            <TableHead>
                <TableRow>
                    {!this.isCompanyChosed() ? <TableCell>ISIN</TableCell> : null}
                    {!this.isCompanyChosed() ? <TableCell align="right">Company</TableCell> : null}
                    {!this.isCompanyChosed() ? <TableCell align="right">Issuer</TableCell> :
                        <TableCell>Issuer</TableCell>}
                    <TableCell align="right">Position</TableCell>
                    <TableCell align="right">Instrument</TableCell>
                    <TableCell align="right">Typ</TableCell>
                    <TableCell align="right">Volume</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Date</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {this.state.trades.map((row, i) => (
                    <TableRow key={`trades_${i}`}>
                        {!this.isCompanyChosed() ? <TableCell>{row.ISIN}</TableCell> : null}
                        {!this.isCompanyChosed() ? <TableCell align="right">{row.Issuer}</TableCell> : null}
                        <TableCell
                            align={!this.isCompanyChosed() ? "right" : "left"}>{row["Parties_subject_to_the_notification_requirement"]}</TableCell>
                        <TableCell align="right">{row["Position_/_status"]}</TableCell>
                        <TableCell align="right">{row["Typ_of_instrument"]}</TableCell>
                        <TableCell align="right">{row["Nature_of_transaction"]}</TableCell>
                        <TableCell align="right">{row["Aggregated_volume"]}</TableCell>
                        <TableCell align="right">{row["Averrage_price"]}</TableCell>
                        <TableCell align="right">{row["Date_of_transaction"]}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
        return <div className={classes.root}>
            <RingLoader
                sizeUnit={"px"}
                size={130}
                color={'black'}
                loading={this.state.tradesLoading}
                css={{margin: 'auto'}}
            />
            {!this.state.tradesLoading ? table : <><br/><br/><br/><br/></>}

        </div>
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
