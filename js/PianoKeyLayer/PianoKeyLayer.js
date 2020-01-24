import Tone from 'tone';
import { Rect, Group } from 'konva';
import { pitchesArray } from '../pitches';
import {
    staticKeyProps,
    getKeyProps,
    sortByColor
} from './pianoKeyUtils';
import colours from '../colours';

export default class PianoKeyLayer {

    constructor(conversionManager, layerRef) {
        this._conversionManager = conversionManager
        this.layer = layerRef;
        this._layerGroup = new Group();
        this._pianoKeyGroup = new Group({ y: 30 });
        this._background = this._constructBackground();
        this._instrument = new Tone.PolySynth(12, Tone.Synth).toMaster();
        this._instrument.set({
            envelope: {
                sustain: 0.9,
                release: 0.1
            },
            oscillator: {
                volume: -22,
                type: 'amsawtooth'
            }
        });  
    }

    init() {
        this._background.moveTo(this._layerGroup);
        this._drawPianoKeys();
        this.layer.add(this._layerGroup);
        this.layer.batchDraw();
        this._registerGroupEventSubscriptions();
    }

    _registerGroupEventSubscriptions() {
        this._pianoKeyGroup.on('mousedown', e => {
            e.cancelBubble = true;
            this._activateKey(e.target);
        });
        this._pianoKeyGroup.on('mouseup', e => {
            e.cancelBubble = true;
            this._deactivateKey(e.target);
        });
        this._pianoKeyGroup.on('mouseout', e => {
            e.cancelBubble = true;
            this._deactivateKey(e.target);
        });
        this._pianoKeyGroup.on('touchstart', e => {
            e.cancelBubble = true;
            this._activateKey(e.target);
        });
        this._pianoKeyGroup.on('touchend', e => {
            e.cancelBubble = true;
            this._deactivateKey(e.target);
        });
    }

    updateY(y) {
        this._pianoKeyGroup.y(y);
        this.layer.batchDraw();
    }

    redrawOnVerticalResize() {
        this._background.height(
            this._conversionManager.stageHeight
        );
        this.layer.batchDraw();
    }

    _addActiveAppearance(pianoKeyElement) {
        pianoKeyElement.fill(colours.secondary.lightened);
        this.layer.batchDraw();
    }

    _removeActiveAppearance(pianoKeyElement) {
        pianoKeyElement.fill(
            pianoKeyElement.attrs.originalFill
        );
        this.layer.batchDraw();
    }

    _activateKey(pianoKeyElement) {
        const { pitch } = pianoKeyElement.attrs;
        this._addActiveAppearance(pianoKeyElement);
        this._instrument.triggerAttack(pitch.full);
    }

    _deactivateKey(pianoKeyElement) {
        const { pitch } = pianoKeyElement.attrs;
        this._removeActiveAppearance(pianoKeyElement);
        this._instrument.triggerRelease(pitch.full);
    }

    _drawPianoKeys() {
        pitchesArray
        .map(getKeyProps)
        .sort(sortByColor)
        .forEach(keyProps => {
            const pianoKey = new Rect({ ...keyProps });
            pianoKey.moveTo(this._pianoKeyGroup);
        });
        this._pianoKeyGroup.moveTo(this._layerGroup);
    }

    _constructBackground() {
        const background = new Rect({
            x: 0,
            y: 0,
            height: this._conversionManager.stageHeight,
            width: 120,
            fill: colours.grayscale[7],
            id: 'BACKGROUND'
        });
        return background;
    }
    
}
