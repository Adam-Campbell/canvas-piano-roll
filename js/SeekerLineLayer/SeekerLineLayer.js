import { Layer, Line } from 'konva';
import Tone from 'tone';

export default class SeekerLineLayer {

    constructor(conversionManager) {
        this._conversionManager = conversionManager;
        this.layer = new Layer({ x: 120 });
        this._seekerLine = this._constructSeekerLine();
        this._isPlaying = Tone.Transport.state === 'started';
        this.syncSeekerLineWithTransport = this._syncSeekerLineWithTransport.bind(this);
        this._animationFrameId = null;

        Tone.Transport.on('start', () => {
            console.log('transport was started');
            this._beginSyncing();
        });
        Tone.Transport.on('stop', () => {
            console.log('transport was stopped');
            this._stopSyncing();
            this.updateSeekerLinePosition();
        });
        Tone.Transport.on('pause', () => {
            console.log('transport was paused');
            this._stopSyncing();
        });

        if (this._isPlaying) {
            this._beginSyncing();
        }

    }

    draw() {
        this.layer.add(this._seekerLine);
        this.layer.batchDraw();
    }

    updateX(x) {
        this.layer.x(x);
        this.layer.batchDraw();
    }

    redrawOnZoomAdjustment() {
        this.updateSeekerLinePosition();
        this.layer.batchDraw();
    }

    _constructSeekerLine() {
        const currentPositionPx = this._conversionManager.convertTicksToPx(Tone.Transport.ticks);
        const seekerLine = new Line({
            points: [currentPositionPx, 0, currentPositionPx, this._conversionManager.gridHeight],
            stroke: '#222',
            strokeWidth: 2
        });
        return seekerLine;
    }

    updateSeekerLinePosition() {
        const currentPositionPx = this._conversionManager.convertTicksToPx(Tone.Transport.ticks);
        this._seekerLine.points([
            currentPositionPx, 
            0, 
            currentPositionPx, 
            this._conversionManager.gridHeight
        ]);
        this.layer.batchDraw();
    }

    _syncSeekerLineWithTransport() {
        this.updateSeekerLinePosition();
        this._animationFrameId = window.requestAnimationFrame(this.syncSeekerLineWithTransport)
    }

    _beginSyncing() {
        this._isPlaying = true;
        this._animationFrameId = this.syncSeekerLineWithTransport();
    }

    _stopSyncing() {
        this._isPlaying = false;
        if (this._animationFrameId) {
            window.cancelAnimationFrame(this._animationFrameId);
        }
    }

}