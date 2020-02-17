import Konva from 'konva';
import AbstractTransport from '../../common/AbstractTransport';
import { StaticMeasurements } from '../../Constants';

export default class PianoRollTransport extends AbstractTransport {

    constructor(conversionManager: any, layerRef: Konva.Layer) {
        super(conversionManager, layerRef, StaticMeasurements.pianoKeyWidth);
    }

    get numberMarkerSpacing() : number {
        return this.conversionManager.barWidth;
    }

}
