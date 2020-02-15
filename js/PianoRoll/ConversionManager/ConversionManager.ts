import EventEmitter from '../../EventEmitter';
import {
    StaticMeasurements,
    Events
} from '../../Constants';
import { pitchesArray } from '../../pitches';

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

    private _stageWidth: number;
    private _stageHeight: number;
    private _velocityAreaHeight: number;
    private _quantize: string;
    private _noteDuration: string;
    private _tickToPxRatio: number;
    private _numBars: number;
    private emitter: EventEmitter;
    
    constructor(
        stageWidth: number, 
        stageHeight: number,
        eventEmitter: EventEmitter,
        initialQuantize = '16n', 
        initialNoteDuration = '16n', 
        numBars = 4
    ) {
        this._stageWidth = stageWidth;
        this._stageHeight = stageHeight;
        this._velocityAreaHeight = StaticMeasurements.velocityLayerHeight;
        this._quantize = initialQuantize;
        this._noteDuration = initialNoteDuration;
        this._tickToPxRatio = 0.25;
        this._numBars = numBars;
        this.emitter = eventEmitter;
        this.emitter.subscribe(Events.quantizeValueUpdate, qVal => {
            this._quantize = qVal;
        });
        this.emitter.subscribe(Events.noteDurationUpdate, nVal => {
            this._noteDuration = nVal;
        });
    }

    roundDown(total: number, divisor: number) : number {
        return total - (total % divisor);
    }

    round(total: number, divisor : number) : number {
        return Math.round(total / divisor) * divisor;
    }

    convertDurationToPx(duration: string) : number {
        return noteDurationsMappedToTicks[duration] * this.tickToPxRatio;
    }

    convertTicksToPx(ticks: number) : number {
        return ticks * this.tickToPxRatio;
    }

    convertPxToTicks(px: number) : number {
        return px / this.tickToPxRatio;
    }

    get tickToPxRatio() : number {
        return this._tickToPxRatio;
    }

    set tickToPxRatio(ratio: number) {
        // legal ratios are 0.125, 0.25, 0.5 (default) and 1.
        this._tickToPxRatio = ratio;
    }

    get colWidth() : number {
        return this.convertDurationToPx(this._quantize);
    }

    get noteWidth() : number {
        return this.convertDurationToPx(this._noteDuration);
    }

    get barWidth() : number {
        return StaticMeasurements.ticksPerBar * this.tickToPxRatio;
    }

    get rowHeight() : number {
        return StaticMeasurements.rowHeight;
    }

    get gridHeight() : number {
        return this.rowHeight * pitchesArray.length;
    }

    get gridWidth() : number {
        return this.numBars * this.barWidth;
    }

    get stageWidth() : number {
        return this._stageWidth;
    }

    set stageWidth(width: number) {
        this._stageWidth = width;
    }

    get stageHeight() : number {
        return this._stageHeight;
    }

    set stageHeight(height: number) {
        this._stageHeight = height;
    }

    get velocityAreaHeight() : number {
        return this._velocityAreaHeight;
    }

    set velocityAreaHeight(height: number) {
        this._velocityAreaHeight = height;
    }

    get seekerAreaHeight() : number {
        return StaticMeasurements.seekerAreaHeight;
    }

    get numBars() : number {
        return this._numBars;
    }

    roundDownToGridRow(y: number) : number {
        return this.roundDown(y, this.rowHeight);
    }

    roundDownToGridCol(x: number) : number {
        return this.roundDown(x, this.colWidth);
    }

    roundToGridRow(y: number) : number {
        return this.round(y, this.rowHeight);
    }

    roundToGridCol(x: number) : number {
        return this.round(x, this.colWidth);
    }
    
    derivePitchFromY(y: number) : string {
        const idx = y / this.rowHeight;
        const noteObj = pitchesArray[idx];
        return noteObj.full
    }

    deriveYFromPitch(pitch: string) : number {
        const rowNumber = Math.max(
            pitchesArray.findIndex(noteObj => noteObj.full === pitch),
            0
        );
        return rowNumber * this.rowHeight
    }
}
