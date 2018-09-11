import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import SquareWebcam from './SquareWebcam';

const NUM_CLASSES = 2;
const BUY_LABEL = 0;
const SELL_LABEL = 1;
const BATCH_SIZE_FRACTION = 0.2;
const DENSE_UNITS = 100;
const EPOCHS = 100;
const LEARNING_RATE = 0.001;

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
        this.train().then(() => {
          this.setState({ mode: 'predict' });
        });
        return;
      default:
      // do nowt
    }
  }

  componentDidMount() {
    this.scheduleAnimationFrame();
    mobilenet.load(1, 0.25)
      .then((model) => {
        this.model = model;
      });
    setInterval(() => this.next(), 5000);
  }

  async train() {
    this.model2 = tf.sequential({
      layers: [
        tf.layers.flatten({ inputShape: [7, 7, 256] }),
        tf.layers.dense({
          units: DENSE_UNITS,
          activation: 'relu',
          kernelInitializer: 'varianceScaling',
          useBias: true
        }),
        tf.layers.dense({
          units: NUM_CLASSES,
          kernelInitializer: 'varianceScaling',
          useBias: false,
          activation: 'softmax'
        })
      ]
    });

    const optimizer = tf.train.adam(LEARNING_RATE);
    this.model2.compile({ optimizer: optimizer, loss: 'categoricalCrossentropy' });

    const batchSize =
      Math.floor(this.xs.shape[0] * BATCH_SIZE_FRACTION);
    if (!(batchSize > 0)) {
      throw new Error(
        `Batch size is 0 or NaN. Please choose a non-zero fraction.`);
    }

    return new Promise((resolve) => {
      this.model2.fit(this.xs, this.ys, {
        batchSize,
        epochs: EPOCHS,
        callbacks: {
          onBatchEnd: async (batch, logs) => {
            console.log('Loss: ' + logs.loss.toFixed(5));
          },
          onTrainEnd: resolve
        }
      });
    });
  }

  scheduleAnimationFrame() {
    this.animationFrame = requestAnimationFrame(async () => {
      const cameraCanvas = this.webcam.getCanvas();
      switch (this.state.mode) {
        case 'capture-buy': {
          const example = await this.model.infer(cameraCanvas, 'conv_pw_13_relu');
          this.storeExample(example, BUY_LABEL);
          break;
        }
        case 'capture-sell': {
          const example = await this.model.infer(cameraCanvas, 'conv_pw_13_relu');
          this.storeExample(example, SELL_LABEL);
          break;
        }
        case 'predict': {
          const activation = await this.model.infer(cameraCanvas, 'conv_pw_13_relu');
          const predictions = this.model2.predict(activation)
          const maxPrediction = predictions.as1D().argMax();
          const label = (await maxPrediction.data())[0];
          predictions.dispose();
          maxPrediction.dispose();
          console.log(label);
          break;
        }
      }
      this.scheduleAnimationFrame();
    });
  }

  // stolen from https://github.com/tensorflow/tfjs-examples/blob/master/webcam-transfer-learning/controller_dataset.js#34
  storeExample(example, label) {
    const y = tf.tidy(() => tf.oneHot(tf.tensor1d([label]).toInt(), NUM_CLASSES));
    if (this.xs == null) {
      this.xs = tf.keep(example);
      this.ys = tf.keep(y);
    } else {
      const oldX = this.xs;
      this.xs = tf.keep(oldX.concat(example, 0));

      const oldY = this.ys;
      this.ys = tf.keep(oldY.concat(y, 0));

      oldX.dispose();
      oldY.dispose();
      y.dispose();
    }
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.animationFrame);
  }

  render() {
    return (
      <div className="App">
        {this.state.mode}
        <SquareWebcam screenshotWidth={224} ref={ref => this.webcam = ref} />
        <canvas ref={ref => this.canvas = ref} />
      </div>
    );
  }
}

export default App;
