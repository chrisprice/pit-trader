import React, { Component } from 'react';
import { Route } from 'react-router-dom'
import MobileNetVisualisation from './MobileNetVisualisation';
import Trainer from './Trainer';
import Webcam from './Webcam';
import Game from './Game';
import Hands from './hands/HandsPalmFacing';
import { create, load } from './tensorflow/classifier';
import * as d3fc from 'd3fc';

const generator = d3fc.randomFinancial()
  .startPrice(100)
  .mu(0.1)
  .sigma(1.5);

class App extends Component {

  constructor() {
    super();
    this.state = {
      frame: null,
      data: generator(100),
      customModel: null
    };
    this.loadModel();
    global.app = this;
  }

  async loadModel() {
    try {
      const model = await load('indexeddb://model');
      this.setState({ customModel: model });
    }
    catch (e) {
      console.warn(e);
      this.setState({ customModel: create() });
    }
  }

  async saveModel() {
    this.state.customModel.save('indexeddb://model');
  }

  handleOnFrame = (frame) => {
    if (this.frameConsumer == null || this.state.customModel == null) {
      return;
    }
    this.frameConsumer.handleFrame(frame);
  }

  render() {
    return (
      <React.Fragment>
        <div style={{
          position: 'absolute',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          zIndex: -1,
          opacity: 0.8
        }} >
          <Webcam onFrame={this.handleOnFrame} />
        </div>
        <Route exact path="/" component={MobileNetVisualisation} />
        <Route exact path="/trainer" render={() =>
          <Trainer
            model={this.state.customModel}
            ref={ref => this.frameConsumer = ref} />
        } />
        <Route exact path="/game" render={() =>
          <Game
            model={this.state.customModel}
            cash={1e6}
            data={this.state.data}
            interval={1000}
            onCashUpdate={() => { }}
            onComplete={() => { }}
            ref={ref => this.frameConsumer = ref} />
        } />
        <Route exact path="/hands" component={Hands} />
      </React.Fragment>
    );
  }
}

export default App;
