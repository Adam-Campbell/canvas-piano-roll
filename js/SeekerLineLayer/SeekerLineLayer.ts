import Konva from 'konva';
import Tone from 'tone';
import { Colours } from '../Constants';
import ConversionManager from '../ConversionManager';

export default class SeekerLineLayer {

    private conversionManager: ConversionManager;
    private layer: Konva.Layer;
    private seekerLine: Konva.Line;
    private isPlaying: boolean;
    private animationFrameId: number;

    constructor(conversionManager: ConversionManager) {
        this.conversionManager = conversionManager;
        this.layer = new Konva.Layer({ x: 120 });
        this.seekerLine = this.constructSeekerLine();
        this.isPlaying = Tone.Transport.state === 'started';
        this.animationFrameId = null;
    }

    init() {
        this.layer.add(this.seekerLine);
        this.layer.batchDraw();
        if (this.isPlaying) {
            this.beginSyncing();
        }
        this.registerGlobalEventSubscriptions();
    }

    private registerGlobalEventSubscriptions() : void {
        Tone.Transport.on('start', () => {
            console.log('transport was started');
            this.beginSyncing();
        });
        Tone.Transport.on('stop', () => {
            console.log('transport was stopped');
            this.stopSyncing();
            this.updateSeekerLinePosition();
        });
        Tone.Transport.on('pause', () => {
            console.log('transport was paused');
            this.stopSyncing();
        });
    }

    updateX(x) : void {
        this.layer.x(x);
        this.layer.batchDraw();
    }

    redrawOnZoomAdjustment() : void {
        this.updateSeekerLinePosition();
        this.layer.batchDraw();
    }

    private constructSeekerLine() : Konva.Line {
        const currentPositionPx = this.conversionManager.convertTicksToPx(Tone.Transport.ticks);
        const seekerLine = new Konva.Line({
            points: [currentPositionPx, 0, currentPositionPx, this.conversionManager.gridHeight],
            stroke: Colours.grayscale[7],
            strokeWidth: 2
        });
        return seekerLine;
    }

    updateSeekerLinePosition() : void {
        const currentPositionPx = this.conversionManager.convertTicksToPx(Tone.Transport.ticks);
        this.seekerLine.points([
            currentPositionPx, 
            0, 
            currentPositionPx, 
            this.conversionManager.gridHeight
        ]);
        this.layer.batchDraw();
    }

    private syncSeekerLineWithTransport = () => {
        this.updateSeekerLinePosition();
        this.animationFrameId = window.requestAnimationFrame(this.syncSeekerLineWithTransport);
    }

    private beginSyncing() {
        this.isPlaying = true;
        this.syncSeekerLineWithTransport();
    }

    private stopSyncing() {
        this.isPlaying = false;
        if (this.animationFrameId) {
            window.cancelAnimationFrame(this.animationFrameId);
        }
    }

}
