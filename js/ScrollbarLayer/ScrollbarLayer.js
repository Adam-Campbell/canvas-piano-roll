import { Rect, Layer } from 'konva';
import { 
    PIANO_KEY_WIDTH,
    SCROLLBAR_WIDTH,
    SCROLLBAR_THUMB_LENGTH,
    SCROLLBAR_GUTTER,
    NOTES_GRID_WIDTH,
    NOTES_GRID_HEIGHT,
    VELOCITY_LAYER_HEIGHT
} from '../constants';
import { clamp } from './utils';

export default class ScrollbarLayer {
    constructor(scrollManager, conversionManager) {
        this.layer = new Layer();
        //this._gridLayer = gridLayer;
        //this._pianoKeyLayer = pianoKeyLayer;
        //this._noteLayer = noteLayer;
        this._conversionManager = conversionManager;
        this._scrollManager = scrollManager;
        this._verticalTrack = this._constructVerticalTrack();
        this._verticalThumb = this._constructVerticalThumb();
        this._horizontalTrack = this._constructHorizontalTrack();
        this._horizontalThumb = this._constructHorizontalThumb();
        this.layer.on('mousedown', e => {
            e.cancelBubble = true;
        });
    }

    get verticalScrollRange() {
        return this._conversionManager.gridHeight - this._conversionManager.stageHeight + SCROLLBAR_WIDTH + VELOCITY_LAYER_HEIGHT;
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
        const totalVerticalThumbRange = this._conversionManager.stageHeight - SCROLLBAR_WIDTH - SCROLLBAR_THUMB_LENGTH - (SCROLLBAR_GUTTER * 2);
        verticalThumb.on('dragmove', e => {
            const yPos = e.target.attrs.y - SCROLLBAR_GUTTER;
            const yDecimal = yPos / totalVerticalThumbRange;
            const newLayerY = -1 * yDecimal * (NOTES_GRID_HEIGHT - this._conversionManager.stageHeight + SCROLLBAR_WIDTH + VELOCITY_LAYER_HEIGHT);
            // this._gridLayer.updateY(newLayerY);
            // this._noteLayer.updateY(newLayerY);
            // this._pianoKeyLayer.updateY(newLayerY);
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
        const totalHorizontalThumbRange = this._conversionManager.stageWidth - SCROLLBAR_WIDTH - SCROLLBAR_THUMB_LENGTH - (SCROLLBAR_GUTTER * 2);
        horizontalThumb.on('dragmove', e => {
            const xPos = e.target.attrs.x - SCROLLBAR_GUTTER;
            const xDecimal = xPos / totalHorizontalThumbRange;
            const newLayerX = (-1 * xDecimal * (NOTES_GRID_WIDTH - this._conversionManager.stageWidth + SCROLLBAR_WIDTH + PIANO_KEY_WIDTH)) + PIANO_KEY_WIDTH;
            //this._gridLayer.updateX(newLayerX);
            //this._noteLayer.updateX(newLayerX);
            this._scrollManager.x = newLayerX;
        });
        return horizontalThumb;
    }

    redrawOnVerticalResize() {
        // Use the new scroll - this._scrollManager.y, and the new stage height to calculate the scroll
        // position as a decimal.

        // total height of layer is gridHeight + velocityLayer height + scrollbarWidth.
        // total available range is total height - stageHeight
        //const totalGridRange = this._conversionManager.gridHeight + VELOCITY_LAYER_HEIGHT + SCROLLBAR_WIDTH - this._conversionManager.stageHeight;
        //const scrollPositionAsDecimal = Math.abs(this._scrollManager.y / totalGridRange);
        //const totalThumbRange = this._conversionManager.stageHeight - SCROLLBAR_WIDTH - SCROLLBAR_THUMB_LENGTH - SCROLLBAR_GUTTER;
        const scrollPositionAsDecimal = Math.abs(this._scrollManager.y / this.verticalScrollRange);
        console.log(scrollPositionAsDecimal);
        // then calculate the available range for the thumb, and multiply that total by the decimal to
        // get the new thumb position. 
        //const newThumbY = totalThumbRange * scrollPositionAsDecimal + SCROLLBAR_WIDTH;
        //const newThumbY = totalThumbRange * scrollPositionAsDecimal + SCROLLBAR_GUTTER;
        const newThumbY = this.verticalThumbMovementRange * scrollPositionAsDecimal + SCROLLBAR_GUTTER;
        //console.log(totalGridRange, scrollPositionAsDecimal, totalThumbRange);
        this._verticalThumb.y(newThumbY);
        this._horizontalTrack.y(this._conversionManager.stageHeight - SCROLLBAR_WIDTH);
        this._horizontalThumb.y(this._conversionManager.stageHeight - 20);
        this._verticalTrack.height(this._conversionManager.stageHeight);
        this.layer.batchDraw();
        
    }

    redrawOnHorizontalResize() {

    }

    draw() {
        this.layer.removeChildren();
        // const verticalTrack = this._constructVerticalTrack();
        // const verticalThumb = this._constructVerticalThumb();
        // const horizontalTrack = this._constructHorizontalTrack();
        // const horizontalThumb = this._constructHorizontalThumb();
        this.layer.add(this._verticalTrack);
        this.layer.add(this._verticalThumb);
        this.layer.add(this._horizontalTrack);
        this.layer.add(this._horizontalThumb);
        this.layer.batchDraw();
    }
}
