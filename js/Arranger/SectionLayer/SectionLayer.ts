import Konva from 'konva';
import ConversionManager from '../ConversionManager';
import { 
    Colours,
    StaticMeasurements 
} from '../../Constants';

/*

Features: 

- add sections with pencil.

- select sections with cursor.

- equivalent selection operation to PianoRoll class.

- select sections with marquee tool.

- shift sections up or down if permissible. In this context that means transferring a section from one channel
to another. 

- shift selections back to the previous bar or forwards to the next bar if permissible. 

- copy / cut / paste / delete operations on one or more sections.

- double click sectons to open a PianoRoll window for that section. 

- mousedown on a section when cursor tool is active to begin dragging it to a new position (which will affect
the start time for the audio engines Section instance and the channel that it is assigned to).

- mousedown on the edge of a section to resize it, which means altering the number of bars that the audio
engines Section instance lasts for.  

*/


export default class SectionLayer {

    private layer: Konva.Layer;
    private conversionManager: ConversionManager;
    private sectionsContainer: Konva.Group;

    constructor(conversionManager: ConversionManager, layerRef: Konva.Layer) {
        this.conversionManager = conversionManager;
        this.layer = layerRef;
        this.sectionsContainer = new Konva.Group({ 
            y: this.conversionManager.seekerAreaHeight,
            x: StaticMeasurements.channelInfoColWidth 
        });
    }

    init() : void {
        this.layer.add(this.sectionsContainer);
        this.layer.batchDraw();
    }

    updateX(x: number) : void {
        this.sectionsContainer.x(x);
        this.layer.batchDraw();
    }

    updateY(y: number) : void {
        this.sectionsContainer.y(y);
        this.layer.batchDraw();
    }

    redrawOnZoomAdjustment(isZoomingIn: boolean) : void {

    }

    createSectionElement(x: number, y: number, width: number, id: string, isSelected: boolean) : Konva.Rect {
        return new Konva.Rect({
            x,
            y,
            width,
            height: this.conversionManager.rowHeight,
            fill: isSelected ? Colours.grayscale[6] : Colours.primary.main,
            stroke: Colours.grayscale[7],
            strokeWidth: 1,
            cornerRadius: 2,
            id,
            cachedWidth: width,
            cachedX: x, 
            cachedY: y,
            name: 'SECTION'
        });
    }

    addNewSection(x: number, y: number, id: string, width?: number) : Konva.Rect {
        const newSection = this.createSectionElement(
            x,
            y,
            width || this.conversionManager.colWidth,
            id,
            true
        );
        newSection.moveTo(this.sectionsContainer);
        this.layer.batchDraw();
        return newSection;
    }

    private updateSingleSectionDuration(sectionRect: Konva.Rect, xDelta: number) : void {
        const newWidth = Math.max(
            sectionRect.attrs.cachedWidth + xDelta,
            this.conversionManager.colWidth
        );
        sectionRect.width(newWidth);
    }

    updateSectionDurations(originX: number, terminalX: number, sectionRectsArray: Konva.Rect[]) : void {
        const xDelta = this.conversionManager.roundToGridCol(
            terminalX - originX
        );
        sectionRectsArray.forEach(sectionRect => {
            this.updateSingleSectionDuration(sectionRect, xDelta);
        });
        this.layer.batchDraw();
    }

    updateSectionsAttributeCaches(sectionRectsArray: Konva.Rect[]) : void {
        sectionRectsArray.forEach(sectionRect => {
            sectionRect.setAttr('cachedWidth', sectionRect.attrs.width);
            sectionRect.setAttr('cachedX', sectionRect.attrs.x);
            sectionRect.setAttr('cachedY', sectionRect.attrs.y);
        });
    }

    deleteSections(sectionRectsArray: Konva.Rect[]) : void {
        sectionRectsArray.forEach(sectionRect => sectionRect.destroy());
        this.layer.batchDraw();
    }

    repositionSections(xDelta: number, yDelta: number, sectionRectsArray: Konva.Rect[]) : void {
        sectionRectsArray.forEach(sectionRect => {
            const { cachedX, cachedY } = sectionRect.attrs;
            const newX = Math.max(
                cachedX + xDelta,
                0
            );
            const newY = Math.max(
                cachedY + yDelta,
                0
            );
            sectionRect.x(newX);
            sectionRect.y(newY);
        });
        this.layer.batchDraw();
    }

    updateSelectionMarquee(originX: number, originY: number, terminalX: number, terminalY: number) : void {
        const marquee = this.layer.findOne('#MARQUEE');
        if (!marquee) {
            const newMarquee = new Konva.Rect({
                x: originX,
                y: originY,
                width: terminalX - originX,
                height: terminalY - originY,
                fill: Colours.tertiary.main,
                opacity: 0.4,
                id: 'MARQUEE'
            });
            newMarquee.moveTo(this.sectionsContainer);
        } else {
            marquee.x(originX);
            marquee.y(originY);
            marquee.width(terminalX - originX);
            marquee.height(terminalY - originY);
        }
        this.layer.batchDraw();
    }

    clearSelectionMarquee() : void {
        const marquee = this.layer.findOne('#MARQUEE');
        if (marquee) {
            marquee.destroy();
            this.layer.batchDraw();
        }
    }

    addSelectedAppearance(sectionRect: Konva.Rect) : void {
        sectionRect.fill(Colours.grayscale[6]);
        this.layer.batchDraw();
    }

    removeSelectedAppearance(sectionRect: Konva.Rect) : void {
        sectionRect.fill(Colours.primary.main);
        this.layer.batchDraw();
    }   

    shiftSectionsVertically(sectionRectsArray: Konva.Rect[], shouldShiftUp: boolean) : void {
        const shiftDelta = shouldShiftUp ? 
            this.conversionManager.rowHeight * -1 :
            this.conversionManager.rowHeight;
        sectionRectsArray.forEach(sectionRect => {
            sectionRect.y(
                sectionRect.y() + shiftDelta
            );
        });
        this.layer.batchDraw();
        this.updateSectionsAttributeCaches(sectionRectsArray);
    }

    shiftSectionsHorizontally(sectionRectsArray: Konva.Rect[], shouldShiftLeft: boolean) : void {
        const shiftDelta = shouldShiftLeft ? 
            this.conversionManager.colWidth * -1 :
            this.conversionManager.colWidth;
        sectionRectsArray.forEach(sectionRect => {
            sectionRect.x(
                sectionRect.x() + shiftDelta
            );
        });
        this.layer.batchDraw();
        this.updateSectionsAttributeCaches(sectionRectsArray);
    }

    // todo
    forceToState(state) : void {

    }

}
