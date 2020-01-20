import { Layer, Rect, Group, Text } from 'konva';
import {
    SCROLLBAR_WIDTH
} from '../constants';
import { createContextMenu } from '../createContextMenu';

export default class VelocityLayer {
    
    constructor(conversionManager) {
        //this.layer = new Layer({ x: 120 });
        this.layer = new Layer();
        this._conversionManager = conversionManager;
        this._layerGroup = new Group({ x: 120 });
        this._background = this._constructBackground();
        this._border = this._constructBorder();
        this._unselectedGroup = new Group();
        this._selectedGroup = new Group();
    }

    updateX(x) {
        //this.layer.x(x);
        this._layerGroup.x(x);
        this.layer.batchDraw();
    }

    redrawOnZoomAdjustment(isZoomingIn) {
        this._background.width(
            isZoomingIn ? this._background.width() * 2 : this._background.width() * 0.5
        );
        this._border.width(
            isZoomingIn ? this._border.width() * 2 : this._border.width() * 0.5
        );
        const velocityElements = this.layer.find('.VELOCITY_MARKER');
        velocityElements.forEach(velocityElement => {
            velocityElement.x(
                isZoomingIn ? velocityElement.x() * 2 : velocityElement.x() * 0.5
            );
        });
        this.layer.batchDraw();
    }

    redrawOnVerticalResize() {
        const delta = this._conversionManager.stageHeight - SCROLLBAR_WIDTH - this._conversionManager.velocityAreaHeight - this._background.attrs.y;
        const allRects = this.layer.find('Rect');
        allRects.forEach(rect => {
            rect.y(
                rect.y() + delta
            );
        });
        this.layer.batchDraw();
    }

    redrawOnHeightChange(height) {
        console.log(`redrawOnHeightChange called with height: ${height}`);
        this._background.height(height);
        this._background.y(
            this._conversionManager.stageHeight - height - SCROLLBAR_WIDTH
        );
        this._border.y(
            this._conversionManager.stageHeight - height - SCROLLBAR_WIDTH
        );
        const velocityMarkers = this.layer.find('.VELOCITY_MARKER');
        velocityMarkers.forEach(velocityMarker => {
            const newMarkerHeight = velocityMarker.attrs.velocity * (height - 10);
            velocityMarker.height(newMarkerHeight);
            velocityMarker.y(
                this._conversionManager.stageHeight - SCROLLBAR_WIDTH - newMarkerHeight
            );
        });
        this.layer.batchDraw();
    }

    _constructBackground() {
        const background = new Rect({
            width: this._conversionManager.gridWidth,
            height: this._conversionManager.velocityAreaHeight,
            x: 0,
            y: this._conversionManager.stageHeight - SCROLLBAR_WIDTH - this._conversionManager.velocityAreaHeight,
            fill: '#acacac',
            id: 'VELOCITY_BACKGROUND'
        });
        return background;
    }

    _constructBorder() {
        const border = new Rect({
            width: this._conversionManager.gridWidth,
            height: 3,
            x: 0,
            y: this._conversionManager.stageHeight - SCROLLBAR_WIDTH - this._conversionManager.velocityAreaHeight,
            fill: '#222',
            id: 'VELOCITY_BORDER'
        });
        return border;
    }

    _createVelocityMarker(x, y, height, id, isSelected, velocity) {
        const velocityMarker = new Rect({
            x,
            y,
            width: 8,
            height,
            fill: isSelected ? '#222' : 'green',
            id,
            cachedX: x,
            name: 'VELOCITY_MARKER',
            velocity
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
            this._conversionManager.stageHeight - SCROLLBAR_WIDTH - (this._conversionManager.velocityAreaHeight - 10),
            (this._conversionManager.velocityAreaHeight - 10),
            id,
            true,
            1
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

    updateSelectionMarquee(x1, y1, x2, y2) {
        const marquee = this.layer.findOne('#MARQUEE');
        if (!marquee) {
            const newMarquee = new Rect({
                x: x1,
                y: y1,
                width: x2 - x1,
                height: y2 - y1,
                fill: '#08b5d3',
                opacity: 0.4,
                id: 'MARQUEE'
            }); 
            newMarquee.moveTo(this._layerGroup);
        } else {
            marquee.x(x1);
            marquee.y(y1);
            marquee.width(x2 - x1);
            marquee.height(y2 - y1);
        }
        this.layer.batchDraw();
    }

    clearSelectionMarquee() {
        const marquee = this.layer.findOne('#MARQUEE');
        if (marquee) {
            marquee.destroy();
            this.layer.batchDraw();
        }
    }

    draw() {
        this.layer.removeChildren();
        this._background.moveTo(this._layerGroup);
        this._border.moveTo(this._layerGroup);
        this._unselectedGroup.moveTo(this._layerGroup);
        this._selectedGroup.moveTo(this._unselectedGroup);
        this.layer.add(this._layerGroup);
        this.layer.batchDraw();
    }

    updateVelocityMarkersHeight(velocityRectsArray, velocityValue) {
        const newHeight = velocityValue * (this._conversionManager.velocityAreaHeight - 10);
        const newY = this._conversionManager.stageHeight - SCROLLBAR_WIDTH - newHeight;
        velocityRectsArray.forEach(velocityRect => {
            velocityRect.setAttr('velocity', velocityValue);
            velocityRect.height(newHeight);
            velocityRect.y(newY);
        });
        this.layer.batchDraw();
    }

    addContextMenu(rawX, rawY, menuItems) {
        const contextMenuGroup = createContextMenu({
            rawX,
            rawY,
            rightBoundary: this._conversionManager.stageWidth - SCROLLBAR_WIDTH,
            bottomBoundary: this._conversionManager.stageHeight - SCROLLBAR_WIDTH,
            batchDrawCallback: () => this.layer.batchDraw(),
            menuItems: menuItems
        });
        this.layer.add(contextMenuGroup);
        this.layer.batchDraw();
    }

    removeContextMenu() {
        const contextMenu = this.layer.findOne('#CONTEXT_MENU_GROUP');
        if (contextMenu) {
            contextMenu.destroy();
            this.layer.batchDraw();
        }
    }

    forceToState(state) {
        // delete all velocity markers from the layer.
        const existingVelocityElements = this.layer.find('.VELOCITY_MARKER');
        existingVelocityElements.forEach(el => el.destroy());

        const newVelocityMarkerElements = state.notes.map(note => {
            // calculate x, y, height, id, isSelected
            const x = this._conversionManager.convertTicksToPx(note.time);
            const height = note.velocity * (this._conversionManager.velocityAreaHeight - 10);
            const y = this._conversionManager.stageHeight - SCROLLBAR_WIDTH - height;
            const isSelected = state.selectedNoteIds.includes(note.id);
            const velocityMarkerElement = this._createVelocityMarker(
                x,
                y,
                height,
                note.id,
                isSelected,
                note.velocity
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