import React, { Component } from 'react';
import * as d3 from 'd3';
import * as d3fc from 'd3fc';
import Layout from './Layout';
import { BUY, SELL } from './tensorflow/classifier';
import leftPad from 'left-pad';

const currencyFormatter = new Intl.NumberFormat('en-us', { style: 'currency', currency: 'USD' });

export default class Game extends Component {

  constructor() {
    super();

    this.state = {
      index: 1,
      cash: null,
      position: 1
    };
  }

  componentDidMount() {
    this.timer = setInterval(() => this.tick(), this.props.interval);
    this.animationFrame = requestAnimationFrame(() => this.surface.requestRedraw());

    const { data } = this.props;

    const yExtent = d3fc.extentLinear()
      .accessors([d => d.close])
      .symmetricalAbout(data[0].open);

    const yExtentValue = yExtent(data);

    const areaPadding =  0.1 * (yExtentValue[1] - yExtentValue[0]);

    const xExtent = d3fc.extentTime()
      .accessors([d => d.date]);

    const xScale = d3.scaleTime()
      .domain(xExtent(data));

    const yScale = d3.scaleLinear()
      .domain([yExtentValue[0] - areaPadding, yExtentValue[1] + areaPadding]);

    const area = d3fc.seriesCanvasArea()
      .crossValue(d => d.date)
      .mainValue(d => d.high)
      .baseValue(d => d.low)
      .curve(d3.curveStepBefore)
      .xScale(xScale)
      .yScale(yScale);

      const line = d3fc.seriesCanvasLine()
      .crossValue(d => d.date)
      .mainValue(d => d.close)
      .curve(d3.curveStep)
      .xScale(xScale)
      .yScale(yScale);

    const surface = d3.select(this.surface)
      .on('draw', () => {
        const { width, height, pixelRatio } = d3.event.detail;

        xScale.range([0, width]);
        yScale.range([height, 0]);

        const { data } = this.props;
        const { index } = this.state;

        const ctx = surface.select('canvas')
          .node()
          .getContext('2d', { alpha: false });

        area.context(ctx)
          .decorate((ctx, data) => {
            ctx.fillStyle = 'white';
          });

        line.context(ctx)
          .decorate((ctx, data) => {
            ctx.lineCap = 'butt';
            ctx.lineJoin = 'miter';
            ctx.lineWidth = 4 * pixelRatio;
            ctx.strokeStyle = 'black';
          });

        const visibleData = data.slice(0, index + 1);

        area(visibleData);
        line(visibleData);

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
              textAlign: 'left',
              fontSize: '8vh',
              width: '20%'
            }}>
              {this.state.position >= 0 ? 'Long' : 'Short'}
            </div>
            <div style={{
              textAlign: 'center',
              fontSize: '8vh',
              width: '50%'
            }}>
              {currencyFormatter.format(this.state.cash)}
            </div>
            <div style={{
              textAlign: 'right',
              fontSize: '4vh',
              width: '20%',
              color: this.state.delta < 0 ? 'red' : 'green'
            }}>
              {this.state.delta != null &&
                leftPad(currencyFormatter.format(this.state.delta), 12)}
            </div>
          </React.Fragment>
        }>
        <d3fc-canvas
          use-device-pixel-ratio
          style={{ flex: 'auto', opacity: 1 }}
          ref={surface => this.surface = surface}></d3fc-canvas>
      </Layout>
    );
  }
}

