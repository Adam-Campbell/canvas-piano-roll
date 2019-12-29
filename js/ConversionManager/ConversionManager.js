import emitter from '../EventEmitter';
import {
    BAR_WIDTH,
    ROW_HEIGHT
} from '../constants';
import {
    QUANTIZE_VALUE_UPDATE,
    NOTE_DURATION_UPDATE
} from '../events';
import { pitchesArray } from '../pitches';

const TICKS_PER_BAR = 768;

const noteDurationsMappedToTicks = {
    '32t': 16,
    '32n': 24,
    '16t': 32,
    '16n': 48,
    '8t': 64,
    '8n': 96,
    '4t': 128,
    '4n': 192,
    '2t': 256,
    '2n': 384,
    '1m': 768
};

export default class ConversionManager {
    constructor(initialQuantize = '16n', initialNoteDuration = '16n') {
        this._quantize = initialQuantize;
        this._noteDuration = initialNoteDuration;
        this._tickToPxRatio = BAR_WIDTH / TICKS_PER_BAR;
        this.unsubscribe1 = emitter.subscribe(QUANTIZE_VALUE_UPDATE, qVal => {
            this._quantize = qVal;
        });
        this.unsubscribe2 = emitter.subscribe(NOTE_DURATION_UPDATE, nVal => {
            this._noteDuration = nVal;
        });
    }

    _roundDown(total, divisor) {
        return total - (total % divisor);
    }

    _round(total, divisor) {
        return Math.round(total / divisor) * divisor;
    }

    _durationToPx(duration) {
        return noteDurationsMappedToTicks[duration] * this._tickToPxRatio;
    }

    get colWidth() {
        return this._durationToPx(this._quantize);
    }

    get noteWidth() {
        return this._durationToPx(this._noteDuration);
    }

    get rowHeight() {
        return ROW_HEIGHT;
    }

    get gridHeight() {
        return this.rowHeight * pitchesArray.length;
    }

    roundDownToGridRow(y) {
        return this._roundDown(y, ROW_HEIGHT);
    }

    roundDownToGridCol(x) {
        return this._roundDown(x, this.colWidth);
    }

    roundToGridRow(y) {
        return this._round(y, ROW_HEIGHT);
    }

    roundToGridCol(x) {
        return this._round(x, this.colWidth);
    }

    convertPxToTicks(px) {
        return px / this._tickToPxRatio;
    }
    
    derivePitchFromY(y) {
        const idx = y / ROW_HEIGHT;
        return pitchesArray[idx];
    }
}
