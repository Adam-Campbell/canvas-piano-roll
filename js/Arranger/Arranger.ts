import Tone from 'tone';
import Konva from 'konva';
import GridLayer from './GridLayer';
import ConversionManager from './ConversionManager';
import SectionLayer from './SectionLayer';
import CanvasElementCache from './CanvasElementCache';
import MouseStateManager from './MouseStateManager';
import KeyboardStateManager from './KeyboardStateManager';
import SectionSelection from './SectionSelection';
import Clipboard from './Clipboard';
import TransportLayer from './TransportLayer';
import SeekerLineLayer from './SeekerLineLayer';
import AudioReconciler from './AudioReconciler';
import AudioEngine from '../AudioEngine';
import {
    ArrangerDragModes,
    Tools,
    KonvaEvent,
    Events,
    ArrangerOptions,
    StaticMeasurements
} from '../Constants';
import { genId } from '../genId';
import { 
    pipe, 
    doesOverlap,
    canShiftUp,
    canShiftDown,
    canShiftLeft,
    canShiftRight 
} from '../utils';
import EventEmitter from '../EventEmitter';
import { getBarNumFromBBSString } from './arrangerUtils';


/*

Should be able to reuse these amongs between PianoRoll and Arranger:

CanvasElementCache
KeyboardStateManager
MouseStateManager
NoteSelection (but give it a more general name such as SelectionManager)

Additionally I think NoteLayer and its equivalent, SectionLayer, can be built using the same class, I just
need to make sure the naming is more generic ie use the term rect instead of the terms note or section. 



*/



export default class Arranger {

    private dragMode: ArrangerDragModes;
    private activeTool: Tools;
    private stage: Konva.Stage;
    private conversionManager: ConversionManager;
    private primaryBackingLayer: Konva.Layer;
    private gridLayer: GridLayer;
    private sectionLayer: SectionLayer;
    private sectionCache: CanvasElementCache;
    private mouseStateManager: MouseStateManager;
    private keyboardStateManager: KeyboardStateManager;
    private sectionSelection: SectionSelection;
    private emitter: EventEmitter;
    private clipboard: Clipboard;
    private audioReconciler: AudioReconciler;
    private audioEngine: AudioEngine;
    private transportLayer: TransportLayer;
    private seekerLineLayer: SeekerLineLayer;
    private _xScroll: number;
    private _yScroll: number;
    private playbackFromTicks: number;
    

    constructor(eventEmitter: EventEmitter) {
        this.dragMode = null;
        this.activeTool = Tools.cursor;
        this._xScroll = 0;
        this._yScroll = 30;
        this.emitter = eventEmitter;
        this.playbackFromTicks = 0;
        window.toneRef = Tone;
    }

    get xScroll() : number {
        return this._xScroll;
    }

    set xScroll(x: number) {
        this._xScroll = x;
        // Will also manually update scroll on necessary layers.
    }

    get yScroll() : number {
        return this._yScroll;
    }

    set yScroll(y: number) {
        this._yScroll = y;
        // Will also manually update scroll on necessary layers.
    }

    init(arrangerOptions: ArrangerOptions) {
        this.instantiateChildClasses(arrangerOptions);
        this.stage.add(this.primaryBackingLayer);
        this.stage.add(this.seekerLineLayer.layer);
        this.gridLayer.init();
        this.sectionLayer.init();
        this.transportLayer.init();
        this.seekerLineLayer.init();
        this.registerStageSubscriptions();
        this.registerKeyboardSubscriptions();
        this.registerGlobalEventSubscriptions();
    }

