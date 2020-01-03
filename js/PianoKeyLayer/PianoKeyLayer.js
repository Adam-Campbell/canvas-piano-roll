import Tone from 'tone';
import { Rect, Layer } from 'konva';
import { pitchesArray } from '../pitches';
import { ROW_HEIGHT } from '../constants';
import {
    staticKeyProps,
    getKeyProps,
    sortByColor
} from './utils';

export default class PianoKeyLayer {
    constructor() {
        this.layer = new Layer();
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
        this.layer.on('mousedown', e => {
            e.cancelBubble = true;
            this._activateKey(e.target);
        });
        this.layer.on('mouseup', e => {
            e.cancelBubble = true;
            this._deactivateKey(e.target);
        });
        this.layer.on('mouseout', e => {
            e.cancelBubble = true;
            this._deactivateKey(e.target);
        });
    }

    updateY(y) {
        this.layer.y(y);
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
        this._instrument.triggerAttack(pitch);
    }

    _deactivateKey(pianoKeyElement) {
        const { pitch } = pianoKeyElement.attrs;
        this._removeActiveAppearance(pianoKeyElement);
        this._instrument.triggerRelease(pitch);
    }

    draw() {
        this.layer.removeChildren();
        pitchesArray
        .map(getKeyProps)
        .sort(sortByColor)
        .forEach(keyProps => {
            const pianoKey = new Rect({ ...keyProps });
            this.layer.add(pianoKey);
        });
        this.layer.draw();
    }
}
