import Konva from 'konva';
import AbstractTransport from '../../common/AbstractTransport';
import ArrangerConversionManager from '../ArrangerConversionManager';
import { StaticMeasurements } from '../../Constants';

export default class ArrangerTransport extends AbstractTransport {

    constructor(conversionManager: ArrangerConversionManager, layerRef: Konva.Layer) {
        super(conversionManager, layerRef, StaticMeasurements.channelInfoColWidth);
    }

    /**
     * Calculates and returns the correct spacing for the numeric markers, based on the current
     * width of the grids columns. 
     */
    get numberMarkerSpacing() : number {
        return this.conversionManager.colWidth;
    }

}
