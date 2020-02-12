import Konva from 'konva';
import Tone from 'tone';
import { Colours } from '../../Constants';
import ConversionManager from '../ConversionManager';
import Section from '../../AudioEngine/Section';

export default class SeekerLineLayer {

    private conversionManager: ConversionManager;
    layer: Konva.Layer;
    private section: Section;
    private seekerLine: Konva.Line;
    private isPlaying: boolean;
    private animationFrameId: number;

    constructor(conversionManager: ConversionManager, sectionRef: Section) {
        this.conversionManager = conversionManager;
        this.layer = new Konva.Layer({ x: 120 });
        this.section = sectionRef;
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
        const sectionStartAsTicks = Tone.Ticks(this.section.start).toTicks();
        const relativePositionAsPx = this.conversionManager.convertTicksToPx(
            Tone.Transport.ticks - sectionStartAsTicks
        );
        const seekerLine = new Konva.Line({
            points: [ relativePositionAsPx, 0, relativePositionAsPx, this.conversionManager.gridHeight ],
            stroke: Colours.grayscale[7],
            strokeWidth: 2
        });
        return seekerLine;
    }

    updateSeekerLinePosition() : void {
        const sectionStartAsTicks = Tone.Ticks(this.section.start).toTicks();
        const relativePositionAsPx = this.conversionManager.convertTicksToPx(
            Tone.Transport.ticks - sectionStartAsTicks
        );
        this.seekerLine.points([
            relativePositionAsPx, 
            0, 
            relativePositionAsPx, 
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
