import Konva from 'konva';
import AbstractTransport from '../../common/AbstractTransport';
import { StaticMeasurements } from '../../Constants';
import PianoRollConversionManager from '../PianoRollConversionManager';

export default class PianoRollTransport extends AbstractTransport {

    constructor(conversionManager: PianoRollConversionManager, layerRef: Konva.Layer) {
        super(conversionManager, layerRef, StaticMeasurements.pianoKeyWidth);
    }

    /**
     * Calculates and returns the correct spacing for the numeric markers, based on the current
     * bar width.
     */
    get numberMarkerSpacing() : number {
        return this.conversionManager.barWidth;
    }

}
