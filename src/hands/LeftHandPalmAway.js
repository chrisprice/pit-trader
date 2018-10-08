import React from 'react';
import RightHandPalmAway from './RightHandPalmAway';

export default ({ width, height }) =>
    <svg viewBox="0 0 75 75" width={width} height={height}>
        <g transform="scale(-1, 1) translate(-75, 0)">
            <RightHandPalmAway width="75" height="75" />
        </g>
    </svg>;