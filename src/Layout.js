import React from 'react';
import { withRouter } from 'react-router-dom';

const Layout = ({ title, children, history }) =>
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        opacity: 1
    }}>
        <div style={{
            background: 'white',
            margin: '2vh 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            height: '10vh',
            flexGrow: 0,
            flexShrink: 0
        }}
            onClick={() => history.push('/mobilenet')}>
            {title}
        </div>
        {children}
    </div>;

export default withRouter(Layout);
