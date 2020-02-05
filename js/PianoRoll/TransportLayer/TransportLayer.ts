import Konva from 'konva';
import { Colours } from '../../Constants';
import ConversionManager from '../ConversionManager';

export default class TransportLayer {

    private conversionManager: ConversionManager;
    private layer: Konva.Layer;
    private layerGroup: Konva.Group;
    private background: Konva.Rect;
    private border: Konva.Rect;
    private numberMarkersArray: Konva.Text[];
    private playbackMarker: Konva.RegularPolygon;

    constructor(conversionManager: ConversionManager, layerRef: Konva.Layer) {
        this.conversionManager = conversionManager;
        this.layer = layerRef;
        this.layerGroup = new Konva.Group({ x: 120, y: 0 });
        this.background = this.constructBackground();
        this.border = this.constructBorder();
        this.numberMarkersArray = this.constructNumberMarkersArray();
        this.playbackMarker = this.constructPlaybackMarker();
    }

    init() : void {
        this.background.moveTo(this.layerGroup);
        this.border.moveTo(this.layerGroup);
        this.numberMarkersArray.forEach(marker => marker.moveTo(this.layerGroup));
        this.playbackMarker.moveTo(this.layerGroup);
        this.layer.add(this.layerGroup);
        this.layer.batchDraw();
    }

    updateX(x) : void {
        this.layerGroup.x(x);
        this.layer.batchDraw();
    }

    private constructBackground() : Konva.Rect {
        const background = new Konva.Rect({
            x: 0,
            y: 0,
            height: 30,
            width: this.conversionManager.gridWidth,
            fill: Colours.grayscale[2]
        });
        return background;
    }

    private constructBorder() : Konva.Rect {
        const border = new Konva.Rect({
            x: 0,
            y: 27,
            width: this.conversionManager.gridWidth,
            height: 3,
            fill: Colours.grayscale[7]
        });
        return border;
    }

    private constructNumberMarkersArray() : Konva.Text[] {
        let numberMarkersArray = [];
        for (let i = 0; i < this.conversionManager.numBars; i++) {
            const numberMarker = new Konva.Text({
                text: `${i+1}`,
                fill: Colours.grayscale[7],
                x: i * this.conversionManager.barWidth,
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

    private constructPlaybackMarker() : Konva.RegularPolygon {
        const marker = new Konva.RegularPolygon({
            sides: 3,
            fill: '#fff',
            x: 0,
            y: 3,
            radius: 6,
            rotation: 180
        });
        return marker;
    }

    redrawOnZoomAdjustment(isZoomingIn: boolean) : void {
        this.background.width(this.conversionManager.gridWidth);
        this.border.width(this.conversionManager.gridWidth);
        this.numberMarkersArray.forEach((numberMarker, idx) => {
            numberMarker.x(idx * this.conversionManager.barWidth);
        });
        const multiplier = isZoomingIn ? 2 : 0.5;
        this.playbackMarker.x(
            this.playbackMarker.x() * multiplier
        );
        this.layer.batchDraw();
    }

    repositionPlaybackMarker(ticks: number) : void {
        this.playbackMarker.x(
            this.conversionManager.convertTicksToPx(ticks)
        );
        this.layer.batchDraw();
    }

}
