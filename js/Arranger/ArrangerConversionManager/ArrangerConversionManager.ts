import {
    StaticMeasurements,
    ArrangerConversionManagerOptions,
    ConversionManager
} from '../../Constants';

export default class ArrangerConversionManager implements ConversionManager {

    private _stageWidth: number;
    private _stageHeight: number;
    private _barWidth: number;
    private _barHeight: number;
    private _numBars: number;
    private _numChannels: number;
    private _tickToPxRatio: number
    
    constructor({
        stageWidth,
        stageHeight,
        barWidth,
        barHeight,
        numBars,
        numChannels,
        tickToPxRatio
    } : ArrangerConversionManagerOptions) {
        this._stageWidth = stageWidth;
        this._stageHeight = stageHeight;
        this._barWidth = barWidth;
        this._barHeight = barHeight;
        this._numBars = numBars;
        this._numChannels = numChannels;
        this._tickToPxRatio = tickToPxRatio;
    }

    get stageWidth() : number {
        return this._stageWidth
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

    get colWidth() : number {
        return this.convertTicksToPx(StaticMeasurements.ticksPerBar)
    }

    get rowHeight() : number {
        return this._barHeight;
    }

    set rowHeight(height: number) {
        this._barHeight = height;
    }

    get gridWidth() : number {
        return this.colWidth * this.numBars;
    }

    get gridHeight() : number {
        return this.rowHeight * this.numChannels;
    }

    get numBars() : number {
        return this._numBars;
    }

    set numBars(num: number) {
        this._numBars = num;
    }

    get numChannels() : number {
        return this._numChannels;
    }

    set numChannels(num: number) {
        this._numChannels = num;
    }

    get seekerAreaHeight() : number {
        return StaticMeasurements.seekerAreaHeight;
    } 

    get tickToPxRatio() : number {
        return this._tickToPxRatio;
    }

    set tickToPxRatio(ratio: number) {
        this._tickToPxRatio = ratio;
    }

    convertTicksToPx(ticks: number) : number {
        return ticks * this._tickToPxRatio;
    }

    convertPxToTicks(px: number) : number {
        return px / this._tickToPxRatio;
    }

    roundDown(total: number, divisor: number) : number {
        return total - (total % divisor);
    }

    round(total: number, divisor : number) : number {
        return Math.round(total / divisor) * divisor;
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


}