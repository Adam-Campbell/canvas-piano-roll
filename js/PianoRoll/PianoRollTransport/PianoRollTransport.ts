import Konva from 'konva';
import AbstractTransport from '../../common/AbstractTransport';
import { StaticMeasurements } from '../../Constants';
import PianoRollConversionManager from '../PianoRollConversionManager';

export default class PianoRollTransport extends AbstractTransport {

    constructor(conversionManager: PianoRollConversionManager, layerRef: Konva.Layer) {
        super(conversionManager, layerRef, StaticMeasurements.pianoKeyWidth);
    }

    get numberMarkerSpacing() : number {
        return this.conversionManager.barWidth;
    }

}
