import React from '../../node_modules/react'
 import { Grid, withStyles } from '../../node_modules/@material-ui/core';
import PropTypes from '../../node_modules/prop-types';


const styles = theme => ({
    root: {
        ...theme.typography.button,
        backgroundColor: theme.palette.common.white,
        padding: theme.spacing(1),
    },
});

const Greeting = props => {
    return <Grid
        container
        spacing={0}
        direction="column"
        alignItems="center"
        style={{ minHeight: '100vh' }}>

        <Grid item xs={3}>
            <h1 className={props.classes.root}>Welcome</h1>
        </Grid>

    </Grid>

}

Greeting.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Greeting);
