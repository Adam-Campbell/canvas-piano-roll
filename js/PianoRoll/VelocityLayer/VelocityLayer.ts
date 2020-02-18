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

export default class VelocityLayer {

    private conversionManager: PianoRollConversionManager;
    private layer: Konva.Layer;
    private layerGroup: Konva.Group;
    private background: Konva.Rect;
    private border: Konva.Rect;
    private unselectedGroup: Konva.Group;
    private selectedGroup: Konva.Group;
    
    constructor(conversionManager: PianoRollConversionManager, layerRef: Konva.Layer) {
        this.conversionManager = conversionManager;
        this.layer = layerRef;
        this.layerGroup = new Konva.Group({ x: 120 });
        this.background = this.constructBackground();
        this.border = this.constructBorder();
        this.unselectedGroup = new Konva.Group();
        this.selectedGroup = new Konva.Group();
    }

    init() : void {
        this.background.moveTo(this.layerGroup);
        this.border.moveTo(this.layerGroup);
        this.unselectedGroup.moveTo(this.layerGroup);
        this.selectedGroup.moveTo(this.layerGroup);
        this.layer.add(this.layerGroup);
        this.layer.batchDraw();
    }

    updateX(x) : void {
        this.layerGroup.x(x);
        this.layer.batchDraw();
    }

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

    redrawOnVerticalResize() : void {
        const delta = this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth - this.conversionManager.velocityAreaHeight - this.background.attrs.y;
        const allRects = this.layerGroup.find('Rect');
        allRects.forEach(rect => {
            rect.y(
                rect.y() + delta
            );
        });
        this.layer.batchDraw();
    }

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

    deleteVelocityMarkers(velocityRectsArray: Konva.Rect[]) : void {
        velocityRectsArray.forEach(velocityRect => {
            velocityRect.destroy();
        });
        this.layer.batchDraw();
    }

    updateVelocityMarkersAttributeCaches(velocityRectsArray: Konva.Rect[]) : void {
        velocityRectsArray.forEach(velocityRect => {
            velocityRect.setAttr('cachedX', velocityRect.attrs.x);
        });
    }

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

    shiftVelocityMarkersLeft(velocityRectsArray: Konva.Rect[]) : void {
        velocityRectsArray.forEach(velocityRect => {
            velocityRect.x(
                velocityRect.x() - this.conversionManager.colWidth
            );
        });
        this.layer.batchDraw();
    }

    shiftVelocityMarkersRight(velocityRectsArray: Konva.Rect[]) : void {
        velocityRectsArray.forEach(velocityRect => {
            velocityRect.x(
                velocityRect.x() + this.conversionManager.colWidth
            );
        });
        this.layer.batchDraw();
    }

    addSelectedAppearance(velocityRect: Konva.Rect) : void {
        velocityRect.fill(Colours.grayscale[6]);
        velocityRect.moveTo(this.selectedGroup);
        this.layer.batchDraw();
    }

    removeSelectedAppearance(velocityRect: Konva.Rect) : void {
        velocityRect.fill(Colours.primary.darkened);
        velocityRect.moveTo(this.unselectedGroup);
        this.layer.batchDraw();
    }

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

    clearSelectionMarquee() : void {
        const marquee = this.layer.findOne('#MARQUEE');
        if (marquee) {
            marquee.destroy();
            this.layer.batchDraw();
        }
    }

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





        // const newVelocityMarkerElements = state.notes.map(note => {
        //     // calculate x, y, height, id, isSelected
        //     const x = this.conversionManager.convertTicksToPx(note.time);
        //     const height = note.velocity * (this.conversionManager.velocityAreaHeight - 10);
        //     const y = this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth - height;
        //     const isSelected = state.selectedNoteIds.includes(note.id);
        //     const velocityMarkerElement = this.createVelocityMarker(
        //         x,
        //         y,
        //         height,
        //         note.id,
        //         isSelected,
        //         note.velocity
        //     );
        //     return velocityMarkerElement;
        // });
        // this.layer.batchDraw();
        // return newVelocityMarkerElements;

        // map over the notes and use the addNewVelocityMarker method to create a 
        // velocity marker element for each note. Same as with note layer, return this
        // from the map function so the end result is an array of the velocity marker
        // elements, that the PianoRoll class can use to updated velocityMarkerCache. 

    }

}
