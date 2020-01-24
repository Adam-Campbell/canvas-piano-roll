import { Rect, Text, Group, RegularPolygon } from 'konva';
import colours from '../colours';

export default class TransportLayer {

    constructor(conversionManager, layerRef) {
        this._conversionManager = conversionManager;
        this.layer = layerRef;
        this._layerGroup = new Group({ x: 120, y: 0 });
        this._background = this._constructBackground();
        this._border = this._constructBorder();
        this._numberMarkersArray = this._constructNumberMarkersArray();
        this._playbackMarker = this._constructPlaybackMarker();
    }

    init() {
        this._background.moveTo(this._layerGroup);
        this._border.moveTo(this._layerGroup);
        this._numberMarkersArray.forEach(marker => marker.moveTo(this._layerGroup));
        this._playbackMarker.moveTo(this._layerGroup);
        this.layer.add(this._layerGroup);
        this.layer.batchDraw();
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
            fill: colours.grayscale[2]
        });
        return background;
    }

    _constructBorder() {
        const border = new Rect({
            x: 0,
            y: 27,
            width: this._conversionManager.gridWidth,
            height: 3,
            fill: colours.grayscale[7]
        });
        return border;
    }

    _constructNumberMarkersArray() {
        let numberMarkersArray = [];
        for (let i = 0; i < this._conversionManager.numBars; i++) {
            const numberMarker = new Text({
                text: `${i+1}`,
                fill: colours.grayscale[7],
                x: i * this._conversionManager.barWidth,
                y: 12
            });
            if (i < 0) {
                numberMarker.x(
                    numberMarker.x() - numberMarker.width() / 2
                );
            }
            numberMarkersArray.push(numberMarker);

        }
        return numberMarkersArray;
    }

    _constructPlaybackMarker() {
        const marker = new RegularPolygon({
            sides: 3,
            fill: '#fff',
            x: 0,
            y: 3,
            radius: 6,
            rotation: 180
        });
        return marker;
    }

    redrawOnZoomAdjustment(isZoomingIn) {
        this._background.width(this._conversionManager.gridWidth);
        this._border.width(this._conversionManager.gridWidth);
        this._numberMarkersArray.forEach((numberMarker, idx) => {
            numberMarker.x(idx * this._conversionManager.barWidth);
        });
        const multiplier = isZoomingIn ? 2 : 0.5;
        this._playbackMarker.x(
            this._playbackMarker.x() * multiplier
        );
        this.layer.batchDraw();
    }

    repositionPlaybackMarker(ticks) {
        this._playbackMarker.x(
            this._conversionManager.convertTicksToPx(ticks)
        );
        this.layer.batchDraw();
    }

}
