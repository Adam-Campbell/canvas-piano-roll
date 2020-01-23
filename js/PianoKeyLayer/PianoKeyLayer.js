import Tone from 'tone';
import { Rect, Group } from 'konva';
import { pitchesArray } from '../pitches';
import {
    staticKeyProps,
    getKeyProps,
    sortByColor
} from './pianoKeyUtils';

export default class PianoKeyLayer {

    constructor(layerRef) {
        this.layer = layerRef;
        this._layerGroup = new Group({ y: 30 });
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
        this._layerGroup.on('mousedown', e => {
            e.cancelBubble = true;
            this._activateKey(e.target);
        });
        this._layerGroup.on('mouseup', e => {
            e.cancelBubble = true;
            this._deactivateKey(e.target);
        });
        this._layerGroup.on('mouseout', e => {
            e.cancelBubble = true;
            this._deactivateKey(e.target);
        });
        this._layerGroup.on('touchstart', e => {
            e.cancelBubble = true;
            this._activateKey(e.target);
        });
        this._layerGroup.on('touchend', e => {
            e.cancelBubble = true;
            this._deactivateKey(e.target);
        });
    }

    updateY(y) {
        this._layerGroup.y(y);
        this.layer.batchDraw();
    }

    _addActiveAppearance(pianoKeyElement) {
        pianoKeyElement.fill('blue');
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

    draw() {
        this._layerGroup.removeChildren();
        pitchesArray
        .map(getKeyProps)
        .sort(sortByColor)
        .forEach(keyProps => {
            const pianoKey = new Rect({ ...keyProps });
            pianoKey.moveTo(this._layerGroup);
        });
        this.layer.add(this._layerGroup);
        this.layer.batchDraw();
    }
    
}
