import Konva from 'konva';
import { 
    getHorizontalLinesData, 
    getVerticalLinesData 
} from './gridLayerUtils';
import ConversionManager from '../ConversionManager';

export default class GridLayer {

    private layer: Konva.Layer;
    private conversionManager: ConversionManager;
    private gridContainer: Konva.Group;
    private background: Konva.Rect;

    constructor(conversionManager: ConversionManager, layerRef: Konva.Layer) {
        this.layer = layerRef;
        this.conversionManager = conversionManager;
        this.gridContainer = new Konva.Group({ y: 30 });
    }

    init() {
        this.layer.add(this.gridContainer);
        this.background = this.constructBackground();
        this.drawGrid();
    }

    updateX(x) : void {

    }

    updateY(y) : void {

    }

    redrawOnResize() : void {
        this.background.width(this.conversionManager.stageWidth);
        this.background.height(this.conversionManager.stageHeight);
        //this.layer.draw();
    }

    private constructBackground() : Konva.Rect {
        return new Konva.Rect({
            fill: '#ddd',
            x: 0,
            y: 0,
            width: this.conversionManager.stageWidth,
            height: this.conversionManager.stageHeight   
        });
    }

    private drawGrid() : void {
        this.background.moveTo(this.gridContainer);
        const horizontalLinesData = getHorizontalLinesData(
            this.conversionManager.numChannels,
            this.conversionManager.rowHeight,
            this.conversionManager.gridWidth
        );
        const verticalLinesData = getVerticalLinesData(
            this.conversionManager.numBars,
            this.conversionManager.colWidth,
            this.conversionManager.gridHeight
        );
        [...horizontalLinesData, ...verticalLinesData]
        .forEach(lineProps => {
            const line = new Konva.Line(lineProps);
            line.moveTo(this.gridContainer);
        });
        this.layer.batchDraw();
    }

    redrawOnZoomAdjustment() : void {
        this.drawGrid();
    }

}