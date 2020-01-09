import emitter from '../EventEmitter';
import {
    BAR_WIDTH,
    ROW_HEIGHT,
    VELOCITY_LAYER_HEIGHT,
    SEEKER_AREA_HEIGHT
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
    constructor(stageWidth, stageHeight, initialQuantize = '16n', initialNoteDuration = '16n', numBars = 4) {
        this._stageWidth = stageWidth;
        this._stageHeight = stageHeight;
        this._velocityAreaHeight = VELOCITY_LAYER_HEIGHT;
        this._quantize = initialQuantize;
        this._noteDuration = initialNoteDuration;
        //this._tickToPxRatio = BAR_WIDTH / TICKS_PER_BAR;
        this._tickToPxRatio = 0.25;
        this._numBars = numBars;
        this.unsubscribe1 = emitter.subscribe(QUANTIZE_VALUE_UPDATE, qVal => {
            this._quantize = qVal;
        });
        this.unsubscribe2 = emitter.subscribe(NOTE_DURATION_UPDATE, nVal => {
            this._noteDuration = nVal;
        });
    }

    roundDown(total, divisor) {
        return total - (total % divisor);
    }

    round(total, divisor) {
        return Math.round(total / divisor) * divisor;
    }

    convertDurationToPx(duration) {
        return noteDurationsMappedToTicks[duration] * this._tickToPxRatio;
    }

    convertTicksToPx(ticks) {
        return ticks * this._tickToPxRatio;
    }

    convertPxToTicks(px) {
        return px / this._tickToPxRatio;
    }

    get tickToPxRatio() {
        return this._tickToPxRatio;
    }

    set tickToPxRatio(ratio) {
        // legal ratios are 0.125, 0.25, 0.5 (default) and 1.
        this._tickToPxRatio = ratio;
    }

    get colWidth() {
        return this.convertDurationToPx(this._quantize);
    }

    get noteWidth() {
        return this.convertDurationToPx(this._noteDuration);
    }

    get barWidth() {
        return TICKS_PER_BAR * this.tickToPxRatio;
    }

    get rowHeight() {
        return ROW_HEIGHT;
    }

    get gridHeight() {
        return this.rowHeight * pitchesArray.length;
    }

    get gridWidth() {
        return this.numBars * this.barWidth;
    }

    get stageWidth() {
        return this._stageWidth;
    }

    set stageWidth(width) {
        this._stageWidth = width;
    }

    get stageHeight() {
        return this._stageHeight;
    }

    set stageHeight(height) {
        this._stageHeight = height;
    }

    get velocityAreaHeight() {
        return this._velocityAreaHeight;
    }

    set velocityAreaHeight(height) {
        this._velocityAreaHeight = height;
    }

    get seekerAreaHeight() {
        return SEEKER_AREA_HEIGHT;
    }

    get numBars() {
        return this._numBars;
    }

    roundDownToGridRow(y) {
        return this.roundDown(y, ROW_HEIGHT);
    }

    roundDownToGridCol(x) {
        return this.roundDown(x, this.colWidth);
    }

    roundToGridRow(y) {
        return this.round(y, ROW_HEIGHT);
    }

    roundToGridCol(x) {
        return this.round(x, this.colWidth);
    }
    
    derivePitchFromY(y) {
        const idx = y / ROW_HEIGHT;
        return pitchesArray[idx];
    }

    deriveYFromPitch(pitch) {
        const rowNumber = Math.max(
            pitchesArray.indexOf(pitch),
            0
        );
        return rowNumber * this.rowHeight
    }
}
