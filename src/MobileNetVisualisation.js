import React, { Component } from 'react';
import { classify } from './tensorflow/mobilenet';
import lookupWordNetId, { wordNetIds } from './tensorflow/wordNetIds';
import Webcam from './Webcam';
import * as d3 from 'd3';
import * as d3fc from 'd3fc';
import { sleep } from './util';
import createTextMetricsCache from './util/textMetricsCache';
import createLazyMap from './util/lazyMap';
import getLabelAnchor from './util/labelAnchor';

const MUG = 'mug';
const WEBCAM = 'webcam';
const IPAD = 'ipad';
const LAMETRIC = 'lametric';

const SYMBOL_SIZE_SCALE = 100;
const SYMBOL_SIZE_MIN = 0.001;
const MOVING_AVERAGE_COUNT = 5;
const LABEL_FONT_SIZE = 24;
const LABEL_VERTICAL_OFFSET = 0.75;
const LABEL_MARGIN = LABEL_FONT_SIZE * 2;
const ANCHOR_MARGIN = LABEL_FONT_SIZE * 0.9;

const sum = array => array.reduce((a, b) => a + b, 0);

const movingAverage = array => sum(array) / array.length;

const rollLeft = (array, item) => {
  array.splice(0, 1);
  array.push(item);
};

const compare = (a, b) => {
  if (a > b) {
    return 1;
  }
  if (a < b) {
    return -1;
  }
  return 0;
};

class MobileNetVisualisation extends Component {

  constructor() {
    super();
    this.predictions = createLazyMap(() => ({
      probabilities: new Array(MOVING_AVERAGE_COUNT).fill(0),
      ranks: new Array(MOVING_AVERAGE_COUNT).fill(1000),
    }));
    this.renderedLabelIds = [];
    this.textMetricsCache = null;
    this.state = {
      mode: MUG
    };
  }

  initialiseNodes(width, height) {
    const cellsPerColumn = Math.floor(Math.sqrt(wordNetIds.length));
    const cellWidth = width / cellsPerColumn;
    const cellHeight = height / cellsPerColumn;
    const offsetLeft = cellWidth / 2;
    const offsetTop = cellHeight / 2;

    this.nodes = d3.shuffle(wordNetIds.slice())
      .map((wordNetId, index) => {
        const className = lookupWordNetId(wordNetId);
        const top = (index % cellsPerColumn) * cellHeight;
        const left = Math.floor(index / cellsPerColumn) * cellWidth;
        return {
          index,
          wordNetId,
          className,
          shortName: className.split(',')[0],
          top,
          left,
          center: [left + offsetLeft, top + offsetTop],
          width: cellWidth,
          height: cellHeight,
          probability: () => movingAverage(this.predictions(wordNetId).probabilities),
          rank: () => movingAverage(this.predictions(wordNetId).ranks)
        };
      });

    // this.nodes = d3.shuffle(this.nodes);
  }

