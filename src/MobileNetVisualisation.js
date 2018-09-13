import React, { Component } from 'react';
import { classify } from './tensorflow/mobilenet';
import Webcam from './Webcam';
import * as d3 from 'd3';
import * as d3fc from 'd3fc';
import { sleep } from './util';

const SYMBOL_SCALE = 10;
const COLUMN_COUNT = 40;

class MobileNetVisualisation extends Component {

  constructor() {
    super();
    this.dataJoin = d3fc.dataJoin('g')
      .key(d => d.className);
    this.symbolGenerator = d3.symbol();
  }

  componentDidMount() {
    const surface = d3.select(this.surface)
      .on('measure', () => {
        const { width, height } = d3.event.detail;
        surface.select('svg')
          // .attr('viewBox', `${-width / 2} ${-height / 2} ${width} ${height}`);
        const size = Math.min(width, height);
        this.symbolGenerator.size(d => 1 + d.probability * size * SYMBOL_SCALE);
      })
      .on('draw', () => {
        const { width, height } = d3.event.detail;
        const segment = this.dataJoin(surface.select('svg'), this.data);

        const size = Math.min(width, height) / COLUMN_COUNT;
        const offset = size / 2;
        segment.attr('transform', (d, i) => {
            const x = (i % COLUMN_COUNT) * size + offset;
            const y = Math.floor(i / COLUMN_COUNT) * size + offset;
            return `translate(${x.toFixed(3)}, ${y.toFixed(3)})`;
          });

        segment.enter()
          .append('path');
        
        segment.select('path')
          .attr('d', this.symbolGenerator);
          
        // segment.enter()
        //   .append('text')
        //   .text(d => d.className.split(',')[0]);
      });
      this.interval = setInterval(() => this.drawPredictions(), 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  async drawPredictions() {
    if (this.frame == null) {
      return;
    }

    const predictions = await classify(this.frame, 1000);
    
    predictions.sort((a, b) => a.className.localeCompare(b.className));

    // console.log(predictions.filter((d, i) => i <=5).map(d => d.className).join(', '));

    this.data = predictions; //this.pieGenerator(predictions);

    this.surface.requestRedraw();

    await sleep(3000);
  }

  render() {
    return (
      <React.Fragment>
        <div
          style={{ position: 'absolute', bottom: '1vw', right: '1vw', width: '20vw', height: '20vw' }} >
          <Webcam
            onFrame={frame => this.frame = frame} />
        </div>
        <d3fc-svg
          style={{ width: '100%', height: '100%' }}
          ref={surface => this.surface = surface}></d3fc-svg>
      </React.Fragment >
    );
  }
}

export default MobileNetVisualisation;
