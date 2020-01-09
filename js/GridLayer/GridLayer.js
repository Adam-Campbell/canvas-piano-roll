import { Line, Rect, Layer } from 'konva';
import { 
    NOTES_GRID_HEIGHT, 
    BAR_WIDTH,  
    DRAG_MODE_ADJUST_NEW_NOTE_SIZE,
    DRAG_MODE_ADJUST_NOTE_SIZE,
    DRAG_MODE_ADJUST_SELECTION
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
    
    constructor(conversionManager) {
        this.layer = new Layer({ x: 120, y: 30 });
        this._conversionManager = conversionManager;
        this.unsubscribe1 = emitter.subscribe(QUANTIZE_VALUE_UPDATE, qVal => {
            this.draw();
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
            width: this._conversionManager.gridWidth,
            height: this._conversionManager.gridHeight,
            fill: '#dadada'
        });
        this.layer.add(background);
    }

    _addLinesToLayer() {
        const horizontalLinesData = getHorizontalLinesData(this._conversionManager.gridWidth);
        const verticalLinesData = getVerticalLinesData(
            this._conversionManager.numBars, 
            this._conversionManager.barWidth,
            this._conversionManager.colWidth,
            this._conversionManager.gridHeight
        );
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
        this.layer.batchDraw();
    }

}
