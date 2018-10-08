import React, { Component } from 'react';
import Webcam from './Webcam';
import * as d3 from 'd3';
import * as d3fc from 'd3fc';
import { sleep } from './util';

const CANVAS_MARGIN = 100;

class Game extends Component {

  constructor() {
    super();

    this.state = {
      index: 1,
      cash: null
    };
  }

  componentDidMount() {
    this.timer = setInterval(() => this.tick(), this.props.interval);
    this.animationFrame = requestAnimationFrame(() => this.surface.requestRedraw());

    const { data } = this.props;

    var yExtent = d3fc.extentLinear()
      .accessors([d => d.close])
      .symmetricalAbout(data[0].open);

    var xExtent = d3fc.extentTime()
      .accessors([d => d.date]);

    const xScale = d3.scaleTime()
      .domain(xExtent(data));

    const yScale = d3.scaleLinear()
      .domain(yExtent(data));

    const line = d3fc.seriesCanvasLine()
      .crossValue(d => d.date)
      .mainValue(d => d.close)
      .xScale(xScale)
      .yScale(yScale);

    const colorScale = d3.scaleSequential(d3.interpolateRdGy)
      .domain([-1, 1]);

    const surface = d3.select(this.surface)
      .on('draw', () => {
        const { width, height, pixelRatio } = d3.event.detail;

        xScale.range([0, width - CANVAS_MARGIN * pixelRatio]);
        yScale.range([height - CANVAS_MARGIN * pixelRatio, CANVAS_MARGIN * pixelRatio]);

        const { data, position } = this.props;
        const { index } = this.state;

        const ctx = surface.select('canvas')
          .node()
          .getContext('2d');

        line.context(ctx)
          .decorate((ctx, data) => {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 2 * CANVAS_MARGIN * pixelRatio;
            ctx.strokeStyle = 'white';
            ctx.stroke();
            ctx.lineCap = 'butt';
            ctx.lineJoin = 'bevel';
            ctx.lineWidth = 16 * pixelRatio;
            ctx.strokeStyle = 'black';
          });

        const visibleData = data.slice(0, index + 1);

        line(visibleData);

        if (index < data.length) {
          ctx.translate(xScale(visibleData[visibleData.length - 1].date), yScale(visibleData[visibleData.length - 1].close));
          ctx.rotate(-(position / 3) * Math.PI);

          const length = CANVAS_MARGIN * 0.66;
          ctx.lineWidth = 8 * pixelRatio;
          ctx.strokeStyle = colorScale(position);
          ctx.lineCap = 'round'
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(length, 0);
          ctx.moveTo(length * 0.7, length * -0.2);
          ctx.lineTo(length, 0);
          ctx.moveTo(length * 0.7, length * 0.2);
          ctx.lineTo(length, 0);
          ctx.stroke();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        this.animationFrame = requestAnimationFrame(() => this.surface.requestRedraw());
      });
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    cancelAnimationFrame(this.animationFrame);
  }

  static getDerivedStateFromProps(props, state) {
    if (state.cash == null) {
      return {
        cash: props.cash
      };
    }
    return null;
  }

  tick() {
    const { data, position, onCashUpdate, onComplete } = this.props;
    const { cash, index } = this.state;
    if (index >= data.length) {
      return;
    }
    const { open, close } = data[index];
    const unityPosition = position >= 0 ? +1 : -1;
    const shares = Math.floor(cash / open);
    const delta = -1 * unityPosition * shares * open + unityPosition * shares * close;
    const updatedCash = cash + delta;
    this.setState({
      delta,
      cash: updatedCash,
      index: index + 1
    });
    onCashUpdate(cash);
    if (index === data.length - 1) {
      onComplete();
      clearInterval(this.timer);
    }
  }

  render() {
    if (this.surface != null) {
      this.surface.requestRedraw();
    }
    const datum = this.props.data[this.state.index];
    const currencyFormatter = new Intl.NumberFormat('en-us', { style: 'currency', currency: 'USD' })
    return (
      <React.Fragment>
        <div
          style={{ position: 'absolute', width: '100vw', height: '100vh', overflow: 'hidden', zIndex: -1 }} >
          <Webcam onFrame={frame => this.frame = frame} />
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
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
              textAlign: 'right',
              fontSize: '8vh',
              flex: 1,
              padding: '2vh 0',
            }}>
              {currencyFormatter.format(this.state.cash)}
            </div>
            <div style={{
              textAlign: 'right',
              fontSize: '4vh',
              padding: '2vh',
              flex: 0.6,
              color: this.state.delta < 0 ? 'red' : 'green'
            }}>
              {this.state.delta != null && currencyFormatter.format(this.state.delta)}
            </div>
          </div>
          <d3fc-canvas
            use-device-pixel-ratio
            style={{ flex: 'auto', opacity: 0.8 }}
            ref={surface => this.surface = surface}></d3fc-canvas>
        </div>
      </React.Fragment >
    );
  }
}

export default () => {
  const generator = d3fc.randomFinancial()
    .startPrice(100)
    .mu(0.1)
    .sigma(1.5);

  const data = generator(100);

  return <Game cash={1e6} data={data} position={1} interval={333} onCashUpdate={() => { }} onComplete={() => {}}/>;
};
