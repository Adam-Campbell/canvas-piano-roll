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

    /**
     * Adds the background to the layer and redraws the layer.
     */
    init() : void {
        this.background = this.constructBackground();
        this.layer.add(this.background);
        this.layer.batchDraw();
    }

    /**
     * Constructs and returns the background
     */
    private constructBackground() : Konva.Rect {
        return new Konva.Rect({
            x: 0,
            y: 0,
            width: this.conversionManager.stageWidth,
            height: this.conversionManager.stageHeight,
            fill: Colours.grayscale[1]
        });
    }

    /**
     * Redraws the layer. Used by the parent stage whenever its size updates in order to redraw this
     * layer. 
     */
    redrawOnResize() : void {
        this.background.width(this.conversionManager.stageWidth);
        this.background.height(this.conversionManager.stageHeight);
        this.layer.batchDraw();
    }

}
