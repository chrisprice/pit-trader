import React from 'react';
import LeftHandPalmFacing from './LeftHandPalmFacing';
import RightHandPalmFacing from './RightHandPalmFacing';
import './index.css';

export default () =>
    <svg className="hands" viewBox="0 0 100 75">
        <g transform="translate(-15, 10) rotate(20, 38, 38)">
            <RightHandPalmFacing width="75" height="75" />
        </g>
        <g transform="translate(40, 10) rotate(-20, 38, 38)">
            <LeftHandPalmFacing width="75" height="75" />
        </g>
    </svg>