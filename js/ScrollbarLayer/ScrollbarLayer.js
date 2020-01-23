import { Rect, Group } from 'konva';
import { 
    PIANO_KEY_WIDTH,
    SCROLLBAR_WIDTH,
    SCROLLBAR_THUMB_LENGTH,
    SCROLLBAR_GUTTER
} from '../constants';
import { clamp } from '../utils';

export default class ScrollbarLayer {

    constructor(scrollManager, conversionManager, layerRef) {
        this.layer = layerRef;
        this._layerGroup = new Group();
        this._conversionManager = conversionManager;
        this._scrollManager = scrollManager;
        this._verticalTrack = this._constructVerticalTrack();
        this._verticalThumb = this._constructVerticalThumb();
        this._horizontalTrack = this._constructHorizontalTrack();
        this._horizontalThumb = this._constructHorizontalThumb();
        this._layerGroup.on('mousedown', e => {
            e.cancelBubble = true;
        });
        this._layerGroup.on('touchstart', e => {
            e.cancelBubble = true;
        });
    }

    get verticalScrollRange() {
        return this._conversionManager.gridHeight - this._conversionManager.stageHeight + SCROLLBAR_WIDTH + this._conversionManager.velocityAreaHeight + this._conversionManager.seekerAreaHeight;
    }

    get verticalThumbMovementRange() {
        return this._conversionManager.stageHeight - SCROLLBAR_WIDTH - SCROLLBAR_THUMB_LENGTH - (SCROLLBAR_GUTTER * 2);
    }

    get horizontalScrollRange() {
        return this._conversionManager.gridWidth - this._conversionManager.stageWidth + SCROLLBAR_WIDTH + PIANO_KEY_WIDTH
    }

    get horizontalThumbMovementRange() {
        return this._conversionManager.stageWidth - SCROLLBAR_WIDTH - SCROLLBAR_THUMB_LENGTH - (SCROLLBAR_GUTTER * 2)
    }

    _constructVerticalTrack() {
        return new Rect({
            x: this._conversionManager.stageWidth - SCROLLBAR_WIDTH,
            y: 0,
            width: SCROLLBAR_WIDTH,
            height: this._conversionManager.stageHeight,
            fill: '#333'
        });
    }

    _constructVerticalThumb() {
        const verticalThumb = new Rect({
            x: this._conversionManager.stageWidth - 20,
            y: SCROLLBAR_GUTTER,
            width: 16,
            height: SCROLLBAR_THUMB_LENGTH,
            fill: '#6d6d6d',
            cornerRadius: 3,
            draggable: true,
            dragBoundFunc: pos => {
                pos.x = this._conversionManager.stageWidth - 20,
                pos.y = clamp(
                    pos.y, 
                    SCROLLBAR_GUTTER,
                    this._conversionManager.stageHeight - SCROLLBAR_WIDTH - SCROLLBAR_THUMB_LENGTH - SCROLLBAR_GUTTER 
                );
                return pos;
            }
        });
        verticalThumb.on('dragmove', e => {
            const yPos = e.target.attrs.y - SCROLLBAR_GUTTER;
            const yDecimal = yPos / this.verticalThumbMovementRange;
            const newLayerY = (-1 * yDecimal * this.verticalScrollRange) + this._conversionManager.seekerAreaHeight;
            this._scrollManager.y = newLayerY;
        });
        return verticalThumb
    }

    _constructHorizontalTrack() {
        return new Rect({
            x: 0,
            y: this._conversionManager.stageHeight - SCROLLBAR_WIDTH,
            width: this._conversionManager.stageWidth,
            height: SCROLLBAR_WIDTH,
            fill: '#333'
        });
    }

    _constructHorizontalThumb() {
        const horizontalThumb = new Rect({
            x: SCROLLBAR_GUTTER,
            y: this._conversionManager.stageHeight - 20,
            width: SCROLLBAR_THUMB_LENGTH,
            height: 16,
            fill: '#6d6d6d',
            cornerRadius: 3,
            draggable: true,
            dragBoundFunc: pos => {
                pos.y = this._conversionManager.stageHeight - 20;
                pos.x = clamp(
                    pos.x,
                    SCROLLBAR_GUTTER,
                    this._conversionManager.stageWidth - SCROLLBAR_WIDTH - SCROLLBAR_THUMB_LENGTH - SCROLLBAR_GUTTER
                );
                return pos;
            }
        });
        horizontalThumb.on('dragmove', e => {
            const xPos = e.target.attrs.x - SCROLLBAR_GUTTER;
            const xDecimal = xPos / this.horizontalThumbMovementRange;
            const newLayerX = (-1 * xDecimal * this.horizontalScrollRange) + PIANO_KEY_WIDTH;
            this._scrollManager.x = newLayerX;
        });
        return horizontalThumb;
    }

    redrawOnVerticalResize() {
        // calculate scroll position as decimal and multiply by the total movement range of the 
        // thumb to get its new position.
        const scrollPositionAsDecimal = Math.abs(this._scrollManager.y / this.verticalScrollRange);
        const newThumbY = this.verticalThumbMovementRange * scrollPositionAsDecimal + SCROLLBAR_GUTTER;
        // Update the thumb with the newly calculate position, and update various other elements
        // according to the new stage height
        this._verticalThumb.y(newThumbY);
        this._horizontalTrack.y(this._conversionManager.stageHeight - SCROLLBAR_WIDTH);
        this._horizontalThumb.y(this._conversionManager.stageHeight - 20);
        this._verticalTrack.height(this._conversionManager.stageHeight);
        this.layer.batchDraw();
        
    }

    redrawOnHorizontalResize() {
        // calculate scroll position as decimal and multiply by the total movement range of the 
        // thumb to get its new position.
        const scrollPositionAsDecimal = Math.abs((this._scrollManager.x - PIANO_KEY_WIDTH) / this.horizontalScrollRange);
        const newThumbX = this.horizontalThumbMovementRange * scrollPositionAsDecimal + SCROLLBAR_GUTTER;
        // Update the thumb with the newly calculate position, and update various other elements
        // according to the new stage height
        this._horizontalThumb.x(newThumbX);
        this._horizontalTrack.width(this._conversionManager.stageWidth);
        this._verticalTrack.x(this._conversionManager.stageWidth - SCROLLBAR_WIDTH);
        this._verticalThumb.x(this._conversionManager.stageWidth - 20);
        this.layer.batchDraw();
    }

    syncHorizontalThumbToScrollPosition() {
        const scrollPositionAsDecimal = Math.abs((this._scrollManager.x - PIANO_KEY_WIDTH) / this.horizontalScrollRange);
        const newThumbX = this.horizontalThumbMovementRange * scrollPositionAsDecimal + SCROLLBAR_GUTTER;
        this._horizontalThumb.x(newThumbX);
        this.layer.batchDraw();
    }

    syncVerticalThumbToScrollPosition() {
        const scrollPositionAsDecimal = Math.abs(this._scrollManager.y / this.verticalScrollRange);
        const newThumbY = this.verticalThumbMovementRange * scrollPositionAsDecimal + SCROLLBAR_GUTTER;
        this._verticalThumb.y(newThumbY);
        this.layer.batchDraw();
    }

    draw() {
        this._layerGroup.removeChildren();
        this._verticalTrack.moveTo(this._layerGroup);
        this._verticalThumb.moveTo(this._layerGroup);
        this._horizontalTrack.moveTo(this._layerGroup);
        this._horizontalThumb.moveTo(this._layerGroup);
        this.layer.add(this._layerGroup);
        this.layer.batchDraw();
    }
    
}
