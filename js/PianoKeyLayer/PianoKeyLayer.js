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
        this.layer.on('mousedown', e => {
            e.cancelBubble = true;
            const { target } = e;
            if (target instanceof Rect && target.attrs.pitch) {
                console.log(`${target.attrs.pitch} key clicked`);
            } 
        });
    }

    updateY(y) {
        this.layer.y(y);
        this.layer.batchDraw();
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
