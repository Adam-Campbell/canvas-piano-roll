import { Layer, Rect } from 'konva';
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
        this.layer.on('mousedown', e => {
            e.cancelBubble = true;
        });
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

    addNewVelocityMarker(x) {
        const velocityMarker = new Rect({
            width: 8,
            height: 50,
            cornerRadius: [2, 2, 0, 0],
            x,
            y: STAGE_HEIGHT - SCROLLBAR_WIDTH - 50,
            fill: '#222'
        });
        this.layer.add(velocityMarker);
        this.layer.batchDraw(); 
    }

    draw() {
        this.layer.add(this._background);
        this.layer.add(this._border);
        this.layer.batchDraw();
    }
}