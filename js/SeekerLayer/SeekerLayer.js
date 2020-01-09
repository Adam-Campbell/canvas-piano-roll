import { Layer, Rect, Line, Text } from 'konva';
import Tone from 'tone';

export default class SeekerLayer {

    constructor(conversionManager) {
        this.layer = new Layer({ x: 120 });
        this._conversionManager = conversionManager;
        this._background = this._constructBackground();
        this._border = this._constructBorder();
        this._numberMarkersArray = this._constructNumberMarkersArray();
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
        this.layer.add(this._background);
        this.layer.add(this._border);
        this._numberMarkersArray.forEach(numberMarker => this.layer.add(numberMarker));
        this.layer.add(this._seekerLine);
        this.layer.batchDraw();
    }

    redrawOnZoomAdjustment() {
        this._background.width(this._conversionManager.gridWidth);
        this._border.width(this._conversionManager.gridWidth);
        this._numberMarkersArray.forEach((numberMarker, idx) => {
            numberMarker.x(idx * this._conversionManager.barWidth);
        });
        this.updateSeekerLinePosition();
        this.layer.batchDraw();
    }

    updateX(x) {
        this.layer.x(x);
        this.layer.batchDraw();
    }

    _constructBackground() {
        const background = new Rect({
            x: 0,
            y: 0,
            height: 30,
            width: this._conversionManager.gridWidth,
            fill: '#acacac'
        });
        return background;
    }

    _constructBorder() {
        const border = new Rect({
            x: 0,
            y: 27,
            width: this._conversionManager.gridWidth,
            height: 3,
            fill: '#222'
        });
        return border;
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

    _constructNumberMarkersArray() {
        let numberMarkersArray = [];
        for (let i = 0; i < this._conversionManager.numBars; i++) {
            numberMarkersArray.push(new Text({
                text: `${i+1}`,
                fill: '#222',
                x: i * this._conversionManager.barWidth,
                y: 12
            }));
        }
        return numberMarkersArray;
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