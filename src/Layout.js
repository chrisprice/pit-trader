import React from 'react';

export default ({ title, children }) =>
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100vw',
        height: '100vh',
        opacity: 0.8
    }}>
        <div style={{
            background: 'white',
            margin: '2vh 0',
            display: 'flex',
            alignItems: 'center',
            fontFamily: 'monospaced'
        }}>
            {title}
        </div>
        {children}
    </div>