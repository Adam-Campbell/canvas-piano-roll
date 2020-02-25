import Konva from 'konva';
import EventEmitter from '../../EventEmitter'; 
import SettingsManager from '../../SettingsManager';
import {  
    getHorizontalLinesData,
    getVerticalLinesData,
} from './gridUtils';
import { pitchesArray } from '../../pitches';
import { scale } from '@tonaljs/scale';
import { note } from '@tonaljs/tonal';
import { 
    Colours,
    Events,
    StaticMeasurements
} from '../../Constants';
import PianoRollConversionManager from '../PianoRollConversionManager';

const isSameNote = (noteA, noteB) => note(noteA).chroma === note(noteB).chroma;

export default class PianoRollGrid {
    
    private conversionManager: PianoRollConversionManager;
    private settingsManager: SettingsManager;
    private layer: Konva.Layer;
    private gridContainer: Konva.Group;
    private scaleHighlightsSubContainer: Konva.Group;
    private gridLinesSubContainer: Konva.Group;
    private eventEmitter: EventEmitter;

    constructor(
        conversionManager: PianoRollConversionManager,
        settingsManager: SettingsManager,
        layerRef: Konva.Layer, 
        eventEmitter: EventEmitter
    ) {
        this.conversionManager = conversionManager;
        this.settingsManager = settingsManager;
        this.layer = layerRef;
        this.gridContainer = new Konva.Group({ 
            x: StaticMeasurements.pianoKeyWidth, 
            y: this.conversionManager.seekerAreaHeight 
        });
        this.eventEmitter = eventEmitter;
    }

    /**
     * Initializes the grid and sets up the necessary subscriptions. 
     */
    init() : void {
        this.layer.add(this.gridContainer);
        this.drawGrid();
        this.layer.batchDraw();
        this.registerGlobalEventSubscriptions();
    }

    /**
     * Sets up the necessary subscriptions with the global event emitter. 
     */
    private registerGlobalEventSubscriptions() : void {
        this.eventEmitter.subscribe(Events.quantizeValueUpdate, qVal => {
            this.drawGrid();
        });
        this.eventEmitter.subscribe(Events.scaleTypeUpdate, () => {
            this.drawScaleHighlights();
        });
        this.eventEmitter.subscribe(Events.displayScaleUpdate, () => {
            this.drawScaleHighlights();
        });
    }

    /**
     * Adjusts the grids position along the x axis according to the x value supplied.
     */
    updateX(x) {
        this.gridContainer.x(x);
        this.layer.batchDraw();
    }

    /**
     * Adjusts the grids position along the y axis according to the y value supplied. 
     */
    updateY(y) {
        this.gridContainer.y(y);
        this.layer.batchDraw();
    }

    /**
     * Toggles whether scale highlights are visible or not.
     */
    toggleScaleHighlights() {
        this.eventEmitter.emit(Events.displayScaleUpdate, !this.settingsManager.shouldShowScaleHighlights);
        this.drawScaleHighlights();
    }

    /**
     * Draws scale highlights to match the current scale related state.
     */
    private drawScaleHighlights() {
        this.scaleHighlightsSubContainer.destroyChildren();
        if (this.settingsManager.shouldShowScaleHighlights) {
            const fullScaleName = `${this.settingsManager.scaleKey} ${this.settingsManager.scaleType}`;
            const scaleObject = scale(fullScaleName);
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

    /**
     * Draws the grid lines based upon the current state.
     */
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

    /**
     * Draws the entire grid including the grid lines and scale highlights where appropriate. 
     */
    private drawGrid() {
        this.gridContainer.destroyChildren();
        this.scaleHighlightsSubContainer = new Konva.Group();
        this.scaleHighlightsSubContainer.moveTo(this.gridContainer);
        if (this.settingsManager.shouldShowScaleHighlights) {
            this.drawScaleHighlights();
        }
        this.gridLinesSubContainer = new Konva.Group();
        this.gridLinesSubContainer.moveTo(this.gridContainer);
        this.drawGridLines();
        this.layer.batchDraw();
    }

    /**
     * Redraws the grid when the zoom level of the parent stage updates. 
     */
    redrawOnZoomAdjustment() {
        this.drawGrid();
    }

}