    instantiateChildClasses({
        container, 
        initialWidth,
        initialHeight,
        audioEngine
    } : ArrangerOptions) : void {
        this.stage = new Konva.Stage({
            container,
            width: initialWidth,
            height: initialHeight
        });
        console.log(`height is: ${initialHeight}`)
        this.audioEngine = audioEngine;
        this.conversionManager = new ConversionManager({
            stageWidth: initialWidth,
            stageHeight: initialHeight,
            barWidth: 48,
            barHeight: 40,
            numBars: 64,
            numChannels: 4,
            tickToPxRatio: 0.0625
        });
        this.audioReconciler = new AudioReconciler(this.conversionManager, this.audioEngine);
        this.mouseStateManager = new MouseStateManager();
        this.keyboardStateManager = new KeyboardStateManager(container);
        this.sectionCache = new CanvasElementCache();
        this.sectionSelection = new SectionSelection();
        this.clipboard = new Clipboard(this.conversionManager, this.audioEngine);
        this.primaryBackingLayer = new Konva.Layer();
        this.gridLayer = new GridLayer(this.conversionManager, this.primaryBackingLayer);
        this.sectionLayer = new SectionLayer(this.conversionManager, this.primaryBackingLayer);
        this.transportLayer = new TransportLayer(this.conversionManager, this.primaryBackingLayer);
        this.seekerLineLayer = new SeekerLineLayer(this.conversionManager);
    }

    handleResize(containerWidth: number, containerHeight: number) : void {
        this.stage.width(containerWidth);
        this.conversionManager.stageWidth = containerWidth;
        this.stage.height(containerHeight);
        this.conversionManager.stageHeight = containerHeight;
        this.gridLayer.redrawOnResize();
        /*
            Draw vs batchDraw for resizing

            Draw is preferable to batchDraw if performance will allow it, which it seems to here, though
            it may be different in PianoRoll. The calling of this handleResize method is already throttled
            by requestAnimationFrame, and the extra throttling added by batchDraw sometimes makes the canvas
            lag behind the window slightly. Draw does seem to be slightly more performance intensive still,
            however this will probably be preferrable to the canvas lag. 
        */
        this.primaryBackingLayer.draw();
    }

    private registerStageSubscriptions() {
        this.stage.on('mousedown', (e: KonvaEvent) => this.handleInteractionStart(e));
        this.stage.on('touchstart', (e: KonvaEvent) => this.handleInteractionStart(e));
        this.stage.on('mousemove', (e: KonvaEvent) => this.handleInteractionUpdate(e));
        this.stage.on('touchmove', (e: KonvaEvent) => this.handleInteractionUpdate(e));
        this.stage.on('mouseup', (e: KonvaEvent) => this.handleInteractionEnd(e));
        this.stage.on('touchend', (e: KonvaEvent) => this.handleInteractionEnd(e));
        this.stage.on('dblclick', (e: KonvaEvent) => this.handleDoubleClick(e));
    }

    private registerKeyboardSubscriptions() : void {
        this.keyboardStateManager.addKeyListener('1', () => {
            if (this.keyboardStateManager.altKey) {
                this.emitter.emit(Events.activeToolUpdate, 'cursor');
            }
        });
        this.keyboardStateManager.addKeyListener('2', () => {
            if (this.keyboardStateManager.altKey) {
                this.emitter.emit(Events.activeToolUpdate, 'pencil');
            }
        });
        this.keyboardStateManager.addKeyListener('3', () => {
            if (this.keyboardStateManager.altKey) {
                this.emitter.emit(Events.activeToolUpdate, 'marquee');
            }
        });
        this.keyboardStateManager.addKeyListener('ArrowUp', () => this.shiftSelectionUp());
        this.keyboardStateManager.addKeyListener('ArrowDown', () => this.shiftSelectionDown());
        this.keyboardStateManager.addKeyListener('ArrowLeft', () => this.shiftSelectionLeft());
        this.keyboardStateManager.addKeyListener('ArrowRight', () => this.shiftSelectionRight());
        this.keyboardStateManager.addKeyListener('Delete', () => this.deleteSelectedSections());
        this.keyboardStateManager.addKeyListener('x', () => this.keyboardStateManager.ctrlKey && this.cut());
        this.keyboardStateManager.addKeyListener('c', () => this.keyboardStateManager.ctrlKey && this.copy());
        this.keyboardStateManager.addKeyListener('v', () => this.keyboardStateManager.ctrlKey && this.paste());
        this.keyboardStateManager.addKeyListener(' ', () => this.handleTogglePlayback());
    }

