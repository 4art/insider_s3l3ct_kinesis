import React, { Component } from 'react';
import {Grid, withStyles} from "@material-ui/core";
const styles = theme => ({
    root: {
        ...theme.typography.button,
        backgroundColor: theme.palette.common.white,
        padding: theme.spacing.unit,
    },
});
class Contact extends Component {

    render(){
        return <Grid
                container
                spacing={0}
                direction="column"
                alignItems="center"
                style={{ minHeight: '100vh' }}>

                <Grid item xs={3}>
                    <h1 className={this.props.classes.root}>Some contact page</h1>
                </Grid>

            </Grid>
    }
}

export default withStyles(styles)(Contact)
