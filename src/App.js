import React, { Component } from 'react';
import { Route, withRouter } from 'react-router-dom'
import MobileNetVisualisation from './MobileNetVisualisation';
import Trainer from './Trainer';
import Webcam from './Webcam';
import Game from './Game';
import Scoreboard from './Scoreboard';
import Hands from './hands/HandsPalmFacing';
import { create, load } from './tensorflow/classifier';
import * as d3fc from 'd3fc';

const generator = d3fc.randomFinancial()
  .startPrice(100)
  .mu(0.1)
  .sigma(1.5);

const TRAINING_COMPLETE = 'training-complete';
const GAME_COMPLETE = 'game-complete';
const SCORE_COMPLETE = 'score-complete';

class App extends Component {

  constructor() {
    super();
    this.state = {
      frame: null,
      data: generator(100),
      customModel: null,
      mode: SCORE_COMPLETE
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

  advance() {
    switch (this.state.mode) {
      case TRAINING_COMPLETE:
        this.props.history.push('/play');
        return;
      case GAME_COMPLETE:
        this.props.history.push('/');
        this.setState({ mode: SCORE_COMPLETE });
        return;
      case SCORE_COMPLETE:
        this.props.history.push('/train');
        return;
    }
  }

  componentDidMount() {
    document.body.addEventListener('keyup', ({ code }) => {
      switch (code) {
        case 'PageDown':
          this.advance();
          return;
      }
    });
    this.props.history.push('/');
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
          opacity: 1
        }} >
          <Webcam onFrame={this.handleOnFrame} />
        </div>
        <Route exact path='/train' render={() =>
          <Trainer
            model={this.state.customModel}
            onClassifying={() => { this.setState({ mode: TRAINING_COMPLETE }) }}
            ref={ref => this.frameConsumer = ref} />
        } />
        <Route exact path='/play' render={() =>
          <Game
            model={this.state.customModel}
            cash={1e6}
            data={this.state.data}
            interval={500}
            onCashUpdate={() => { }}
            onComplete={() => { this.setState({ mode: GAME_COMPLETE }) }}
            ref={ref => this.frameConsumer = ref} />
        } />
        <Route exact path='/' render={() =>
          <Scoreboard
            onPlayerNameChange={() => {}}
            scores={[{ score: 1000000 }]}
            playerIndex={0} />
        } />
        <Route exact path='/mobilenet' component={MobileNetVisualisation} />
        <Route exact path='/hands' component={Hands} />
      </React.Fragment>
    );
  }
}

export default withRouter(App);
