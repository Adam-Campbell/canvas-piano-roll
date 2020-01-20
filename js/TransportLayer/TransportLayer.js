import { Rect, Text, Group } from 'konva';

export default class TransportLayer {

    constructor(conversionManager, layerRef) {
        this._conversionManager = conversionManager;
        this.layer = layerRef;
        this._layerGroup = new Group({ x: 120 });
        this._background = this._constructBackground();
        this._border = this._constructBorder();
        this._numberMarkersArray = this._constructNumberMarkersArray();
    }

    updateX(x) {
        this._layerGroup.x(x);
        this.layer.batchDraw();
    }

    _constructBackground() {
        const background = new Rect({
            x: 0,
            y: 0,
            height: 30,
            width: this._conversionManager.gridWidth,
            fill: '#acacac'
        });
        return background;
    }

    _constructBorder() {
        const border = new Rect({
            x: 0,
            y: 27,
            width: this._conversionManager.gridWidth,
            height: 3,
            fill: '#222'
        });
        return border;
    }

    _constructNumberMarkersArray() {
        let numberMarkersArray = [];
        for (let i = 0; i < this._conversionManager.numBars; i++) {
            numberMarkersArray.push(new Text({
                text: `${i+1}`,
                fill: '#222',
                x: i * this._conversionManager.barWidth,
                y: 12
            }));
        }
        return numberMarkersArray;
    }

    draw() {
        this._layerGroup.removeChildren();
        this._background.moveTo(this._layerGroup);
        this._border.moveTo(this._layerGroup);
        this._numberMarkersArray.forEach(marker => marker.moveTo(this._layerGroup));
        this.layer.add(this._layerGroup);
        this.layer.batchDraw();
    }

    redrawOnZoomAdjustment() {
        this._background.width(this._conversionManager.gridWidth);
        this._border.width(this._conversionManager.gridWidth);
        this._numberMarkersArray.forEach((numberMarker, idx) => {
            numberMarker.x(idx * this._conversionManager.barWidth);
        });
        this.layer.batchDraw();
    }

}
