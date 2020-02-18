import Tone from 'tone';
import AbstractSeekerLine from '../../common/AbstractSeekerLine';
import ArrangerConversionManager from '../ArrangerConversionManager';

export default class ArrangerSeekerLine extends AbstractSeekerLine {

    constructor(conversionManager: ArrangerConversionManager, leftPanelWidth: number) {
        super(conversionManager, leftPanelWidth);
    }

    /**
     * Calculates and returns the x position for the seeker line based on the current track
     * progress.
     */
    calculateSeekerLineXPos() {
        return this.conversionManager.convertTicksToPx(Tone.Transport.ticks);
    }

}
