import React, { Component } from 'react';
import { BUY, SELL } from './tensorflow/classifier';
import HandsPalmForward from './hands/HandsPalmFacing';
import HandsPalmBackward from './hands/HandsPalmAway';
import { sleep } from './util';
import Layout from './Layout';
import leftPad from 'left-pad';
import Skipping from './skipping/Skipping';

const CLASSIFY_SKIP_COUNT = 20;
const CAPTURE_SKIP_COUNT = 0;
const CAPTURE_COUNT = 100;
const READY_PERIOD = 3000;
const PHASE_COUNT = 3;
const CAPTURE_COUNT_PER_PHASE = Math.floor(CAPTURE_COUNT / PHASE_COUNT);
const WAITING_FOR_FRAME = 'waiting-for-frame';
const WAITING_FOR_MODEL = 'waiting-for-model';
const PENDING_CAPTURE_BUY = 'pending-capture-buy'
const CAPTURING_BUY = 'capturing-buy'
const PENDING_CAPTURE_SELL = 'pending-capture-sell'
const CAPTURING_SELL = 'capturing-sell'
const TRAINING = 'training';
const CLASSIFYING = 'classifying';

const format = value => {
  const rounded = Math.round(value * 100);
  return `${leftPad(rounded, 3)}%`;
};

const labelFor = ({ mode, captureCount, trainingProgress, buyProbability, sellProbability }) => {
  switch (mode) {
    case WAITING_FOR_FRAME:
    case WAITING_FOR_MODEL:
      return 'Loading';
    case PENDING_CAPTURE_BUY:
      return 'Long - Get Ready';
    case CAPTURING_BUY:
      return `Capturing... (${format(captureCount / CAPTURE_COUNT_PER_PHASE)})`
    case PENDING_CAPTURE_SELL:
      return 'Short - Get Ready';
    case CAPTURING_SELL:
      return `Capturing... (${format(captureCount / CAPTURE_COUNT_PER_PHASE)})`
    case TRAINING:
      return `Training... (${format(trainingProgress)})`;
    case CLASSIFYING:
      return `${buyProbability > sellProbability ? ' Long' : 'Short'} (${format(Math.max(buyProbability, sellProbability))})`;
  }
}

class Trainer extends Component {

  constructor() {
    super();
    this.state = {
      mode: WAITING_FOR_FRAME,
      buyProbability: null,
      sellProbability: null,
      captureCount: null,
      skipCount: null,
      trainingProgress: 0,
    };
  }

  componentWillUnmount() {
    this.props.model.clearSamples();
  }

  handleFrame = async (canvas) => {
    if (this.state.skipCount > 0) {
      this.setState({ skipCount: this.state.skipCount - 1 });
      return;
    }
    switch (this.state.mode) {
      case WAITING_FOR_FRAME: {
        this.setState({
          mode: WAITING_FOR_MODEL
        });
        // kick off a dummy prediction to ensure the model is ready to go
        await this.props.model.classify(canvas);
        this.setState({
          phase: 0,
          captureCount: 0,
          mode: PENDING_CAPTURE_BUY
        });
        await sleep(READY_PERIOD);
        this.setState({
          mode: CAPTURING_BUY
        });
        return;
      }
      case CAPTURING_BUY: {
        if (this.state.captureCount >= CAPTURE_COUNT_PER_PHASE) {
          this.setState({
            captureCount: 0,
            mode: PENDING_CAPTURE_SELL
          });
          await sleep(READY_PERIOD);
          this.setState({
            mode: CAPTURING_SELL
          });
          return;
        }
        this.props.model.sample(BUY, canvas);
        this.setState({
          captureCount: this.state.captureCount + 1,
          skipCount: CAPTURE_SKIP_COUNT
        });
        return;
      }
      case CAPTURING_SELL: {
        if (this.state.captureCount >= CAPTURE_COUNT_PER_PHASE) {
          if (this.state.phase < PHASE_COUNT - 1) {
            this.setState({
              captureCount: 0,
              mode: PENDING_CAPTURE_BUY,
              phase: this.state.phase + 1
            });
            await sleep(READY_PERIOD);
            this.setState({
              mode: CAPTURING_BUY
            });
            return;
          }
          this.setState({
            captureCount: null,
            mode: TRAINING
          });
          await this.props.model.train(trainingProgress => this.setState({ trainingProgress }));
          this.setState({
            mode: CLASSIFYING
          });
          this.props.onClassifying();
          return;
        }
        this.props.model.sample(SELL, canvas);
        this.setState({
          captureCount: this.state.captureCount + 1,
          skipCount: CAPTURE_SKIP_COUNT
        });
        return;
      }
      case CLASSIFYING: {
        const predictions = await this.props.model.classify(canvas);
        const buyProbability = predictions.find(({ className }) => className === BUY).probability;
        const sellProbability = predictions.find(({ className }) => className === SELL).probability;
        this.setState({
          buyProbability,
          sellProbability,
          skipCount: CLASSIFY_SKIP_COUNT
        });
        return;
      }
      default: {
        // sit pretty :)
      }
    }
  }

  render() {
    const { mode } = this.state;
    return (
      <Layout title={
        <div style={{
          textAlign: 'center',
          fontSize: '8vh',
          flex: 1,
          padding: '2vh 0'
        }}>
          {labelFor(this.state)}
        </div>
      }>
        {
          (mode === PENDING_CAPTURE_BUY || mode === CAPTURING_BUY) &&
          <HandsPalmBackward />
        }
        {
          (mode === PENDING_CAPTURE_SELL || mode === CAPTURING_SELL) &&
          <HandsPalmForward />
        }
        {
          (mode === TRAINING) &&
          <Skipping />
        }
      </Layout>
    );
  }
}

export default Trainer;
