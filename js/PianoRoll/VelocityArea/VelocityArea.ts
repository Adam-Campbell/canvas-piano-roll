import Konva from 'konva';
import Tone from 'tone';
import {
    Colours,
    SerializedState,
    StaticMeasurements
} from '../../Constants';
import PianoRollConversionManager from '../PianoRollConversionManager';
import { SerializedSectionState } from '../../AudioEngine/AudioEngineConstants'; 
import { NoteBBS } from '../../Constants'; 

export default class VelocityArea {

    private conversionManager: PianoRollConversionManager;
    private layer: Konva.Layer;
    private layerGroup: Konva.Group;
    private background: Konva.Rect;
    private border: Konva.Rect;
    private unselectedGroup: Konva.Group;
    private selectedGroup: Konva.Group;
    
    constructor(
        conversionManager: PianoRollConversionManager, 
        layerRef: Konva.Layer
    ) {
        this.conversionManager = conversionManager;
        this.layer = layerRef;
        this.layerGroup = new Konva.Group({ x: 120 });
        this.background = this.constructBackground();
        this.border = this.constructBorder();
        this.unselectedGroup = new Konva.Group();
        this.selectedGroup = new Konva.Group();
    }

    /**
     * Initializes the velocity area and redraws the layer.
     */
    init() : void {
        this.background.moveTo(this.layerGroup);
        this.border.moveTo(this.layerGroup);
        this.unselectedGroup.moveTo(this.layerGroup);
        this.selectedGroup.moveTo(this.layerGroup);
        this.layer.add(this.layerGroup);
        this.layer.batchDraw();
    }

    /**
     * Adjusts the position of the velocity area along the x axis according to the given x value. 
     */
    updateX(x) : void {
        this.layerGroup.x(x);
        this.layer.batchDraw();
    }

    /**
     * Redraws the layer when the zoom level of the parent stage updates. 
     */
    redrawOnZoomAdjustment(isZoomingIn: boolean) : void {
        const multiplier = isZoomingIn ? 2 : 0.5;
        this.background.width(this.background.width() * multiplier);
        this.border.width(this.border.width() * multiplier);
        const velocityElements = this.layer.find('.VELOCITY_MARKER');
        velocityElements.forEach(velocityElement => {
            velocityElement.x(velocityElement.x() * multiplier);
        });
        this.layer.batchDraw();
    }

    /**
     * Redraws the velocity area when the size of the parent stage updates.
     */
    redrawOnResize() : void {
        const delta = this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth - this.conversionManager.velocityAreaHeight - this.background.attrs.y;
        const allRects = this.layerGroup.find('Rect');
        allRects.forEach(rect => {
            rect.y(
                rect.y() + delta
            );
        });
        this.layer.batchDraw();
    }

    /**
     * Redraws the velocity area when the height of the velocity area itself has updated as
     * a result of user interaction.
     */
    redrawOnHeightChange(height: number) : void {
        this.background.height(height);
        this.background.y(
            this.conversionManager.stageHeight - height - StaticMeasurements.scrollbarWidth
        );
        this.border.y(
            this.conversionManager.stageHeight - height - StaticMeasurements.scrollbarWidth
        );
        const velocityMarkers = this.layer.find('.VELOCITY_MARKER');
        velocityMarkers.forEach(velocityMarker => {
            const newMarkerHeight = velocityMarker.attrs.velocity * (height - 10);
            velocityMarker.height(newMarkerHeight);
            velocityMarker.y(
                this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth - newMarkerHeight
            );
        });
        this.layer.batchDraw();
    }

    /**
     * Constructs and returns the background for the velocity area. 
     */
    private constructBackground() : Konva.Rect {
        const background = new Konva.Rect({
            width: this.conversionManager.gridWidth,
            height: this.conversionManager.velocityAreaHeight,
            x: 0,
            y: this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth - this.conversionManager.velocityAreaHeight,
            fill: Colours.grayscale[2],
            id: 'VELOCITY_BACKGROUND'
        });
        return background;
    }

    /**
     * Constructs and returns the border for the velocity area. 
     */
    private constructBorder() : Konva.Rect {
        const border = new Konva.Rect({
            width: this.conversionManager.gridWidth,
            height: 3,
            x: 0,
            y: this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth - this.conversionManager.velocityAreaHeight,
            fill: Colours.grayscale[6],
            id: 'VELOCITY_BORDER'
        });
        return border;
    }

    /**
     * Constructs a velocity marker from the arguments provided and adds it to the layer, then returns
     * the velocity marker element, however does not trigger a redraw of the layer. 
     */
    createVelocityMarker(
        x: number, 
        y: number, 
        height: number, 
        id: string, 
        isSelected: boolean, 
        velocity: number
    ) : Konva.Rect {
        const velocityMarker = new Konva.Rect({
            x,
            y,
            width: 8,
            height,
            fill: isSelected ? Colours.grayscale[6] : Colours.primary.darkened,
            cornerRadius: [2,2,0,0],
            id,
            cachedX: x,
            name: 'VELOCITY_MARKER',
            velocity
        });
        if (isSelected) {
            velocityMarker.moveTo(this.selectedGroup);
        } else {
            velocityMarker.moveTo(this.unselectedGroup);
        }
        return velocityMarker;
    }

