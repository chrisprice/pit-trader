import React from 'react';
import ReactWebcam from 'react-webcam'

class Webcam extends React.Component {

    componentDidMount() {
        this.scheduleAnimationFrame();
    }


    scheduleAnimationFrame() {
        this.animationFrame = requestAnimationFrame(() => {
            this.captureFrame();
            this.scheduleAnimationFrame();
        });
    }

    componentWillUnmount() {
        cancelAnimationFrame(this.animationFrame);
    }

    captureFrame() {
        if (!this.webcam.state.hasUserMedia || !this.webcam.video.videoHeight) {
            return
        }

        if (!this.ctx) {
            const { videoWidth, videoHeight } = this.webcam.video;

            const videoSize = Math.min(videoWidth, videoHeight);
            const canvasSize = this.props.screenshotWidth || videoSize;
            const scale = canvasSize / videoSize;
            const x = -0.5 * ((scale * videoWidth) - canvasSize);
            const y = -0.5 * ((scale * videoHeight) - canvasSize);

            this.canvas.width = canvasSize;
            this.canvas.height = canvasSize;

            this.ctx = this.canvas.getContext('2d');
            this.ctx.translate(canvasSize - x, y);
            this.ctx.scale(-scale, scale);
        }

        this.ctx.drawImage(this.webcam.video, 0, 0);
        this.props.onFrame(this.canvas);
    }

    render() {
        return (
            <div
                style={{
                    width: '100%',
                    paddingBottom: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    ...this.props.style
                }}>
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0
                    }}>
                    <canvas
                        ref={canvas => this.canvas = canvas}
                        style={{
                            position: 'absolute',
                            height: '100%',
                            width: '100%'
                        }}
                    />
                    <ReactWebcam
                        ref={webcam => this.webcam = webcam}
                        screenshotWidth={this.props.screenshotWidth}
                        style={{
                            objectFit: 'cover',
                            transform: 'rotateY(180deg)',
                            height: '100%',
                            width: '100%',
                            visibility: this.props.showCanvas ? 'hidden' : 'visible'
                        }}
                    />
                </div>
            </div>
        );
    }
}

Webcam.defaultProps = {
    onFrame: () => {},
    style: {}
};

export default Webcam;