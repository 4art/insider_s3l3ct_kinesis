import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import { Link, Menu, MenuItem } from '@material-ui/core';
import { Link as DomLink } from 'react-router-dom'

const styles = {
  root: {
    flexGrow: 1,
  },
  grow: {
    flexGrow: 1,
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
  },
};

class MenuBar extends Component {
  state = {
    anchorEl: null
  };

  handleClick = event => {
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  componentDidMount = () => {
  };

  render() {
    const { classes } = this.props;
    const { anchorEl } = this.state;
    console.log(this.props);
    return (
      <div className={classes.root}>
        <AppBar position="static">
          <Toolbar>
            <IconButton onClick={this.handleClick} className={classes.menuButton} color="inherit" aria-label="Menu">
              <MenuIcon />
            </IconButton>
            <Menu
              id="simple-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={this.handleClose}>
              <MenuItem onClick={this.handleClose} component={DomLink} to="/">Home</MenuItem>
              <MenuItem onClick={this.handleClose} component={DomLink} to="/trades">Insider trades</MenuItem>
              <MenuItem onClick={this.handleClose} component={DomLink} to="/contact">Contact</MenuItem>
            </Menu>
            <Typography variant="h6" color="inherit" className={classes.grow}>
              <Link component={DomLink} to="/" color="inherit">Home</Link>
            </Typography>
            <Button component={DomLink} to="/trades" color="inherit">Insider Trades</Button>
            <Button component={DomLink} to="/contact" color="inherit">Contact</Button>
          </Toolbar>
        </AppBar>
      </div>
    );
  }
}


MenuBar.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(MenuBar);