    /**
     * Adds a new velocity marker to the layer, redraws the layer and then returns the newly 
     * created velocity marker.
     */
    addNewVelocityMarker(x: number, id: string) : Konva.Rect {
        const velocityMarker = this.createVelocityMarker(
            x,
            this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth - (this.conversionManager.velocityAreaHeight - 10),
            (this.conversionManager.velocityAreaHeight - 10),
            id,
            true,
            1
        );
        this.layer.batchDraw();
        return velocityMarker;
    }

    /**
     * Deletes the given velocity layers and then redraws the layer.
     */
    deleteVelocityMarkers(velocityRectsArray: Konva.Rect[]) : void {
        velocityRectsArray.forEach(velocityRect => {
            velocityRect.destroy();
        });
        this.layer.batchDraw();
    }

    /**
     * Updates the `cached` namespaced attributes for the given velocity markers to match their
     * counterparts.
     */
    updateVelocityMarkersAttributeCaches(velocityRectsArray: Konva.Rect[]) : void {
        velocityRectsArray.forEach(velocityRect => {
            velocityRect.setAttr('cachedX', velocityRect.attrs.x);
        });
    }

    /**
     * Reposition the given velocity markers based on the x delta supplied. 
     */
    repositionVelocityMarkers(xDelta: number, velocityRectsArray: Konva.Rect[]) : void {
        velocityRectsArray.forEach(velocityRect => {
            const { cachedX } = velocityRect.attrs;
            const newX = Math.max(
                cachedX + xDelta,
                0
            );
            velocityRect.x(newX);
        });
        this.layer.batchDraw();
    }

    /**
     * Shift the given velocity markers to the left by the grids current column width.
     */
    shiftVelocityMarkersLeft(velocityRectsArray: Konva.Rect[]) : void {
        velocityRectsArray.forEach(velocityRect => {
            velocityRect.x(
                velocityRect.x() - this.conversionManager.colWidth
            );
        });
        this.layer.batchDraw();
    }

    /**
     * Shift the given velocity markers to the right by the grids current column width. 
     */
    shiftVelocityMarkersRight(velocityRectsArray: Konva.Rect[]) : void {
        velocityRectsArray.forEach(velocityRect => {
            velocityRect.x(
                velocityRect.x() + this.conversionManager.colWidth
            );
        });
        this.layer.batchDraw();
    }

    /**
     * Add the selected appearance to the given velocity marker. 
     */
    addSelectedAppearance(velocityRect: Konva.Rect) : void {
        velocityRect.fill(Colours.grayscale[6]);
        velocityRect.moveTo(this.selectedGroup);
        this.layer.batchDraw();
    }

    /**
     * Removes the selected appearance from the given velocity marker. 
     */
    removeSelectedAppearance(velocityRect: Konva.Rect) : void {
        velocityRect.fill(Colours.primary.darkened);
        velocityRect.moveTo(this.unselectedGroup);
        this.layer.batchDraw();
    }

    /**
     * Updates the selection marquee based on the coordinates given. If a marquee doesn't
     * already exist in the velocity area then it creates one.
     */
    updateSelectionMarquee(x1: number, y1: number, x2: number, y2: number) : void {
        const marquee = this.layer.findOne('#MARQUEE');
        if (!marquee) {
            const newMarquee = new Konva.Rect({
                x: x1,
                y: y1,
                width: x2 - x1,
                height: y2 - y1,
                fill: Colours.tertiary.main,
                opacity: 0.4,
                id: 'MARQUEE'
            }); 
            newMarquee.moveTo(this.layerGroup);
        } else {
            marquee.x(x1);
            marquee.y(y1);
            marquee.width(x2 - x1);
            marquee.height(y2 - y1);
        }
        this.layer.batchDraw();
    }

    /**
     * Removes the marquee from the velocity area, if one exists.
     */
    clearSelectionMarquee() : void {
        const marquee = this.layer.findOne('#MARQUEE');
        if (marquee) {
            marquee.destroy();
            this.layer.batchDraw();
        }
    }

    /**
     * Updates the height of the given velocity markers based on the given velocityValue. 
     */
    updateVelocityMarkersHeight(velocityRectsArray: Konva.Rect[], velocityValue: number) : void {
        const newHeight = velocityValue * (this.conversionManager.velocityAreaHeight - 10);
        const newY = this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth - newHeight;
        velocityRectsArray.forEach(velocityRect => {
            velocityRect.setAttr('velocity', velocityValue);
            velocityRect.height(newHeight);
            velocityRect.y(newY);
        });
        this.layer.batchDraw();
    }

    /**
     * Updates the velocity markers to match the serialized state provided, then returns the
     * velocity markers. 
     */
    forceToState(state: SerializedSectionState) : Konva.Rect[] {
        // delete all velocity markers from the layer.
        const existingVelocityElements = this.layer.find('.VELOCITY_MARKER');
        existingVelocityElements.forEach(el => el.destroy());

        const velocityMarkerElements = Object.values(state.notes).map((note: NoteBBS) => {
            const velocityRectX = this.conversionManager.convertTicksToPx(
                Tone.Ticks(note.time).toTicks()
            );
            const velocityRectHeight = note.velocity * (this.conversionManager.velocityAreaHeight - 10);
            const velocityRectY = this.conversionManager.stageHeight - 
                StaticMeasurements.scrollbarWidth - velocityRectHeight;
            const velocityRectId = note.id;
            const velocityRect = this.createVelocityMarker(
                velocityRectX,
                velocityRectY,
                velocityRectHeight,
                velocityRectId,
                false,
                note.velocity
            );
            return velocityRect;
        });
        this.layer.batchDraw();
        return velocityMarkerElements;

    }

}
