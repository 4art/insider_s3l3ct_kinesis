import React, { Component } from 'react';
import MenuBar from './components/MenuBar';
import { Route } from "react-router-dom";
import Home from './components/Home';
import { BrowserRouter } from "react-router-dom";
import Trades from './components/Trades';
import Contact from "./components/Contact";
class App extends Component {

  render() {
    return (
      <BrowserRouter>
        <div>
          <MenuBar store={this.props.store}/>
          <Route exact component={Home} path="/" />
          <Route component={Trades} path="/trades" />
          <Route component={Contact} path="/contact" />
        </div>
      </BrowserRouter>
    )
  }
}
export default App;
