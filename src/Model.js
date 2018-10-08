import React, { Component } from 'react';
import { BUY, SELL, create, load } from './tensorflow/classifier';
import Webcam from './Webcam';
import HandsPalmForward from './hands/HandsPalmFacing';
import HandsPalmBackward from './hands/HandsPalmAway';
import { sleep } from './util';

const WAITING_FOR_FRAME = 'waiting-for-frame';
const WAITING_FOR_MODEL = 'waiting-for-model';
const PENDING_CAPTURE_BUY = 'pending-capture-buy'
const CAPTURING_BUY = 'capturing-buy'
const PENDING_CAPTURE_SELL = 'pending-capture-sell'
const CAPTURING_SELL = 'capturing-sell'
const TRAINING = 'training';
const CLASSIFYING = 'classifying';

const labelFor = (mode) => {
  switch (mode) {
    case WAITING_FOR_FRAME:
    case WAITING_FOR_MODEL:
      return 'Loading';
    case PENDING_CAPTURE_BUY:
      return 'Buy - Get Ready';
    case CAPTURING_BUY:
      return 'Buy - Capturing...'
    case PENDING_CAPTURE_SELL:
      return 'Sell - Get Ready';
    case CAPTURING_SELL:
      return 'Sell - Capturing...'
    case TRAINING:
      return 'Training...'
  }
}

class App extends Component {

  constructor() {
    super();
    this.state = {
      mode: WAITING_FOR_FRAME,
      buyProbability: null,
      sellProbability: null
    };
    this.model = create();
  }

  handleOnFrame = async (canvas) => {
    switch (this.state.mode) {
      case WAITING_FOR_FRAME: {
        this.setState({
          mode: WAITING_FOR_MODEL
        });
        // kick off a dummy prediction to ensure the model is ready to go
        await this.model.classify(canvas)
        this.setState({
          captureCount: 0,
          mode: PENDING_CAPTURE_BUY
        });
        await sleep(5000);
        this.setState({
          mode: CAPTURING_BUY
        });
        return;
      }
      case CAPTURING_BUY: {
        if (this.state.captureCount > 200) {
          this.setState({
            captureCount: 0,
            mode: PENDING_CAPTURE_SELL
          });
          await sleep(5000);
          this.setState({
            mode: CAPTURING_SELL
          });
          return;
        }
        this.model.sample(BUY, canvas);
        this.setState({
          captureCount: this.state.captureCount + 1
        });
        return;
      }
      case CAPTURING_SELL: {
        if (this.state.captureCount > 200) {
          this.setState({
            captureCount: null,
            mode: TRAINING
          });
          await this.model.train(console.log);
          this.setState({
            mode: CLASSIFYING
          });
          return;
        }
        this.model.sample(SELL, canvas);
        this.setState({
          captureCount: this.state.captureCount + 1
        });
        return;
      }
      case CLASSIFYING: {
        const predictions = await this.model.classify(canvas);
        const buyProbability = predictions.find(({ className }) => className === BUY).probability;
        const sellProbability = predictions.find(({ className }) => className === SELL).probability;
        this.setState({
          buyProbability,
          sellProbability
        });
        return;
      }
      default: {
        // sit pretty :)
      }
    }
  }

  render() {
    const { buyProbability, sellProbability, mode } = this.state;
    const side = buyProbability > sellProbability ? BUY : SELL;
    return (

      <React.Fragment>
        <div
          style={{ position: 'absolute', width: '100vw', height: '100vh', overflow: 'hidden', zIndex: -1 }} >
          <Webcam screenshotWidth={224} onFrame={this.handleOnFrame} />
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100vw',
          height: '100vh',
          opacity: 0.8
        }}>
          <div style={{
            background: 'white',
            margin: '2vh 0',
            display: 'flex',
            alignItems: 'center',
            fontFamily: 'monospaced'
          }}>
            <div style={{
              textAlign: 'center',
              fontSize: '8vh',
              flex: 1,
              padding: '2vh 0'
            }}>
              {mode !== 'classifying' ? labelFor(mode) : side}
            </div>
          </div>
          {
            (mode === PENDING_CAPTURE_BUY || mode === CAPTURING_BUY) &&
            <HandsPalmBackward />
          }
          {
            (mode === PENDING_CAPTURE_SELL || mode === CAPTURING_SELL) &&
            <HandsPalmForward />
          }
        </div>
      </React.Fragment >
    );
  }
}

export default App;
