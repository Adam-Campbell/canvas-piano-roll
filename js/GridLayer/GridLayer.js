import { Line, Rect, Group } from 'konva';
import emitter from '../EventEmitter'; 
import { 
    QUANTIZE_VALUE_UPDATE,
    SCALE_TYPE_UPDATE,
    DISPLAY_SCALE_UPDATE
} from '../events';
import {  
    getHorizontalLinesData,
    getVerticalLinesData,
} from './gridUtils';
import { pitchesArray } from '../pitches';
import { scale } from '@tonaljs/scale';
import { note } from '@tonaljs/tonal';

const isSameNote = (noteA, noteB) => note(noteA).chroma === note(noteB).chroma;

export default class GridLayer {
    
    constructor(conversionManager, layerRef) {
        this._conversionManager = conversionManager;
        this.layer = layerRef;
        this._gridContainer = new Group({ x: 120, y: 30 });
        this._scaleHighlightsSubContainer = null;
        this._gridLinesSubContainer = null;
        this._scaleType = 'C major';
        this._shouldDisplayScaleHighlighting = false;
    }

    init() {
        this.layer.add(this._gridContainer);
        this._drawGrid();
        this.layer.batchDraw();
        this._registerGlobalEventSubscriptions();
    }

    _registerGlobalEventSubscriptions() {
        emitter.subscribe(QUANTIZE_VALUE_UPDATE, qVal => {
            this._drawGrid();
        });
        emitter.subscribe(SCALE_TYPE_UPDATE, scaleType => {
            this._scaleType = scaleType;
            console.log(scaleType);
            this._drawScaleHighlights();
        });
        emitter.subscribe(DISPLAY_SCALE_UPDATE, shouldDisplay => {
            this._shouldDisplayScaleHighlighting = shouldDisplay;
            this._drawScaleHighlights();
        });
    }

    updateX(x) {
        this._gridContainer.x(x);
        this.layer.batchDraw();
    }

    updateY(y) {
        this._gridContainer.y(y);
        this.layer.batchDraw();
    }

    _toggleScaleHighlights() {
        this._shouldDisplayScaleHighlighting = !this._shouldDisplayScaleHighlighting;
        this._drawScaleHighlights();
    }

    _drawScaleHighlights() {
        this._scaleHighlightsSubContainer.destroyChildren();
        if (this._shouldDisplayScaleHighlighting) {
            const scaleObject = scale(this._scaleType);
            console.log(scaleObject);
            const { notes, tonic } = scaleObject;
            pitchesArray.forEach((noteObj, idx) => {
                if (notes.find((scaleNote) => isSameNote(scaleNote, noteObj.note))) {
                    const isTonic = isSameNote(tonic, noteObj.note);
                    const highlightRect = new Rect({
                        x: 0,
                        y: idx * this._conversionManager.rowHeight,
                        width: this._conversionManager.gridWidth,
                        height: this._conversionManager.rowHeight,
                        fill: isTonic ? 'tomato' : 'pink',
                    });
                    highlightRect.moveTo(this._scaleHighlightsSubContainer);
                }
            });
        }
        this.layer.batchDraw();
    }

    _drawGridLines() {
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
            line.moveTo(this._gridLinesSubContainer);
        }); 
        this.layer.batchDraw();
    }

    _drawGrid() {
        this._gridContainer.destroyChildren();
        const background = new Rect({
            x: 0,
            y: 0,
            width: this._conversionManager.gridWidth,
            height: this._conversionManager.gridHeight,
            fill: '#dadada'
        });
        background.moveTo(this._gridContainer);
        this._scaleHighlightsSubContainer = new Group();
        this._scaleHighlightsSubContainer.moveTo(this._gridContainer);
        if (this._shouldDisplayScaleHighlighting) {
            this._drawScaleHighlights();
        }
        this._gridLinesSubContainer = new Group();
        this._gridLinesSubContainer.moveTo(this._gridContainer);
        this._drawGridLines();
        this.layer.batchDraw();
    }

    redrawOnZoomAdjustment() {
        this._drawGrid();
    }

}
