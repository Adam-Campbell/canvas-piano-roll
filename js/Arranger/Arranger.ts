import Konva from 'konva';
import GridLayer from './GridLayer';
import ConversionManager from './ConversionManager';
import SectionLayer from './SectionLayer';
import CanvasElementCache from './CanvasElementCache';
import MouseStateManager from './MouseStateManager';
import KeyboardStateManager from './KeyboardStateManager';
import SectionSelection from './SectionSelection';
import {
    ArrangerDragModes,
    Tools,
    KonvaEvent,
    Events
} from '../Constants';
import { genId } from '../genId';
import { pipe, doesOverlap } from '../utils';
import EventEmitter from '../EventEmitter';


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
    private _xScroll: number;
    private _yScroll: number;
    

    constructor(eventEmitter: EventEmitter) {
        this.dragMode = null;
        this.activeTool = Tools.cursor;
        this._xScroll = 0;
        this._yScroll = 0;
        this.emitter = eventEmitter;
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

    init() {
        this.instantiateChildClasses();
        this.stage.add(this.primaryBackingLayer);
        this.gridLayer.init();
        this.sectionLayer.init();
        this.registerStageSubscriptions();
        this.registerKeyboardSubscriptions();
        this.registerGlobalEventSubscriptions();
    }

    instantiateChildClasses() : void {
        this.stage = new Konva.Stage({
            container: 'arranger-container',
            width: 750,
            height: 600
        });
        this.conversionManager = new ConversionManager({
            stageWidth: 750,
            stageHeight: 600,
            barWidth: 40,
            barHeight: 40,
            numBars: 16,
            numChannels: 4
        });
        this.mouseStateManager = new MouseStateManager();
        this.keyboardStateManager = new KeyboardStateManager(this.stage.container());
        this.sectionCache = new CanvasElementCache();
        this.sectionSelection = new SectionSelection();
        this.primaryBackingLayer = new Konva.Layer();
        this.gridLayer = new GridLayer(this.conversionManager, this.primaryBackingLayer);
        this.sectionLayer = new SectionLayer(this.conversionManager, this.primaryBackingLayer);
    }

    private addNewSection(x: number, y: number, width?: number) : Konva.Rect {
        const id = genId();
        const newSection = this.sectionLayer.addNewSection(x, y, id, width);
        this.sectionCache.add(newSection);
        this.sectionSelection.add(newSection);
        return newSection;
    }

    private registerStageSubscriptions() {
        this.stage.on('mousedown', (e: KonvaEvent) => this.handleInteractionStart(e));
        this.stage.on('mousemove', (e: KonvaEvent) => this.handleInteractionUpdate(e));
        this.stage.on('mouseup', (e: KonvaEvent) => this.handleInteractionEnd(e));
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
    }

    private registerGlobalEventSubscriptions() : void {
        this.emitter.subscribe(Events.activeToolUpdate, tool => {
            this.activeTool = tool;
            console.log(this.activeTool);
        });
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

        if (this.activeTool === Tools.marquee) {
            this.dragMode = ArrangerDragModes.adjustSelection;

        } else if (this.activeTool === Tools.pencil) {
            this.dragMode = ArrangerDragModes.adjustSectionLength;
            this.clearSelection()
            this.addNewSection(roundedX, roundedY);

        } else if (this.activeTool === Tools.cursor) {
            const targetIsSection = target.name() === 'SECTION';
            if (targetIsSection) {
                this.handleSectionInteractionStart(target, xWithScroll); 
            }
        }
    }

    handleSectionInteractionStart(sectionElement: Konva.Rect, xWithScroll: number) : void {

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
    }

    handleAdjustSectionPositionInteractionEnd(e: KonvaEvent) : void {
        this.dragMode = null;
    }

    handleAdjustSelectionInteractionEnd(e: KonvaEvent) : void {
        this.dragMode = null;
        this.sectionLayer.clearSelectionMarquee();
        // serialize state
    }

    
}
