import React, { Component } from 'react';
import { Route, withRouter } from 'react-router-dom'
import MobileNetVisualisation from './MobileNetVisualisation';
import Trainer from './Trainer';
import Webcam from './Webcam';
import Game from './Game';
import Scoreboard from './Scoreboard';
import Skipping from './skipping/Skipping';
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

const loadScores = () => {
  try {
    return JSON.parse(localStorage.scores);
  }
  catch {
    return [
      { score: 1047200, name: 'USA' },
      { score: 985600, name: 'SW' },
      { score: 874300, name: 'USA' },
      { score: 7e5, name: 'DK' },
      { score: 6e5, name: 'DK' },
      { score: 5e5, name: 'DK' },
      { score: 4e5, name: 'DK' },
      { score: 3e5, name: 'DK' },
      { score: 2e5, name: 'DK' },
      { score: 1e5, name: 'DK' },
    ];
  }
};

class App extends Component {

  constructor() {
    super();
    this.state = {
      frame: null,
      customModel: create(),
      mode: SCORE_COMPLETE,
      scores: loadScores(),
      data: generator(100),
      lastData: generator(100),
      playerIndex: -1
    };
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

  handleFrame = (frame) => {
    if (this.frameConsumer == null ||
      this.state.customModel == null ||
      this.frameConsumer.handleFrame == null) {
      return;
    }
    this.frameConsumer.handleFrame(frame);
  }

  advance() {
    switch (this.state.mode) {
      case TRAINING_COMPLETE:
        this.props.history.push('/play');
        this.setState({
          data: generator(100),
          lastData: generator(100),
          playerIndex: -1
        })
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
    if (this.props.location.pathname === '/train' || this.props.location.pathname === '/play') {
      this.props.history.push('/');
    }
  }

  handlePlayerNameChange = (playerName) => {
    const { playerIndex, scores } = this.state;
    if (playerIndex == null) {
      return;
    }
    const updatedScores = [
      ...scores.slice(0, playerIndex),
      { ...scores[playerIndex], name: playerName },
      ...scores.slice(playerIndex + 1, scores.length - 1)
    ];
    localStorage.scores = JSON.stringify(updatedScores);
    this.setState({
      scores: updatedScores
    });
  }

  handleGameComplete = (score) => {
    const { scores } = this.state;
    const playerIndex = scores.findIndex(({ score: highScore }) => score > highScore);
    const updatedScores = playerIndex < 0 ? scores : [
      ...scores.slice(0, playerIndex),
      { score, name: '' },
      ...scores.slice(playerIndex + 1, scores.length - 1)
    ];
    this.setState({
      mode: GAME_COMPLETE,
      playerIndex: playerIndex < 0 ? null : playerIndex,
      scores: updatedScores
    });
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
          <Webcam onFrame={this.handleFrame} />
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
            lastData={this.state.lastData}
            data={this.state.data}
            interval={500}
            onComplete={this.handleGameComplete}
            ref={ref => this.frameConsumer = ref} />
        } />
        <Route exact path='/' render={() =>
          <Scoreboard
            onPlayerNameChange={this.handlePlayerNameChange}
            scores={this.state.scores}
            playerIndex={this.state.playerIndex}
            ref={ref => this.frameConsumer = ref} />
        } />
        <Route exact path='/mobilenet' render={() =>
          <MobileNetVisualisation
            ref={ref => this.frameConsumer = ref}
          />} />
        <Route exact path='/hands' component={Hands} />
        <Route exact path='/skipping' component={Skipping} />
      </React.Fragment>
    );
  }
}

export default withRouter(App);
