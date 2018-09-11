// localForage
// toDataUrl('image/webp');
import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import SquareWebcam from './SquareWebcam';

import { sample, predict, train, BUY, SELL, save } from './tensorflow/classifier';

class App extends Component {

  constructor() {
    super();
    this.state = {
      mode: 'loading'
    };
    global.component = this;
  }

  next() {
    switch (this.state.mode) {
      case 'loading':
        this.setState({ mode: 'pending-capture-buy' });
        return;
      case 'pending-capture-buy':
        this.setState({ mode: 'capture-buy' });
        return;
      case 'capture-buy':
        this.setState({ mode: 'pending-capture-sell' });
        return;
      case 'pending-capture-sell':
        this.setState({ mode: 'capture-sell' });
        return;
      case 'capture-sell':
        this.setState({ mode: 'train' });
        train(console.log)
          .then(() => {
            this.setState({ mode: 'predict' });
          });
        return;
      default:
      // do nowt
    }
  }

  componentDidMount() {
    this.scheduleAnimationFrame();
    setInterval(() => this.next(), 5000);
  }


  scheduleAnimationFrame() {
    this.animationFrame = requestAnimationFrame(async () => {
      const cameraCanvas = this.webcam.getCanvas();
      switch (this.state.mode) {
        case 'capture-buy': {
          sample(BUY, cameraCanvas);
          break;
        }
        case 'capture-sell': {
          sample(SELL, cameraCanvas);
          break;
        }
        case 'predict': {
          const predictions = await predict(cameraCanvas);
          this.setState({
            predictions
          })
          break;
        }
      }
      this.scheduleAnimationFrame();
    });
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.animationFrame);
  }

  render() {
    const { predictions, mode } = this.state;
    const buyProbability = predictions && predictions.find(({ className }) => className === BUY).probability;
    const sellProbability = predictions && predictions.find(({ className }) => className === SELL).probability;
    const side = buyProbability > sellProbability ? BUY : SELL;
    console.log(buyProbability, sellProbability);
    return (
      <div className="App">
        {mode}
        <SquareWebcam screenshotWidth={224} ref={ref => this.webcam = ref} />
        <canvas ref={ref => this.canvas = ref} />
        {side}
      </div>
    );
  }
}

export default App;
