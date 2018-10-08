import React, { Component } from 'react';
import { Route } from 'react-router-dom'
import MobileNetVisualisation from './MobileNetVisualisation';
import Model from './Model';
import Webcam from './Webcam';
import Game from './Game';
import Hands from './hands/HandsPalmFacing';

class App extends Component {

  render() {
    return (
      <React.Fragment>
        <Route exact path="/" component={MobileNetVisualisation} />
        <Route exact path="/model" component={Model} />
        <Route exact path="/webcam" component={Webcam} />
        <Route exact path="/game" component={Game} />
        <Route exact path="/hands" component={Hands} />
      </React.Fragment>
    );
  }
}

export default App;
