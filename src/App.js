import React, { Component } from 'react';
import { Route } from 'react-router-dom'
import MobileNetVisualisation from './MobileNetVisualisation';
import Model from './Model';
import Webcam from './Webcam';

class App extends Component {

  render() {
    return (
      <React.Fragment>
        <Route exact path="/" component={MobileNetVisualisation} />
        <Route exact path="/model" component={Model} />
        <Route exact path="/webcam" component={Webcam} />
      </React.Fragment>
    );
  }
}

export default App;
