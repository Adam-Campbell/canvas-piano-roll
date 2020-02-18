import Konva from 'konva';
import { pitchesArray } from '../../pitches';
import {
    staticKeyProps,
    getKeyProps,
    sortByColor
} from './pianoKeyUtils';
import { Colours, StaticMeasurements } from '../../Constants';
import PianoRollConversionManager from '../PianoRollConversionManager';

export default class PianoKeys {

    private conversionManager: PianoRollConversionManager;
    private layer: Konva.Layer;
    private layerGroup: Konva.Group;
    private pianoKeyGroup: Konva.Group;
    private background: Konva.Rect;
    private instrument: any;

    constructor(
        conversionManager: PianoRollConversionManager, 
        layerRef: Konva.Layer, 
        instrument: any
    ) {
        this.conversionManager = conversionManager;
        this.layer = layerRef;
        this.layerGroup = new Konva.Group();
        this.pianoKeyGroup = new Konva.Group({ y: StaticMeasurements.seekerAreaHeight });
        this.background = this.constructBackground();
        this.instrument = instrument;
    }

    /**
     * Initializes the piano keys and sets up the necessary subscriptions.
     */
    init() : void {
        this.background.moveTo(this.layerGroup);
        this.drawPianoKeys();
        this.layer.add(this.layerGroup);
        this.layer.batchDraw();
        this.registerGroupEventSubscriptions();
    }

    /**
     * Sets up subscriptions to events caught by the Group that contains the piano keys. 
     */
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

    /**
     * Adjusts the position of the piano keys along the y axis according to the y value supplied.
     */
    updateY(y: number) : void {
        this.pianoKeyGroup.y(y);
        this.layer.batchDraw();
    }

    /**
     * Redraws the layer. Used by the parent stage whenever its size updates in order to redraw this
     * layer. 
     */
    redrawOnResize() : void {
        this.background.height(
            this.conversionManager.stageHeight
        );
        this.layer.batchDraw();
    }

    /**
     * Adds an active appearance to the given piano key.
     */
    private addActiveAppearance(pianoKeyElement: Konva.Rect) : void {
        pianoKeyElement.fill(Colours.secondary.lightened);
        this.layer.batchDraw();
    }

    /**
     * Removes the active appearance from the given piano key.
     */
    private removeActiveAppearance(pianoKeyElement: Konva.Rect) : void {
        pianoKeyElement.fill(
            pianoKeyElement.attrs.originalFill
        );
        this.layer.batchDraw();
    }

    /**
     * Adds the active appearance to the piano key and triggers the corresponding note on the
     * owned instrument instance. 
     */
    private activateKey(pianoKeyElement: Konva.Rect) : void {
        const { pitch } = pianoKeyElement.attrs;
        this.addActiveAppearance(pianoKeyElement);
        this.instrument.triggerAttack(pitch.full);
    }

    /**
     * Removes the active appearance from the piano key and releases the corresponding note on the
     * owned instrument instance. 
     */
    private deactivateKey(pianoKeyElement: Konva.Rect) : void {
        const { pitch } = pianoKeyElement.attrs;
        this.removeActiveAppearance(pianoKeyElement);
        this.instrument.triggerRelease(pitch.full);
    }

    /**
     * Constructs the piano keys and adds them to the layer. 
     */
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

    /**
     * Constructs and returns the background that sits behind the piano keys.
     */
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