    private registerGlobalEventSubscriptions() : void {
        this.emitter.subscribe(Events.activeToolUpdate, tool => {
            this.activeTool = tool;
            console.log(this.activeTool);
        });
    }

    cleanup() {
        this.stage.destroy();
    }

    private handleTogglePlayback() : void {
        if (Tone.Transport.state === 'started') {
            if (this.keyboardStateManager.shiftKey) {
                Tone.Transport.pause();
            } else {
                Tone.Transport.stop();
                Tone.Transport.ticks = this.playbackFromTicks;
            }
        } else {
            Tone.Transport.start();
        }
    }

    private addNewSection(x: number, y: number, id: string, width?: number) : Konva.Rect {
        const newSection = this.sectionLayer.addNewSection(x, y, id, width);
        this.sectionCache.add(newSection);
        this.sectionSelection.add(newSection);
        return newSection;
    }

    private addSectionToAudioEngine(sectionElement: Konva.Rect) : void {
        const channelIdx = sectionElement.y() / this.conversionManager.rowHeight;
        const sectionStartNum = sectionElement.x() / this.conversionManager.colWidth;
        const sectionNumBars = sectionElement.width() / this.conversionManager.colWidth;
        const newSectionId = sectionElement.id();
        console.log(`
            channelIdx: ${channelIdx}
            sectionStart: ${sectionStartNum}
            numBars: ${sectionNumBars}
        `);
        this.audioEngine.channels[channelIdx].addSection(
            `${sectionStartNum}:0:0`,
            sectionNumBars,
            newSectionId
        );
    }

    private addSectionToSelection(sectionElement: Konva.Rect) : void {
        this.sectionSelection.add(sectionElement);
        this.sectionLayer.addSelectedAppearance(sectionElement);
    }

    private removeSectionFromSelection(sectionElement: Konva.Rect) : void {
        this.sectionSelection.remove(sectionElement);
        this.sectionLayer.removeSelectedAppearance(sectionElement);
    }

    private clearSelection() : void {
        const selectedSectionIds = this.sectionSelection.retrieveAll();
        const selectedSectionElements = this.sectionCache.retrieve(selectedSectionIds);
        selectedSectionElements.forEach(el => this.sectionLayer.removeSelectedAppearance(el));
        this.sectionSelection.clear();
    }

    private shiftSelectionUp() {
        const selectedSectionIds = this.sectionSelection.retrieveAll();
        const selectedSectionElements = this.sectionCache.retrieve(selectedSectionIds);
        if (canShiftUp(selectedSectionElements, this.conversionManager.rowHeight)) {
            this.sectionLayer.shiftSectionsVertically(
                selectedSectionElements, 
                true
            );
            // then I must also update the audio engine and the history stack
        }
    }

    private shiftSelectionDown() {
        const selectedSectionIds = this.sectionSelection.retrieveAll();
        const selectedSectionElements = this.sectionCache.retrieve(selectedSectionIds);
        if (canShiftDown(
            selectedSectionElements, 
            this.conversionManager.gridHeight, 
            this.conversionManager.rowHeight
        )) {
            this.sectionLayer.shiftSectionsVertically(selectedSectionElements, false);
            // then update audio engine and history stack
        }
    }

    private shiftSelectionLeft() : void {
        const selectedSectionIds = this.sectionSelection.retrieveAll();
        const selectedSectionElements = this.sectionCache.retrieve(selectedSectionIds);
        if (canShiftLeft(selectedSectionElements)) {
            this.sectionLayer.shiftSectionsHorizontally(selectedSectionElements, true);
            // then update audio engine and history stack
        }
    }

    private shiftSelectionRight() : void {
        const selectedSectionIds = this.sectionSelection.retrieveAll();
        const selectedSectionElements = this.sectionCache.retrieve(selectedSectionIds);
        if (canShiftRight(
            selectedSectionElements,
            this.conversionManager.gridWidth,
            this.conversionManager.colWidth
        )) {
            this.sectionLayer.shiftSectionsHorizontally(selectedSectionElements, false);
            // then update audio engine and history stack
        }
    }

