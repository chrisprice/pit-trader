import React, { Component } from 'react';
import * as d3 from 'd3';
import * as d3fc from 'd3fc';
import Layout from './Layout';
import { BUY, SELL } from './tensorflow/classifier';

const CANVAS_MARGIN = 100;

const currencyFormatter = new Intl.NumberFormat('en-us', { style: 'currency', currency: 'USD' });

export default class Game extends Component {

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

        const { data } = this.props;
        const { index, position } = this.state;

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
    const { data, onCashUpdate, onComplete } = this.props;
    const { cash, position, index } = this.state;
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
  
  handleFrame = async (canvas) => {
    const predictions = await this.props.model.classify(canvas);
    const position = predictions.find(({ className }) => className === BUY).probability * 2 - 1;
    this.setState({
      position
    });
  }

  render() {
    return (
      <Layout
        title={
          <React.Fragment>
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
          </React.Fragment>
        }>
        <d3fc-canvas
          use-device-pixel-ratio
          style={{ flex: 'auto', opacity: 0.8 }}
          ref={surface => this.surface = surface}></d3fc-canvas>
      </Layout>
    );
  }
}

