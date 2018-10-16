import React from 'react';
import RightHandPalmAway from './RightHandPalmAway';
import LeftHandPalmAway from './LeftHandPalmAway';
import './index.css';

export default () =>
    <svg className="hands" viewBox="0 0 100 75">
        <g transform="translate(-15, 10) rotate(20, 38, 38)">
            <RightHandPalmAway width="75" height="75" />
        </g>
        <g transform="translate(40, 10) rotate(-20, 38, 38)">
            <LeftHandPalmAway width="75" height="75" />
        </g>
    </svg>