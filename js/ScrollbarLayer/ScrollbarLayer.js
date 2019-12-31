import { Rect, Layer } from 'konva';
import { 
    STAGE_WIDTH, 
    STAGE_HEIGHT, 
    PIANO_KEY_WIDTH,
    SCROLLBAR_WIDTH,
    SCROLLBAR_THUMB_LENGTH,
    SCROLLBAR_GUTTER,
    NOTES_GRID_WIDTH,
    NOTES_GRID_HEIGHT
} from '../constants';
import { clamp } from './utils';

export default class ScrollbarLayer {
    constructor(scrollManager) {
        this.layer = new Layer();
        //this._gridLayer = gridLayer;
        //this._pianoKeyLayer = pianoKeyLayer;
        //this._noteLayer = noteLayer;
        this._scrollManager = scrollManager;
        this._verticalTrack = this._constructVerticalTrack();
        this._verticalThumb = this._constructVerticalThumb();
        this._horizontalTrack = this._constructHorizontalTrack();
        this._horizontalThumb = this._constructHorizontalThumb();
        this.layer.on('mousedown', e => {
            e.cancelBubble = true;
        });
    }

    _constructVerticalTrack() {
        return new Rect({
            x: STAGE_WIDTH - SCROLLBAR_WIDTH,
            y: 0,
            width: SCROLLBAR_WIDTH,
            height: STAGE_HEIGHT,
            fill: '#333'
        });
    }

    _constructVerticalThumb() {
        const verticalThumb = new Rect({
            x: STAGE_WIDTH - 20,
            y: SCROLLBAR_GUTTER,
            width: 16,
            height: SCROLLBAR_THUMB_LENGTH,
            fill: '#6d6d6d',
            cornerRadius: 3,
            draggable: true,
            dragBoundFunc: pos => {
                pos.x = STAGE_WIDTH - 20,
                pos.y = clamp(
                    pos.y, 
                    SCROLLBAR_GUTTER,
                    STAGE_HEIGHT - SCROLLBAR_WIDTH - SCROLLBAR_THUMB_LENGTH - SCROLLBAR_GUTTER 
                );
                return pos;
            }
        });
        const totalVerticalThumbRange = STAGE_HEIGHT - SCROLLBAR_WIDTH - SCROLLBAR_THUMB_LENGTH - (SCROLLBAR_GUTTER * 2);
        verticalThumb.on('dragmove', e => {
            const yPos = e.target.attrs.y - SCROLLBAR_GUTTER;
            const yDecimal = yPos / totalVerticalThumbRange;
            const newLayerY = -1 * yDecimal * (NOTES_GRID_HEIGHT - STAGE_HEIGHT + SCROLLBAR_WIDTH);
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
            y: STAGE_HEIGHT - SCROLLBAR_WIDTH,
            width: STAGE_WIDTH,
            height: SCROLLBAR_WIDTH,
            fill: '#333'
        });
    }

    _constructHorizontalThumb() {
        const horizontalThumb = new Rect({
            x: SCROLLBAR_GUTTER,
            y: STAGE_HEIGHT - 20,
            width: SCROLLBAR_THUMB_LENGTH,
            height: 16,
            fill: '#6d6d6d',
            cornerRadius: 3,
            draggable: true,
            dragBoundFunc: pos => {
                pos.y = STAGE_HEIGHT - 20;
                pos.x = clamp(
                    pos.x,
                    SCROLLBAR_GUTTER,
                    STAGE_WIDTH - SCROLLBAR_WIDTH - SCROLLBAR_THUMB_LENGTH - SCROLLBAR_GUTTER
                );
                return pos;
            }
        });
        const totalHorizontalThumbRange = STAGE_WIDTH - SCROLLBAR_WIDTH - SCROLLBAR_THUMB_LENGTH - (SCROLLBAR_GUTTER * 2);
        horizontalThumb.on('dragmove', e => {
            const xPos = e.target.attrs.x - SCROLLBAR_GUTTER;
            const xDecimal = xPos / totalHorizontalThumbRange;
            const newLayerX = (-1 * xDecimal * (NOTES_GRID_WIDTH - STAGE_WIDTH + SCROLLBAR_WIDTH + PIANO_KEY_WIDTH)) + PIANO_KEY_WIDTH;
            //this._gridLayer.updateX(newLayerX);
            //this._noteLayer.updateX(newLayerX);
            this._scrollManager.x = newLayerX;
        });
        return horizontalThumb;
    }

    draw() {
        this.layer.removeChildren();
        this.layer.add(this._verticalTrack);
        this.layer.add(this._verticalThumb);
        this.layer.add(this._horizontalTrack);
        this.layer.add(this._horizontalThumb);
        this.layer.draw();
    }
}
