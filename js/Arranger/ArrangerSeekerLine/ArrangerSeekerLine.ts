import Tone from 'tone';
import AbstractSeekerLine from '../../common/AbstractSeekerLine';

export default class ArrangerSeekerLine extends AbstractSeekerLine {

    constructor(conversionManager: any, leftPanelWidth: number) {
        super(conversionManager, leftPanelWidth);
    }

    calculateSeekerLineXPos() {
        return this.conversionManager.convertTicksToPx(Tone.Transport.ticks);
    }

    redrawOnResize() {
        this.updateSeekerLinePosition();
    }

}