    private deleteSelectedSections() {
        const selectedSectionIds = this.sectionSelection.retrieveAll();
        const selectedSectionElements = this.sectionCache.retrieve(selectedSectionIds);
        this.sectionLayer.deleteSections(selectedSectionElements);
        this.sectionSelection.clear();
        selectedSectionElements.forEach(section => {
            this.sectionCache.remove(section);
            this.audioReconciler.removeSection(section);
        });
    }

    private copy() {
        const selectedSectionIds = this.sectionSelection.retrieveAll();
        const selectedSectionElements = this.sectionCache.retrieve(selectedSectionIds);
        this.clipboard.add(selectedSectionElements);
    }

    private cut() {
        this.copy();
        this.deleteSelectedSections();
    }

    private paste() {
        const currentBar = Math.floor(Tone.Transport.ticks / StaticMeasurements.ticksPerBar);
        const newSectionsData = this.clipboard.produceCopy(currentBar);
        
        newSectionsData.forEach(serializedSection => {
            const x = getBarNumFromBBSString(serializedSection.start) * this.conversionManager.colWidth;
            const y = serializedSection.channelIdx * this.conversionManager.rowHeight;
            const width = serializedSection.numBars * this.conversionManager.colWidth; 
            this.addNewSection(x, y, serializedSection.id, width);
            this.audioReconciler.addSectionFromSerializedState(serializedSection);
        })
    }

    private reconcileSectionSelectionWithSelectionArea(
        selectionX1: number, 
        selectionY1: number, 
        selectionX2: number, 
        selectionY2: number
    ) : void {
        const allSections = this.sectionCache.retrieveAll();

        allSections.forEach(sectionRect => {
            const { x, y, width, height } = sectionRect.attrs;
            const sectionX1 = x;
            const sectionX2 = x + width;
            const sectionY1 = y;
            const sectionY2 = y + height;
            const overlapsWithSelection = doesOverlap(
                sectionX1,
                sectionX2,
                sectionY1,
                sectionY2,
                selectionX1,
                selectionX2,
                selectionY1,
                selectionY2
            );
            const isSelected = this.sectionSelection.has(sectionRect);
            if (overlapsWithSelection && !isSelected) {
                    this.addSectionToSelection(sectionRect);
            } else if (!overlapsWithSelection && isSelected) {
                this.removeSectionFromSelection(sectionRect);
            }
        });
    }

    private extractInfoFromEventObject(e: KonvaEvent) : {
        isTouchEvent : boolean,
        target: any,
        rawX: number,
        rawY: number
    } {
        const { evt, target } = e;
        const isTouchEvent = Boolean(evt.touches);
        let rawX;
        let rawY;
        if (isTouchEvent) {
            const { clientX, clientY } = evt.touches[0];
            const { top, left } = this.stage.container().getBoundingClientRect();
            rawX = clientX - left;
            rawY = clientY - top;
        } else {
            rawX = evt.offsetX;
            rawY = evt.offsetY;
        }
        return {
            isTouchEvent,
            target,
            rawX, 
            rawY
        }
    }

    handleDoubleClick(e: KonvaEvent) : void {
        // const { target } = this.extractInfoFromEventObject(e);
        // if (target.name() === 'SECTION' && this.activeTool === Tools.cursor) {
        //     console.log('Open up a piano roll window');
        //     this.emitter.emit(Events.openPianoRollWindow, target.id());
        // }
        const { rawX, rawY, target } = this.extractInfoFromEventObject(e);
        const isTransportAreaInteraction = rawY <= 30;
        const isSectionInteraction = target.name() === 'SECTION';

        if (isTransportAreaInteraction) {
            const roundedX = this.conversionManager.roundDownToGridCol(
                rawX - this.xScroll
            );
            const positionAsTicks = this.conversionManager.convertPxToTicks(roundedX);
            this.playbackFromTicks = positionAsTicks;
            this.transportLayer.repositionPlaybackMarker(positionAsTicks);
        } else if (isSectionInteraction && this.activeTool === Tools.cursor) {
            this.emitter.emit(Events.openPianoRollWindow, target.id());
        }
    }

