import Konva from 'konva';
import StageScrollbars from '../../common/StageScrollbars';
import { StaticMeasurements } from '../../Constants';
import StageScrollManager from '../../common/StageScrollManager';
import PianoRollConversionManager from '../PianoRollConversionManager';

export default class PianoRollScrollbars extends StageScrollbars {

    constructor(
        scrollManager: StageScrollManager,
        conversionManager: PianoRollConversionManager,
        layerRef: Konva.Layer,
        leftPanelWidth: number,
    ) {
        super(
            scrollManager, 
            conversionManager, 
            layerRef, 
            leftPanelWidth
        );
    }

    /**
     * Calculates and returns the vertical scroll range for the PianoRoll, which is equal to the sum of the
     * current heights of all components participating in vertical scrolling minus the current height of the
     * stage.
     */
    get verticalScrollRange() : number {
        return Math.max(
            this.conversionManager.gridHeight + StaticMeasurements.scrollbarWidth + this.conversionManager.velocityAreaHeight + this.conversionManager.seekerAreaHeight - this.conversionManager.stageHeight,
            0
        );
    }

}
