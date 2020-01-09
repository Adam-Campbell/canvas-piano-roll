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
        //this._animationFrameId = this.syncSeekerLineWithTransport();
        this._animationFrameId = null;
        
        Tone.Transport.on('start', () => {
            console.log('transport was started');
            this._beginSyncing();
        });
        Tone.Transport.on('stop', () => {
            console.log('transport was stopped');
            this._stopSyncing();
            this._updateSeekerLinePosition();
        });
        Tone.Transport.on('pause', () => {
            console.log('transport was paused');
            this._stopSyncing();
        });

        this.layer.on('mousedown', e => this._handleMouseDown(e));

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
        const seekerLine = new Line({
            points: [0, 0, 0, this._conversionManager.gridHeight],
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

    _updateSeekerLinePosition() {
        const positionAsTicks = Tone.Ticks(Tone.Transport.position).toTicks();
        const positionAsPx = positionAsTicks * this._conversionManager.tickToPxRatio;
        console.log(positionAsTicks);
        this._seekerLine.points([
            positionAsPx, 
            0, 
            positionAsPx, 
            this._conversionManager.gridHeight
        ]);
        this.layer.batchDraw();
    }

    _syncSeekerLineWithTransport() {
        this._updateSeekerLinePosition();
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

    // I will likely move this logic into the PianoRoll class. I also need to replicate it 
    // for touch events. 
    _handleMouseDown(e) {
        e.cancelBubble = true;
        //console.log('mousedown occured on seeker layer');
        const { offsetX, offsetY } = e.evt;
        if (offsetY <= 30) {
            const xWithScroll = offsetX - this.layer.x();
            const roundedX = this._conversionManager.roundDownToGridCol(xWithScroll);
            const positionAsTicks = this._conversionManager.convertPxToTicks(roundedX);
            const positionAsBBS = Tone.Ticks(positionAsTicks).toBarsBeatsSixteenths();
            Tone.Transport.position = positionAsBBS;
            this._updateSeekerLinePosition();
        }
    }


}