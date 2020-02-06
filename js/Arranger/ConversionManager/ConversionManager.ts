import {
    StaticMeasurements,
    ArrangerConversionManagerOptions
} from '../../Constants';

export default class ConversionManager {

    private _stageWidth: number;
    private _stageHeight: number;
    private _barWidth: number;
    private _barHeight: number;
    private _numBars: number;
    private _numChannels: number;
    
    constructor({
        stageWidth,
        stageHeight,
        barWidth,
        barHeight,
        numBars,
        numChannels,
    } : ArrangerConversionManagerOptions) {
        this._stageWidth = stageWidth;
        this._stageHeight = stageHeight;
        this._barWidth = barWidth;
        this._barHeight = barHeight;
        this._numBars = numBars;
        this._numChannels = numChannels;
    }

    roundDown(total: number, divisor: number) : number {
        return total - (total % divisor);
    }

    round(total: number, divisor : number) : number {
        return Math.round(total / divisor) * divisor;
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
        return this._barWidth;
    }

    set colWidth(width: number) {
        this._barWidth = width;
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



}