    handleInteractionStart(e: KonvaEvent) : void {
        // Return early if not a left mouse button press
        if (e.evt.button !== 0) {
            return;
        }
        const { rawX, rawY, isTouchEvent, target } = this.extractInfoFromEventObject(e);
        const xWithScroll = rawX - this.xScroll;
        const yWithScroll = rawY - this.yScroll;
        const roundedX = this.conversionManager.roundDownToGridCol(xWithScroll);
        const roundedY = this.conversionManager.roundDownToGridRow(yWithScroll);
        this.mouseStateManager.addMouseDownEvent(xWithScroll, yWithScroll);
        // const isBelowGrid = Math.floor(yWithScroll / this.conversionManager.rowHeight) 
        //     > this.conversionManager.numChannels;
        const isBelowGrid = yWithScroll > this.conversionManager.gridHeight;
        
        const isTransportAreaInteraction = rawY <= 30;
        if (isTransportAreaInteraction) {
            this.handleTransportAreaInteraction(roundedX);
            return;
        }

        if (this.activeTool === Tools.marquee) {
            this.dragMode = ArrangerDragModes.adjustSelection;

        } else if (this.activeTool === Tools.pencil) {
            if (isBelowGrid) {
                return;
            }
            this.dragMode = ArrangerDragModes.adjustSectionLength;
            this.clearSelection();
            this.addNewSection(roundedX, roundedY, genId());

        } else if (this.activeTool === Tools.cursor) {
            const targetIsSection = target.name() === 'SECTION';
            if (targetIsSection) {
                this.handleSectionInteractionStart(target, xWithScroll); 
            }
        }
    }

    handleTransportAreaInteraction(roundedX: number) {
        console.log('transport area interaction');
        const positionAsTicks = this.conversionManager.convertPxToTicks(roundedX);
        const positionAsBBS = Tone.Ticks(positionAsTicks).toBarsBeatsSixteenths();
        Tone.Transport.position = positionAsBBS;
        this.seekerLineLayer.updateSeekerLinePosition();
    }

    handleSectionInteractionStart(sectionElement: Konva.Rect, xWithScroll: number) : void {
        const { x: rectX, width: rectWidth } = sectionElement.attrs;
        const isEdgeClick = rectWidth + rectX - xWithScroll < 10;
        const isSelected = this.sectionSelection.has(sectionElement);
        if (isEdgeClick) {
            if (!isSelected) {
                this.clearSelection();
                this.addSectionToSelection(sectionElement);
            }
            this.dragMode = ArrangerDragModes.adjustSectionLength
        } else {
            this.dragMode = ArrangerDragModes.adjustSectionPosition;
        }
    }

    handleInteractionUpdate(e: KonvaEvent) : void {
        switch (this.dragMode) {
            case ArrangerDragModes.adjustSectionLength:
                this.handleAdjustSectionLengthInteractionUpdate(e);
                break;
            case ArrangerDragModes.adjustSectionPosition:
                this.handleAdjustSectionPositionInteractionUpdate(e);
                break;
            case ArrangerDragModes.adjustSelection:
                this.handleAdjustSelectionInteractionUpdate(e);
                break;
        }
    }

    handleAdjustSectionLengthInteractionUpdate(e: KonvaEvent) : void {
        const { rawX, rawY } = this.extractInfoFromEventObject(e);
        //this.nudgeGridIfRequired(rawX, rawY, NudgeDirections.horizontal);
        const xWithScroll = rawX - this.xScroll;
        const selectedSectionIds = this.sectionSelection.retrieveAll();
        const selectedSectionElements = this.sectionCache.retrieve(selectedSectionIds);
        this.sectionLayer.updateSectionDurations(
            this.mouseStateManager.x, 
            xWithScroll, 
            selectedSectionElements
        );
    }

