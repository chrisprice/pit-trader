import React, { Component } from 'react';
import { classify } from './tensorflow/mobilenet';
import Webcam from './Webcam';
import * as d3 from 'd3';
import * as d3fc from 'd3fc';
import { sleep } from './util';

const SYMBOL_SIZE_SCALE = 5;
const SYMBOL_SIZE_MIN = 5;
const MOVING_AVERAGE_COUNT = 30;
const LABEL_FONT_SIZE = 16;
const LABEL_VERTICAL_OFFSET = 0.3 * LABEL_FONT_SIZE;

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
    this.symbolGenerator = d3.symbol();
    this.predictions = new Map();
    this.sortedKeys = null;
  }

  componentDidMount() {
    const surface = d3.select(this.surface)
      .on('draw', () => {
        const { width, height } = d3.event.detail;

        const surfaceSize = Math.min(width, height);
        const cellCount = this.predictions.size;
        const cellsPerColumn = Math.ceil(Math.sqrt(cellCount));
        const cellSize = surfaceSize / cellsPerColumn;
        const offset = cellSize / 2;
        const symbolScale = Math.PI * offset * offset;

        const ctx = surface.select('canvas')
          .node()
          .getContext('2d');

        this.symbolGenerator.size(d => d * symbolScale * SYMBOL_SIZE_SCALE + SYMBOL_SIZE_MIN)
          .context(ctx);

        const colorScale = d3.scaleSequential(d3.interpolateWarm)
          .domain([0, cellCount]);

        ctx.strokeStyle = 'white';

        this.sortedKeys.forEach((key, index) => {
          const { probabilities } = this.predictions.get(key);
          const x = (index % cellsPerColumn) * cellSize + offset;
          const y = Math.floor(index / cellsPerColumn) * cellSize + offset;
          ctx.beginPath();
          ctx.setTransform(1, 0, 0, 1, x, y);
          ctx.fillStyle = colorScale(index);
          this.symbolGenerator(movingAverage(probabilities));
          ctx.stroke();
          ctx.fill();
        });

        ctx.font = `${LABEL_FONT_SIZE}px sans-serif`;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'gray';

        const labelLayoutStrategy = d3fc.layoutGreedy()
          .bounds({
            x: offset,
            y: offset,
            width: surfaceSize - 2 * offset,
            height: surfaceSize - 2 * offset
          });

        const locations = this.sortedKeys.map(
          (key, index) => {
            const { label, ranks } = this.predictions.get(key);
            if (movingAverage(ranks) >= 5) {
              return;
            }
            const labelWidth = ctx.measureText(label).width;
            const circle = {
              type: 'circle',
              x: (index % cellsPerColumn) * cellSize,
              y: Math.floor(index / cellsPerColumn) * cellSize,
              width: cellSize,
              height: cellSize,
              hidden: false
            };
            return [
              circle,
              {
                type: 'label',
                label,
                labelWidth,
                circle,
                x: (index % cellsPerColumn) * cellSize + offset,
                y: Math.floor(index / cellsPerColumn) * cellSize + offset,
                width: 2 * labelWidth,
                height: 2 * labelWidth,
                hidden: false
              }
            ];
          })
          .filter(x => x != null)
          .reduce((array, [circle, label]) => [circle, ...array, label], []);

          labelLayoutStrategy(locations)
          .filter(({ hidden }) => !hidden)
          .forEach(({ x, y}, index) => {
            const location = locations[index];
            if (location.type !== 'label') {
              return;
            }
            ctx.fillText(
              location.label, 
              x + location.labelWidth / 2, 
              y + location.labelWidth + LABEL_VERTICAL_OFFSET
            );
            ctx.beginPath()
            ctx.moveTo(
              location.circle.x + location.circle.width / 2, 
              location.circle.y + location.circle.height / 2
            );
            ctx.lineTo(
              x + location.width / 2 + compare(location.circle.x + location.circle.width / 2, x + location.width / 2) * 1.1 * (location.labelWidth / 2), 
              y + location.height / 2 + compare(location.circle.y + location.circle.height / 2, y + location.height / 2) * 1.5 * (LABEL_VERTICAL_OFFSET), 
            );
            ctx.stroke();
          })
      });
  }

  async handleFrame(frame) {
    const predictions = await classify(frame, 1000);

    predictions.forEach(({ className, probability }, index) => {
      let item = this.predictions.get(className);
      if (item == null) {
        item = {
          label: className.split(',')[0],
          probabilities: new Array(MOVING_AVERAGE_COUNT).fill(0),
          ranks: new Array(MOVING_AVERAGE_COUNT).fill(1000),
        };
        this.predictions.set(className, item);
      }
      rollLeft(item.ranks, index);
      rollLeft(item.probabilities, probability);
    });

    if (this.sortedKeys == null) {
      // TODO set domain x/y co-ords here
      this.sortedKeys = Array.from(this.predictions.keys())
        .sort((a, b) => a.localeCompare(b));
    }

    this.surface.requestRedraw();
  }

  render() {
    return (
      <React.Fragment>
        <div
          style={{ position: 'absolute', bottom: '1vw', right: '1vw', width: '20vw', height: '20vw' }} >
          <Webcam
            onFrame={frame => this.frame = this.handleFrame(frame)} />
        </div>
        <d3fc-canvas
          style={{ width: '100%', height: '100%' }}
          ref={surface => this.surface = surface}></d3fc-canvas>
      </React.Fragment >
    );
  }
}

export default MobileNetVisualisation;
