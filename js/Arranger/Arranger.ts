import Konva from 'konva';
import GridLayer from './GridLayer';
import ConversionManager from './ConversionManager';
import SectionLayer from './SectionLayer';
import {
    ArrangerDragModes,
    Tools,
    KonvaEvent
} from '../Constants';

export default class Arranger {

    private stage: Konva.Stage;
    private conversionManager: ConversionManager;
    private primaryBackingLayer: Konva.Layer;
    private gridLayer: GridLayer;
    private sectionLayer: SectionLayer;
    private dragMode: ArrangerDragModes;
    private activeTool: Tools

    constructor() {
        this.dragMode = null;
        this.activeTool = Tools.cursor;
    }

    init() {
        this.instantiateChildClasses();
        this.stage.add(this.primaryBackingLayer);
        this.gridLayer.init();
        this.sectionLayer.init();
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
        this.primaryBackingLayer = new Konva.Layer();
        this.gridLayer = new GridLayer(this.conversionManager, this.primaryBackingLayer);
        this.sectionLayer = new SectionLayer(this.conversionManager, this.primaryBackingLayer);

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
        if (this.activeTool === Tools.marquee) {
            this.dragMode = ArrangerDragModes.adjustSelection;
        } else if (this.activeTool === Tools.pencil) {
            this.dragMode = ArrangerDragModes.adjustSectionLength;
            // clear selection
            // add new section
        } else if (this.activeTool === Tools.cursor) {
            const targetIsSection = target.name() === 'SECTION';
            if (targetIsSection) {
                // once scrolling is introduced I must swap the rawX below to an xWithScroll.
                this.handleSectionInteractionStart(target, rawX); 
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

    }

    handleAdjustSectionPositionInteractionUpdate(e: KonvaEvent) : void {

    }

    handleAdjustSelectionInteractionUpdate(e: KonvaEvent) : void {

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
    }

    handleAdjustSectionPositionInteractionEnd(e: KonvaEvent) : void {
        this.dragMode = null;
    }

    handleAdjustSelectionInteractionEnd(e: KonvaEvent) : void {
        this.dragMode = null;
    }

    
}
