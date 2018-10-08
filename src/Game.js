import React, { Component } from 'react';
import Webcam from './Webcam';
import * as d3 from 'd3';
import * as d3fc from 'd3fc';
import { sleep } from './util';

const LABEL_FONT_SIZE = 24;
const START_PRICE = 100;

class Game extends Component {

  constructor() {
    super();

    const generator = d3fc.randomFinancial()
      .startPrice(START_PRICE)
      .mu(0.1)
      .sigma(1.5);

    this.state = {
      position: 0,
      index: 5,
      cash: 1000000,
      data: generator(100)
    };

  }

  componentDidMount() {
    setInterval(() => this.handleTimer(), 333);

    const surface = d3.select(this.surface)
      .on('draw', () => {
        const { width, height, pixelRatio } = d3.event.detail;

        const ctx = surface.select('canvas')
          .node()
          .getContext('2d');

        ctx.lineWidth = 16 * pixelRatio;

        var yExtent = d3fc.extentLinear()
          .accessors([d => d.close])
          .pad([0.01, 0.01])
          .symmetricalAbout(START_PRICE);

        var xExtent = d3fc.extentTime()
          .pad([0.01, 0.01])
          .accessors([d => d.date]);

        const xScale = d3.scaleTime()
          .domain(xExtent(this.state.data))
          .range([0, width]);

        const yScale = d3.scaleLinear()
          .domain(yExtent(this.state.data))
          .range([height, 0]);

        const line = d3fc.seriesCanvasLine()
          .crossValue(d => d.date)
          .mainValue(d => d.close)
          .xScale(xScale)
          .yScale(yScale)
          .context(ctx)
          .decorate(() => {
            ctx.strokeStyle = 'red';
          });

        line(this.state.data.slice(0, this.state.index));
      });
  }

  async handleTimer() {
    const { index, data, cash, position } = this.state;
    if (index >= data.length) {
      return;
    }
    const { open, close } = data[index];
    const shares = Math.floor(cash / open);
    this.setState({
      cash: cash - position * shares * open + position * shares * close
    });
    this.setState({
      index: index + 1
    });
  }

  render() {
    if (this.surface != null) {
      this.surface.requestRedraw();
    }
    const datum = this.state.data[this.state.index];
    const currencyFormatter = new Intl.NumberFormat('en-us', {})
    return (
      <React.Fragment>
        <div style={{ position: 'absolute', zIndex: 10 }}>
          <p>{currencyFormatter.format(this.state.cash)}</p>
          {this.state.index < this.state.data.length && (
            <p style={{ color: datum.open < datum.close ? 'red' : 'green' }}>
              {currencyFormatter.format(datum.open)}
            </p>
          )}
          <p>
            <button onClick={() => this.setState({ position: +1 })}>long</button>
            <button onClick={() => this.setState({ position: 0 })}>hold</button>
            <button onClick={() => this.setState({ position: -1 })}>short</button>
          </p>
        </div>
        <div
          style={{ position: 'absolute', width: '100vw', height: '100vh', overflow: 'hidden' }} >
          <Webcam
            onFrame={frame => this.frame = frame}
            style={{ opacity: 0.5 }} />
        </div>
        <d3fc-canvas
          use-device-pixel-ratio
          style={{ width: '100vw', height: '100vh', opacity: 0.8 }}
          ref={surface => this.surface = surface}></d3fc-canvas>
      </React.Fragment >
    );
  }
}

export default Game;
