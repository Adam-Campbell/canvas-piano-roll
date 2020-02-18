import Konva from 'konva';
import { 
    getHorizontalLinesData, 
    getVerticalLinesData 
} from './gridLayerUtils';
import ArrangerConversionManager from '../ArrangerConversionManager';
import { StaticMeasurements } from '../../Constants';

export default class ArrangerGrid {

    private layer: Konva.Layer;
    private conversionManager: ArrangerConversionManager;
    private gridContainer: Konva.Group;

    constructor(conversionManager: ArrangerConversionManager, layerRef: Konva.Layer) {
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

    /**
     * Adjusts the position of the grid along the x axis based on the given x value.
     */
    updateX(x) : void {
        this.gridContainer.x(x);
        this.layer.batchDraw();
    }

    /**
     * Adjusts the position of the grid along the y axis based on the given y value. 
     */
    updateY(y) : void {
        this.gridContainer.y(y);
        this.layer.batchDraw();
    }

    /**
     * Removes the existing grid if there is one, and then constructs a new grid before redrawing
     * the layer. 
     */
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

    /**
     * Performs the necessary recalculations when the zoom level of the parent stage changes, and 
     * then redraws the layer.
     */
    redrawOnZoomAdjustment() : void {
        this.drawGrid();
    }

}