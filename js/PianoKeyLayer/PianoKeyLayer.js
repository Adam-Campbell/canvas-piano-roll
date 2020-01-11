import Tone from 'tone';
import { Rect, Layer } from 'konva';
import { pitchesArray } from '../pitches';
import { ROW_HEIGHT } from '../constants';
import {
    staticKeyProps,
    getKeyProps,
    sortByColor
} from './utils';


/*

Touch bugs:

- Because there is no touch equivalent to mouseout, if you activate a key with touchstart and then
move the touch away from that key before touchend then the key will not be deactivated (you would then 
have to trigger another touchstart and ensure the touchend occurs over the relevant key). To fix this
either recreate the mouseout functionality using the touch events, or figure out a different way to manage
the keys when using touch (must not affect the way they work when using mouse).


*/

export default class PianoKeyLayer {
    constructor() {
        this.layer = new Layer({ y: 30 });
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
        this.layer.on('touchstart', e => {
            e.cancelBubble = true;
            //alert('touchstart')
            //const a = Object.values(e).toString;
            //alert(e.evt.touches[0].clientX);
            //console.log(e.target);
            this._activateKey(e.target);
        });
        this.layer.on('touchend', e => {
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
        this._instrument.triggerAttack(pitch.full);
    }

    _deactivateKey(pianoKeyElement) {
        const { pitch } = pianoKeyElement.attrs;
        this._removeActiveAppearance(pianoKeyElement);
        this._instrument.triggerRelease(pitch.full);
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
