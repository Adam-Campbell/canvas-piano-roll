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

    addNewVelocityMarker(x, id) {
        const velocityMarker = new Rect({
            width: 8,
            height: 50,
            cornerRadius: [2, 2, 0, 0],
            x,
            y: STAGE_HEIGHT - SCROLLBAR_WIDTH - 50,
            fill: '#222',
            id,
            cachedX: x,
            name: 'VELOCITY_MARKER'
        });
        velocityMarker.moveTo(this._selectedGroup);
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

}