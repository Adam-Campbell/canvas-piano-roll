import { StaticMeasurements } from '../../Constants';

export default abstract class AbstractConversionManager {

    private _stageWidth: number;
    private _stageHeight: number;
    private _tickToPxRatio: number;

    constructor(
        stageWidth: number,
        stageHeight: number,
        tickToPxRatio: number
    ) { 
        this._stageWidth = stageWidth;
        this._stageHeight = stageHeight;
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

    abstract get rowHeight() : number;
    abstract set rowHeight(height: number);

    abstract get colWidth() : number;
    abstract set colWidth(width: number);

    abstract get numRows(): number;
    abstract set numRows(numRows: number);

    abstract get numCols() : number;
    abstract set numCols(numCols: number);

    get gridHeight(): number {
        return this.rowHeight * this.numRows;
    }
    
    get gridWidth(): number {
        return this.colWidth * this.numCols;
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