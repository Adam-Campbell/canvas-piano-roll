import Konva from 'konva';
import { 
    getHorizontalLinesData, 
    getVerticalLinesData 
} from './gridLayerUtils';
import ConversionManager from '../ConversionManager';
import { StaticMeasurements } from '../../Constants';

export default class GridLayer {

    private layer: Konva.Layer;
    private conversionManager: ConversionManager;
    private gridContainer: Konva.Group;

    constructor(conversionManager: ConversionManager, layerRef: Konva.Layer) {
        this.layer = layerRef;
        this.conversionManager = conversionManager;
        this.gridContainer = new Konva.Group({
            x: StaticMeasurements.channelInfoColWidth, 
            y: this.conversionManager.seekerAreaHeight
        });
    }

    init() {
        this.layer.add(this.gridContainer);
        this.drawGrid();
    }

    updateX(x) : void {
        this.gridContainer.x(x);
        this.layer.batchDraw();
    }

    updateY(y) : void {
        this.gridContainer.y(y);
        this.layer.batchDraw();
    }

    private drawGrid() : void {
        this.gridContainer.destroyChildren();
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