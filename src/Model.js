import React, { Component } from 'react';
import { BUY, SELL, create, load } from './tensorflow/classifier';
import Webcam from './Webcam';
import { sleep } from './util';

const WAITING_FOR_FRAME = 'waiting-for-frame';
const WAITING_FOR_MODEL = 'waiting-for-model';
const PENDING_CAPTURE_BUY = 'pending-capture-buy'
const CAPTURING_BUY = 'capturing-buy'
const PENDING_CAPTURE_SELL = 'pending-capture-sell'
const CAPTURING_SELL = 'capturing-sell'
const TRAINING = 'training';
const CLASSIFYING = 'classifying';

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
        await sleep(2000);
        this.setState({
          mode: CAPTURING_BUY
        });
        return;
      }
      case CAPTURING_BUY: {
        if (this.state.captureCount > 100) {
          this.setState({
            captureCount: 0,
            mode: PENDING_CAPTURE_SELL
          });
          await sleep(2000);
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
        if (this.state.captureCount > 100) {
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
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
        <h1>{mode}</h1>
        <div>
          <Webcam screenshotWidth={224} onFrame={this.handleOnFrame} showCanvas={true} />
        </div>
        <h1>{side}</h1>
        <div style={{
          height: '1em',
          position: 'relative',
          background: 'navy',
        }}>
          <div style={{
            position: 'absolute',
            background: 'coral',
            top: 0,
            right: (buyProbability * 100).toFixed(0) + '%',
            bottom: 0,
            left: 0
          }}>
          </div>
        </div>
        <p>
          <button onClick={() => this.model.save('indexeddb://model')} >Save Model</button>
          <button onClick={async () => {
            this.setState({ mode: WAITING_FOR_MODEL });
            this.model = await load('indexeddb://model');
            this.setState({ mode: CLASSIFYING });
          }}>Load Model</button>
        </p>
      </div>
    );
  }
}

export default App;
