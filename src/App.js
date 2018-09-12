import React, { Component } from 'react';
import { BUY, SELL, create, load } from './tensorflow/classifier';
import Webcam from './Webcam';

class App extends Component {

  constructor() {
    super();
    this.state = {
      mode: 'loading'
    };

    load('indexeddb://model')
      .catch(() => create())
      .then(model => this.model = model);
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
        this.model.train(console.log)
          .then(() => {
            this.setState({ mode: 'predict' });
          });
        return;
      default:
      // do nowt
    }
  }

  componentDidMount() {
    setInterval(() => this.next(), 5000);
  }


  handleOnFrame = async (canvas) => {
    switch (this.state.mode) {
      case 'capture-buy': {
        this.model.sample(BUY, canvas);
        break;
      }
      case 'capture-sell': {
        this.model.sample(SELL, canvas);
        break;
      }
      case 'pending-capture-buy':
      case 'pending-capture-sell':
      case 'predict': {
        const predictions = await this.model.predict(canvas);
        this.setState({
          predictions
        })
        break;
      }
    }
  }

  render() {
    const { predictions, mode } = this.state;
    const buyProbability = predictions && predictions.find(({ className }) => className === BUY).probability;
    const sellProbability = predictions && predictions.find(({ className }) => className === SELL).probability;
    const side = buyProbability > sellProbability ? BUY : SELL;
    // console.log(predictions, buyProbability, sellProbability);
    return (
      <div className="App">
        {mode}
        <Webcam screenshotWidth={224} onFrame={this.handleOnFrame} />
        {side}
        <button onClick={() => this.model.save('indexeddb://model')} />
      </div>
    );
  }
}

export default App;
