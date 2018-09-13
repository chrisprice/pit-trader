import React, { Component } from 'react';
import { classify } from './tensorflow/mobilenet';
import Webcam from './Webcam';
import * as d3 from 'd3';
import * as d3fc from 'd3fc';

class MobileNetVisualisation extends Component {

  constructor() {
    super();
    this.segmentDataJoin = d3fc.dataJoin('g', 'segment')
      .key(d => d.className);
    this.pieGenerator = d3.pie()
      .value(1);
    this.arcGenerator = d3.arc()
      .innerRadius(0);
  }

  componentDidMount() {
    const surface = d3.select(this.surface)
      .on('measure', () => {
        const { width, height } = d3.event.detail;
        surface.select('svg')
        .attr('viewBox', `${-width / 2} ${-height / 2} ${width} ${height}`);
        this.arcGenerator.outerRadius(width / 5);
      })
      .on('draw', () => {
        const { width, height } = d3.event.detail;
        const segment = this.segmentDataJoin(surface.select('svg'), this.data);

        segment.enter()
          .append('path');
        
        segment.select('path')
          .attr('d', this.arcGenerator);
          
        segment.enter()
          .append('text')
          .text(d => d.data.className.split(',')[0]);
        
        segment.select('text')
          .attr('transform', d => {
            const angleRad = d.startAngle + (d.endAngle - d.startAngle) / 2;
            const angleDeg = angleRad / 2 / Math.PI * 360;
            const offsetAngleDeg = angleDeg - 90;
            return `rotate(${offsetAngleDeg.toFixed(3)}) translate(${width / 4}, 0)`;
          });

      });
  }

  async drawPredictions(frame) {
    const predictions = await classify(frame, 1000);
    
    predictions.sort((a, b) => a.className.localeCompare(b.className)).splice(100, 900);

    console.log(predictions.filter((d, i) => i <=5).map(d => d.className).join(', '));

    this.data = this.pieGenerator(predictions);

    this.surface.requestRedraw();
  }

  render() {
    return (
      <React.Fragment>
        <div
          style={{ position: 'absolute', bottom: '1vw', right: '1vw', width: '20vw', height: '20vw' }} >
          <Webcam
            onFrame={frame => this.drawPredictions(frame)} />
        </div>
        <d3fc-svg
          style={{ width: '100%', height: '100%' }}
          ref={surface => this.surface = surface}></d3fc-svg>
      </React.Fragment >
    );
  }
}

export default MobileNetVisualisation;
