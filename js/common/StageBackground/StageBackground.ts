import Konva from 'konva';
import { Colours, ConversionManager } from '../../Constants';

export default class StageBackground {

    private background: Konva.Rect;
    private conversionManager: ConversionManager;
    private layer: Konva.Layer;

    constructor(conversionManager: ConversionManager, layerRef: Konva.Layer) {
        this.conversionManager = conversionManager;
        this.layer = layerRef;
    } 

    init() {
        this.background = this.constructBackground();
        this.layer.add(this.background);
        this.layer.batchDraw();
    }

    private constructBackground() : Konva.Rect {
        return new Konva.Rect({
            x: 0,
            y: 0,
            width: this.conversionManager.stageWidth,
            height: this.conversionManager.stageHeight,
            fill: Colours.grayscale[1]
        });
    }

    redrawOnResize() {
        this.background.width(this.conversionManager.stageWidth);
        this.background.height(this.conversionManager.stageHeight);
        this.layer.batchDraw();
    }

}
