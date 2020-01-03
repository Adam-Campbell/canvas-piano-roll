import { Layer, Rect, Group } from 'konva';
import {
    STAGE_HEIGHT,
    SCROLLBAR_WIDTH
} from '../constants';

export default class VelocityLayer {
    constructor(conversionManager) {
        this.layer = new Layer({ x: 120 });
        this._conversionManager = conversionManager;
        this._background = this._constructBackground();
        this._border = this._constructBorder();
        this._unselectedGroup = new Group();
        this._selectedGroup = new Group();
        this._hasActiveInteraction = true;
    }

    updateX(x) {
        this.layer.x(x);
        this.layer.batchDraw();
    }

    _constructBackground() {
        const background = new Rect({
            width: this._conversionManager.gridWidth,
            height: 60,
            x: 0,
            y: STAGE_HEIGHT - SCROLLBAR_WIDTH - 60,
            fill: '#acacac'
        });
        return background;
    }

    _constructBorder() {
        const border = new Rect({
            width: this._conversionManager.gridWidth,
            height: 2,
            x: 0,
            y: STAGE_HEIGHT - SCROLLBAR_WIDTH - 60,
            fill: '#222'
        });
        return border;
    }

    _createVelocityMarker(x, y, height, id, isSelected) {
        const velocityMarker = new Rect({
            x,
            y,
            width: 8,
            height,
            fill: isSelected ? '#222' : 'green',
            id,
            cachedX: x,
            name: 'VELOCITY_MARKER'
        });
        if (isSelected) {
            velocityMarker.moveTo(this._selectedGroup);
        } else {
            velocityMarker.moveTo(this._unselectedGroup);
        }
        return velocityMarker;
    }

    addNewVelocityMarker(x, id) {
        const velocityMarker = this._createVelocityMarker(
            x,
            STAGE_HEIGHT - SCROLLBAR_WIDTH - 50,
            50,
            id,
            true
        );
        this.layer.batchDraw();
        return velocityMarker;
    }


    deleteVelocityMarkers(velocityRectsArray) {
        velocityRectsArray.forEach(velocityRect => {
            velocityRect.destroy();
        });
        this.layer.batchDraw();
    }

    updateVelocityMarkersAttributeCaches(velocityRectsArray) {
        velocityRectsArray.forEach(velocityRect => {
            velocityRect.setAttr('cachedX', velocityRect.attrs.x);
        });
    }

    repositionVelocityMarkers(xDelta, velocityRectsArray) {
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

    shiftVelocityMarkersLeft(velocityRectsArray) {
        velocityRectsArray.forEach(velocityRect => {
            velocityRect.x(
                velocityRect.x() - this._conversionManager.colWidth
            );
        });
        this.layer.batchDraw();
    }

    shiftVelocityMarkersRight(velocityRectsArray) {
        velocityRectsArray.forEach(velocityRect => {
            velocityRect.x(
                velocityRect.x() + this._conversionManager.colWidth
            );
        });
        this.layer.batchDraw();
    }

    addSelectedAppearance(velocityRect) {
        velocityRect.fill('#222');
        velocityRect.moveTo(this._selectedGroup);
        this.layer.batchDraw();
    }

    removeSelectedAppearance(velocityRect) {
        velocityRect.fill('green');
        velocityRect.moveTo(this._unselectedGroup);
        this.layer.batchDraw();
    }

    draw() {
        this.layer.add(this._background);
        this.layer.add(this._border);
        this.layer.add(this._unselectedGroup);
        this.layer.add(this._selectedGroup);
        this.layer.batchDraw();
    }

    updateVelocityMarkersHeight(velocityRectsArray, newHeight) {
        velocityRectsArray.forEach(velocityRect => {
            const { y, height } = velocityRect.attrs;
            velocityRect.height(newHeight);
            velocityRect.y(STAGE_HEIGHT - SCROLLBAR_WIDTH - newHeight);
        });
        this.layer.batchDraw();
    }

    forceToState(state) {
        // delete all velocity markers from the layer.
        const existingVelocityElements = this.layer.find('.VELOCITY_MARKER');
        existingVelocityElements.forEach(el => el.destroy());

        const newVelocityMarkerElements = state.notes.map(note => {
            // calculate x, y, height, id, isSelected
            const x = this._conversionManager.convertTicksToPx(note.time);
            const height = note.velocity * 50;
            const y = STAGE_HEIGHT - SCROLLBAR_WIDTH - height;
            const isSelected = state.selectedNoteIds.includes(note.id);
            const velocityMarkerElement = this._createVelocityMarker(
                x,
                y,
                height,
                note.id,
                isSelected
            );
            return velocityMarkerElement;
        });
        this.layer.batchDraw();
        return newVelocityMarkerElements;

        // map over the notes and use the addNewVelocityMarker method to create a 
        // velocity marker element for each note. Same as with note layer, return this
        // from the map function so the end result is an array of the velocity marker
        // elements, that the PianoRoll class can use to updated velocityMarkerCache. 

    }

}