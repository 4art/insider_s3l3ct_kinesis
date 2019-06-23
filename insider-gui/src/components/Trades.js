import React, { Component } from '../../node_modules/react';
import { Grid, withStyles } from '../../node_modules/@material-ui/core';

const styles = theme => ({
    root: {
        ...theme.typography.button,
        backgroundColor: theme.palette.common.white,
        padding: theme.spacing.unit,
    },
});

class Trades extends Component {

    render(){
        return <Grid
            container
            spacing={0}
            direction="column"
            alignItems="center"
            style={{ minHeight: '100vh' }}>

            <Grid item xs={3}>
                <h1 className={this.props.classes.root}>Trades</h1>
            </Grid>

        </Grid>
    }
}

export default withStyles(styles)(Trades)
