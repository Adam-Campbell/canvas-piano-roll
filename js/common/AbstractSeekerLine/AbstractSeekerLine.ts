import Konva from 'konva';
import Tone from 'tone';
import { 
    Colours,
    StaticMeasurements 
} from '../../Constants';

export default abstract class AbstractSeekerLine {
    
    protected conversionManager: any;
    layer: Konva.Layer;
    protected seekerLine: Konva.Line;
    protected isPlaying: boolean;
    protected animationFrameId: number;

    constructor(conversionManager: any, leftPanelWidth: number) {
        this.conversionManager = conversionManager;
        this.layer = new Konva.Layer({
            x: leftPanelWidth
        });
        this.isPlaying = Tone.Transport.state === 'started';
        this.animationFrameId = null;
    }

    init() {
        this.seekerLine = this.constructSeekerLine();
        this.layer.add(this.seekerLine);
        this.layer.batchDraw();
        if (this.isPlaying) {
            this.beginSyncing();
        }
        this.registerGlobalEventSubscriptions();
    }

    protected registerGlobalEventSubscriptions() : void {
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

    abstract calculateSeekerLineXPos() : number;

    protected constructSeekerLine() : Konva.Line {
        const currentPositionPx = this.calculateSeekerLineXPos();
        const seekerLine = new Konva.Line({
            points: [currentPositionPx, 0, currentPositionPx, this.conversionManager.stageHeight],
            stroke: Colours.grayscale[7],
            strokeWidth: 2
        });
        return seekerLine;
    }

    updateSeekerLinePosition() : void {
        const currentPositionPx = this.calculateSeekerLineXPos();
        this.seekerLine.points([
            currentPositionPx, 
            0, 
            currentPositionPx, 
            this.conversionManager.stageHeight
        ]);
        this.layer.batchDraw();
    }

    protected syncSeekerLineWithTransport = () => {
        this.updateSeekerLinePosition();
        this.animationFrameId = window.requestAnimationFrame(this.syncSeekerLineWithTransport);
    }

    protected beginSyncing() {
        this.isPlaying = true;
        this.syncSeekerLineWithTransport();
    }

    protected stopSyncing() {
        this.isPlaying = false;
        if (this.animationFrameId) {
            window.cancelAnimationFrame(this.animationFrameId);
        }
    }

    redrawOnResize() {
        this.updateSeekerLinePosition();
    }

}