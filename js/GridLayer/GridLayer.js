import { Line, Rect, Layer } from 'konva';
import { 
    NOTES_GRID_HEIGHT, 
    BAR_WIDTH,  
    DRAG_MODE_ADJUST_NEW_NOTE_SIZE,
    DRAG_MODE_ADJUST_NOTE_SIZE
} from '../constants';
import emitter from '../EventEmitter'; 
import { 
    QUANTIZE_VALUE_UPDATE,
    NOTE_DURATION_UPDATE,
    ADD_NOTE
} from '../events';
import {  
    getHorizontalLinesData,
    getVerticalLinesData,
} from './utils';

export default class GridLayer {
    
    constructor(numBars = 4, initialQuantize = '16n', setDragMode, conversionManager) {
        this.layer = new Layer({ x: 120 });
        this._conversionManager = conversionManager;
        this._numBars = numBars;
        this._quantize = initialQuantize;
        this._setDragMode = setDragMode;
        this.unsubscribe1 = emitter.subscribe(QUANTIZE_VALUE_UPDATE, qVal => {
            this._quantize = qVal;
            this.draw();
        });
        this.layer.on('mousedown', e => {
            this.handleMouseDown(e);
        });
    }

    updateX(x) {
        this.layer.x(x);
        this.layer.batchDraw();
    }

    updateY(y) {
        this.layer.y(y);
        this.layer.batchDraw();
    }

    _addBackgroundToLayer() {
        const background = new Rect({
            x: 0,
            y: 0,
            width: BAR_WIDTH * this._numBars,
            height: NOTES_GRID_HEIGHT,
            fill: '#dadada'
        });
        this.layer.add(background);
    }

    _addLinesToLayer() {
        const horizontalLinesData = getHorizontalLinesData();
        const verticalLinesData = getVerticalLinesData(this._numBars, this._quantize);
        [ ...horizontalLinesData, ...verticalLinesData ]
        .forEach(lineProps => {
            const line = new Line({ ...lineProps });
            this.layer.add(line);
        });
    }

    draw() {
        this.layer.removeChildren();
        this._addBackgroundToLayer();
        this._addLinesToLayer();
        this.layer.draw();
    }

    getAbsoluteCoords(rawX, rawY) {
        return {
            x: rawX - this.layer.x(),
            y: rawY - this.layer.y()
        };
    }

    handleMouseDown(e) {
        const { offsetX, offsetY } = e.evt;
        const { x, y } = this.getAbsoluteCoords(offsetX, offsetY);
        const roundedX = this._conversionManager.roundDownToGridCol(x);
        const roundedY = this._conversionManager.roundDownToGridRow(y);
        emitter.broadcast(ADD_NOTE, roundedX, roundedY);
        this._setDragMode(DRAG_MODE_ADJUST_NEW_NOTE_SIZE);
    }

}
