import React from 'react';
import LeftHandPalmFacing from './LeftHandPalmFacing';

export default ({ width, height }) =>
    <svg viewBox="0 0 75 75" width={width} height={height}>
        <g transform="scale(-1, 1) translate(-75, 0)">
            <LeftHandPalmFacing width="75" height="75" />
        </g>
    </svg>;