  handleClick = ({ key }) => {
    switch (this.state.mode) {
      case MUG:
        this.setState({ mode: LAMETRIC });
        return;
      case LAMETRIC:
        this.setState({ mode: IPAD });
        return;
      case IPAD:
        this.setState({ mode: WEBCAM });
        return;
      case WEBCAM:
        this.setState({ mode: MUG });
        return;
    }
  };

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  componentDidMount() {
    this.timer = setInterval(() => this.handleTimer(), 100);

    const surface = d3.select(this.surface)
      .on('draw', () => {
        const { width, height, pixelRatio } = d3.event.detail;

        const ctx = surface.select('canvas')
          .node()
          .getContext('2d');

        if (this.nodes == null) {
          this.initialiseNodes(width, height);
        }

        ctx.font = `${LABEL_FONT_SIZE * pixelRatio}px sans-serif`;

        if (this.textMetricsCache == null) {
          this.textMetricsCache = createTextMetricsCache(ctx);
        }

        const symbolGenerator = d3.symbol()
          .size(d => d)
          .context(ctx);

        const colorScale = d3.scaleSequential(d3.interpolateSinebow)
          .domain([0, this.nodes.length]);

        const circles = this.nodes.map(node => {
          const length = Math.min(node.width, node.height);
          const area = length * length;
          const scale = area * SYMBOL_SIZE_SCALE;
          const size = (node.probability() + SYMBOL_SIZE_MIN) * scale;
          return {
            node,
            id: node.index,
            x: node.center[0],
            y: node.center[1],
            size
          };
        })
          .sort((a, b) => a.size - b.size);

        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = 'white';

        for (const { id, x, y, size } of circles) {
          ctx.beginPath();
          ctx.setTransform(1, 0, 0, 1, x, y);
          ctx.fillStyle = colorScale(id);
          symbolGenerator(size);
          ctx.fill();
        }

        const labels = this.nodes.filter(({ wordNetId, rank }) =>
          rank() <= (this.renderedLabelIds.includes(wordNetId) ? 20 : 5)
        )
          .map(({ wordNetId, shortName, center, rank }) => {
            let index = this.renderedLabelIds.indexOf(wordNetId);
            if (index === -1) {
              index = this.renderedLabelIds.length + rank();
            }
            const text = shortName;
            const textWidth = this.textMetricsCache(text).width;
            const textHeight = LABEL_FONT_SIZE * pixelRatio;
            return {
              id: wordNetId,
              index,
              text,
              textWidth,
              textHeight,
              width: textWidth + LABEL_MARGIN,
              height: textHeight + LABEL_MARGIN,
              x: center[0],
              y: center[1]
            };
          })
          .sort((a, b) => a.index - b.index);

        this.renderedLabelIds = labels.map(({ id }) => id);

        const labelLayoutStrategy = d3fc.layoutGreedy()
          .bounds({
            x: 0,
            y: 0,
            width,
            height
          });

        const labelLocations = labelLayoutStrategy(labels.map(({ x, y, width, height }) => ({
          x,
          y,
          width,
          height,
          hidden: false
        })))

        ctx.globalAlpha = 0.8;

        ctx.strokeStyle = 'gray';
        ctx.lineCap = 'round';
        ctx.lineWidth = 2 * devicePixelRatio;

        for (let i = 0; i < labels.length; i++) {
          const { text, textWidth, textHeight } = labels[i];
          const { x, y, width, height, location } = labelLocations[i];
          ctx.setTransform(1, 0, 0, 1, x, y);
          ctx.fillStyle = 'white';
          ctx.fillRect(ANCHOR_MARGIN, ANCHOR_MARGIN, width - 2 * ANCHOR_MARGIN, height - 2 * ANCHOR_MARGIN);
          ctx.fillStyle = 'black';
          ctx.fillText(text, (width - textWidth) / 2, (height - textHeight) / 2 + LABEL_VERTICAL_OFFSET * textHeight);
          const labelAnchor = getLabelAnchor({
            width,
            height,
            location,
            margin: ANCHOR_MARGIN
          });
          ctx.beginPath();
          ctx.moveTo(labelAnchor.x1, labelAnchor.y1);
          ctx.lineTo(labelAnchor.x2, labelAnchor.y2);
          ctx.stroke();
        }
      });
  }

  async handleTimer() {
    if (this.frame == null) {
      return;
    }
    const predictions = await classify(this.frame, 1000);
    predictions.forEach(({ className, probability }, index) => {
      const wordNetId = lookupWordNetId(className);
      const item = this.predictions(wordNetId);
      rollLeft(item.ranks, index);
      rollLeft(item.probabilities, probability);
    });
    if (this.surface != null) {
      this.surface.requestRedraw();
    }
  }

  handleFrame(frame) {
    switch (this.state.mode) {
      case WEBCAM:
        this.frame = frame;
        return;
      case MUG:
        this.frame = this.mug;
        return;
      case IPAD:
        this.frame = this.ipad;
        return;
      case LAMETRIC:
        this.frame = this.lametric;
        return;
    }
  }

  render() {
    return (
      <React.Fragment>
        <img
          ref={ref => this.mug = ref}
          src={require('./samples/mug.png')}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            objectFit: 'cover',
            height: '100%',
            width: '100%',
            display: this.state.mode === MUG ? '' : 'none'
          }}
        />
        <img
          ref={ref => this.ipad = ref}
          src={require('./samples/ipad.png')}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            objectFit: 'cover',
            height: '100%',
            width: '100%',
            display: this.state.mode === IPAD ? '' : 'none'
          }}
        />
        <img
          ref={ref => this.lametric = ref}
          src={require('./samples/lametric.png')}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            objectFit: 'cover',
            height: '100%',
            width: '100%',
            display: this.state.mode === LAMETRIC ? '' : 'none'
          }}
        />
        <d3fc-canvas
          use-device-pixel-ratio
          style={{ width: '100vw', height: '100vh' }}
          ref={surface => this.surface = surface}
          onClick={this.handleClick}></d3fc-canvas>
      </React.Fragment>
    );
  }
}

export default MobileNetVisualisation;
