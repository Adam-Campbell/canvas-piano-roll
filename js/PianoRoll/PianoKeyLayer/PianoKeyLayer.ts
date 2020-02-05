import Tone from 'tone';
import Konva from 'konva';
import { pitchesArray } from '../../pitches';
import {
    staticKeyProps,
    getKeyProps,
    sortByColor
} from './pianoKeyUtils';
import { Colours, StaticMeasurements } from '../../Constants';
import ConversionManager from '../ConversionManager';

export default class PianoKeyLayer {

    private conversionManager: ConversionManager;
    private layer: Konva.Layer;
    private layerGroup: Konva.Group;
    private pianoKeyGroup: Konva.Group;
    private background: Konva.Rect;
    private instrument;

    constructor(conversionManager: ConversionManager, layerRef: Konva.Layer, instrument: any) {
        this.conversionManager = conversionManager;
        this.layer = layerRef;
        this.layerGroup = new Konva.Group();
        this.pianoKeyGroup = new Konva.Group({ y: StaticMeasurements.seekerAreaHeight });
        this.background = this.constructBackground();
        this.instrument = instrument;
        // this.instrument.set({
        //     envelope: {
        //         sustain: 0.9,
        //         release: 0.1
        //     },
        //     oscillator: {
        //         volume: -22,
        //         type: 'amsawtooth'
        //     }
        // });  
    }

    init() : void {
        this.background.moveTo(this.layerGroup);
        this.drawPianoKeys();
        this.layer.add(this.layerGroup);
        this.layer.batchDraw();
        this.registerGroupEventSubscriptions();
    }

    private registerGroupEventSubscriptions() : void {
        this.pianoKeyGroup.on('mousedown', e => {
            e.cancelBubble = true;
            this.activateKey(e.target);
        });
        this.pianoKeyGroup.on('mouseup', e => {
            e.cancelBubble = true;
            this.deactivateKey(e.target);
        });
        this.pianoKeyGroup.on('mouseout', e => {
            e.cancelBubble = true;
            this.deactivateKey(e.target);
        });
        this.pianoKeyGroup.on('touchstart', e => {
            e.cancelBubble = true;
            this.activateKey(e.target);
        });
        this.pianoKeyGroup.on('touchend', e => {
            e.cancelBubble = true;
            this.deactivateKey(e.target);
        });
    }

    updateY(y: number) : void {
        this.pianoKeyGroup.y(y);
        this.layer.batchDraw();
    }

    redrawOnVerticalResize() : void {
        this.background.height(
            this.conversionManager.stageHeight
        );
        this.layer.batchDraw();
    }

    private addActiveAppearance(pianoKeyElement: Konva.Rect) : void {
        pianoKeyElement.fill(Colours.secondary.lightened);
        this.layer.batchDraw();
    }

    private removeActiveAppearance(pianoKeyElement: Konva.Rect) : void {
        pianoKeyElement.fill(
            pianoKeyElement.attrs.originalFill
        );
        this.layer.batchDraw();
    }

    private activateKey(pianoKeyElement: Konva.Rect) : void {
        const { pitch } = pianoKeyElement.attrs;
        this.addActiveAppearance(pianoKeyElement);
        this.instrument.triggerAttack(pitch.full);
    }

    private deactivateKey(pianoKeyElement: Konva.Rect) : void {
        const { pitch } = pianoKeyElement.attrs;
        this.removeActiveAppearance(pianoKeyElement);
        this.instrument.triggerRelease(pitch.full);
    }

    private drawPianoKeys() : void {
        pitchesArray
        .map(getKeyProps)
        .sort(sortByColor)
        .forEach(keyProps => {
            const pianoKey = new Konva.Rect({ ...keyProps });
            pianoKey.moveTo(this.pianoKeyGroup);
        });
        this.pianoKeyGroup.moveTo(this.layerGroup);
    }

    private constructBackground() : Konva.Rect {
        const background = new Konva.Rect({
            x: 0,
            y: 0,
            height: this.conversionManager.stageHeight,
            width: 120,
            fill: Colours.grayscale[7],
            id: 'BACKGROUND'
        });
        return background;
    }
    
}
