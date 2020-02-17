import Konva from 'konva';
import StageScrollbars from '../../common/StageScrollbars';
import { StaticMeasurements } from '../../Constants';
import StageScrollManager from '../../common/StageScrollManager';

export default class PianoRollScrollbars extends StageScrollbars {
    constructor(
        scrollManager: StageScrollManager,
        conversionManager: any,
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

    get verticalScrollRange() : number {
        return Math.max(
            this.conversionManager.gridHeight + StaticMeasurements.scrollbarWidth + this.conversionManager.velocityAreaHeight + this.conversionManager.seekerAreaHeight - this.conversionManager.stageHeight,
            0
        );
    }

}
