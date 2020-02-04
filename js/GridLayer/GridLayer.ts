//import { Line, Rect, Group } from 'konva';
import Konva from 'konva';
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
import { Colours } from '../Constants';
import ConversionManager from '../ConversionManager';

const isSameNote = (noteA, noteB) => note(noteA).chroma === note(noteB).chroma;

export default class GridLayer {
    
    private conversionManager: ConversionManager;
    private layer: Konva.Layer;
    private gridContainer: Konva.Group;
    private scaleHighlightsSubContainer: Konva.Group;
    private gridLinesSubContainer: Konva.Group;
    private scaleType: string;
    private shouldDisplayScaleHighlighting: boolean;

    constructor(conversionManager: ConversionManager, layerRef: Konva.Layer) {
        this.conversionManager = conversionManager;
        this.layer = layerRef;
        this.gridContainer = new Konva.Group({ x: 120, y: 30 });
        this.scaleType = 'C major';
        this.shouldDisplayScaleHighlighting = false;
    }

    init() : void {
        this.layer.add(this.gridContainer);
        this.drawGrid();
        this.layer.batchDraw();
        this.registerGlobalEventSubscriptions();
    }

    private registerGlobalEventSubscriptions() : void {
        emitter.subscribe(QUANTIZE_VALUE_UPDATE, qVal => {
            this.drawGrid();
        });
        emitter.subscribe(SCALE_TYPE_UPDATE, scaleType => {
            this.scaleType = scaleType;
            console.log(scaleType);
            this.drawScaleHighlights();
        });
        emitter.subscribe(DISPLAY_SCALE_UPDATE, shouldDisplay => {
            this.shouldDisplayScaleHighlighting = shouldDisplay;
            this.drawScaleHighlights();
        });
    }

    updateX(x) {
        this.gridContainer.x(x);
        this.layer.batchDraw();
    }

    updateY(y) {
        this.gridContainer.y(y);
        this.layer.batchDraw();
    }

    private toggleScaleHighlights() {
        this.shouldDisplayScaleHighlighting = !this.shouldDisplayScaleHighlighting;
        this.drawScaleHighlights();
    }

    private drawScaleHighlights() {
        this.scaleHighlightsSubContainer.destroyChildren();
        if (this.shouldDisplayScaleHighlighting) {
            const scaleObject = scale(this.scaleType);
            console.log(scaleObject);
            const { notes, tonic } = scaleObject;
            pitchesArray.forEach((noteObj, idx) => {
                if (notes.find((scaleNote) => isSameNote(scaleNote, noteObj.note))) {
                    const isTonic = isSameNote(tonic, noteObj.note);
                    const highlightRect = new Konva.Rect({
                        x: 0,
                        y: idx * this.conversionManager.rowHeight,
                        width: this.conversionManager.gridWidth,
                        height: this.conversionManager.rowHeight,
                        fill: isTonic ? Colours.secondary.main : Colours.secondary.lightened,
                    });
                    highlightRect.moveTo(this.scaleHighlightsSubContainer);
                }
            });
        }
        this.layer.batchDraw();
    }

    private drawGridLines() {
        const horizontalLinesData = getHorizontalLinesData(this.conversionManager.gridWidth);
        const verticalLinesData = getVerticalLinesData(
            this.conversionManager.numBars, 
            this.conversionManager.barWidth,
            this.conversionManager.colWidth,
            this.conversionManager.gridHeight
        );
        [ ...horizontalLinesData, ...verticalLinesData ]
        .forEach(lineProps => {
            const line = new Konva.Line({ ...lineProps });
            line.moveTo(this.gridLinesSubContainer);
        }); 
        this.layer.batchDraw();
    }

    private drawGrid() {
        this.gridContainer.destroyChildren();
        const background = new Konva.Rect({
            x: 0,
            y: 0,
            width: this.conversionManager.gridWidth,
            height: this.conversionManager.gridHeight,
            fill: Colours.grayscale[1]
        });
        background.moveTo(this.gridContainer);
        this.scaleHighlightsSubContainer = new Konva.Group();
        this.scaleHighlightsSubContainer.moveTo(this.gridContainer);
        if (this.shouldDisplayScaleHighlighting) {
            this.drawScaleHighlights();
        }
        this.gridLinesSubContainer = new Konva.Group();
        this.gridLinesSubContainer.moveTo(this.gridContainer);
        this.drawGridLines();
        this.layer.batchDraw();
    }

    redrawOnZoomAdjustment() {
        this.drawGrid();
    }

}
