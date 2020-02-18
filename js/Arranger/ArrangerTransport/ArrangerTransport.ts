import Konva from 'konva';
import AbstractTransport from '../../common/AbstractTransport';
import ArrangerConversionManager from '../ArrangerConversionManager';
import { StaticMeasurements } from '../../Constants';

export default class ArrangerTransport extends AbstractTransport {

    constructor(conversionManager: ArrangerConversionManager, layerRef: Konva.Layer) {
        super(conversionManager, layerRef, StaticMeasurements.channelInfoColWidth);
    }

    get numberMarkerSpacing() : number {
        return this.conversionManager.colWidth;
    }

}
