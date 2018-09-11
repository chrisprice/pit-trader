import React from 'react';
import ReactWebcam from 'react-webcam'

export default class SquareWebcam extends ReactWebcam {
    getCanvas() {
        if (!this.state.hasUserMedia || !this.video.videoHeight) return null;
        
        if (!this.ctx) {
            const { videoWidth, videoHeight } = this.video;
            
            const videoSize = Math.min(videoWidth, videoHeight);
            const canvasSize = this.props.screenshotWidth || videoSize;
            const scale = canvasSize / videoSize;
            const x = -0.5 * ((scale * videoWidth) - canvasSize);
            const y = -0.5 * ((scale * videoHeight) - canvasSize);
            
            const canvas = document.createElement('canvas');
            canvas.width = canvasSize;
            canvas.height = canvasSize;
            this.canvas = canvas;
            
            this.ctx = canvas.getContext('2d');
            this.ctx.translate(canvasSize - x, y);
            this.ctx.scale(-scale, scale);
        }

        const { canvas, ctx, video } = this;
        ctx.drawImage(video, 0, 0);

        return canvas;
    }
}