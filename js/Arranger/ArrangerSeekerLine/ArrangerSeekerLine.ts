import Tone from 'tone';
import AbstractSeekerLine from '../../common/AbstractSeekerLine';
import ArrangerConversionManager from '../ArrangerConversionManager';

export default class ArrangerSeekerLine extends AbstractSeekerLine {

    constructor(conversionManager: ArrangerConversionManager, leftPanelWidth: number) {
        super(conversionManager, leftPanelWidth);
    }

    calculateSeekerLineXPos() {
        return this.conversionManager.convertTicksToPx(Tone.Transport.ticks);
    }

    redrawOnResize() {
        this.updateSeekerLinePosition();
    }

}