    handleAdjustSectionPositionInteractionUpdate(e: KonvaEvent) : void {
        const { rawX, rawY } = this.extractInfoFromEventObject(e);
        //this.nudgeGridIfRequired(rawX, rawY, NudgeDirections.both);
        const xWithScroll = rawX - this.xScroll;
        const yWithScroll = rawY - this.yScroll;
        this.mouseStateManager.updateHasTravelled(xWithScroll, yWithScroll);
        const xDelta = this.conversionManager.roundToGridCol(
            xWithScroll - this.mouseStateManager.x
        );
        const yDelta = this.conversionManager.roundToGridRow(
            yWithScroll - this.mouseStateManager.y
        );
        const selectedSectionIds = this.sectionSelection.retrieveAll();
        const selectedSectionElements = this.sectionCache.retrieve(selectedSectionIds);
        this.sectionLayer.repositionSections(xDelta, yDelta, selectedSectionElements);
    }

    handleAdjustSelectionInteractionUpdate(e: KonvaEvent) : void {
        const { rawX, rawY } = this.extractInfoFromEventObject(e);
        //this.nudgeGridIfRequired(rawX, rawY, NudgeDirections.both);
        const currentX = rawX - this.xScroll;
        const currentY = rawY - this.yScroll;
        const mouseDownX = this.mouseStateManager.x;
        const mouseDownY = this.mouseStateManager.y;
        const selectionX1 = Math.min(mouseDownX, currentX);
        const selectionX2 = Math.max(mouseDownX, currentX);
        const selectionY1 = Math.min(mouseDownY, currentY);
        const selectionY2 = Math.max(mouseDownY, currentY);
        this.sectionLayer.updateSelectionMarquee(selectionX1, selectionY1, selectionX2, selectionY2);
        this.reconcileSectionSelectionWithSelectionArea(selectionX1, selectionY1, selectionX2, selectionY2);
    }

    handleInteractionEnd(e: KonvaEvent) : void {
        switch (this.dragMode) {
            case ArrangerDragModes.adjustSectionLength:
                this.handleAdjustSectionLengthInteractionEnd(e);
                break;
            case ArrangerDragModes.adjustSectionPosition:
                this.handleAdjustSectionPositionInteractionEnd(e);
                break;
            case ArrangerDragModes.adjustSelection:
                this.handleAdjustSelectionInteractionEnd(e);
                break;
        }
    }

    handleAdjustSectionLengthInteractionEnd(e: KonvaEvent) : void {
        this.dragMode = null;
        const selectedSectionIds = this.sectionSelection.retrieveAll();
        const selectedSectionElements = this.sectionCache.retrieve(selectedSectionIds);
        this.sectionLayer.updateSectionsAttributeCaches(selectedSectionElements);
        // trigger update in audio engine and serialize state to update history stack.
        selectedSectionElements.forEach(el => this.audioReconciler.addSection(el));
    }

    handleAdjustSectionPositionInteractionEnd(e: KonvaEvent) : void {
        this.dragMode = null;
        if (!this.mouseStateManager.hasTravelled) {
            const { target } = e;
            const isCurrentlySelected = this.sectionSelection.has(target);
            if (this.keyboardStateManager.shiftKey) {
                if (isCurrentlySelected) {
                    this.removeSectionFromSelection(target);
                } else {
                    this.addSectionToSelection(target);
                }
            } else {
                this.clearSelection();
                if (!isCurrentlySelected) {
                    this.addSectionToSelection(target);
                }
            }
        }
        const selectedSectionIds = this.sectionSelection.retrieveAll();
        const selectedSectionElements = this.sectionCache.retrieve(selectedSectionIds);
        this.sectionLayer.updateSectionsAttributeCaches(selectedSectionElements);
        // then update the audio engine and history stack.
        selectedSectionElements.forEach(sectionElement => this.audioReconciler.addSection(sectionElement));
    }

    handleAdjustSelectionInteractionEnd(e: KonvaEvent) : void {
        this.dragMode = null;
        this.sectionLayer.clearSelectionMarquee();
        // serialize state
    }

    
}