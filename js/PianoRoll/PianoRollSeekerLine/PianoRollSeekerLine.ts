import Tone from 'tone';
import AbstractSeekerLine from '../../common/AbstractSeekerLine';
import Section from '../../AudioEngine/Section';
import PianoRollConversionManager from '../PianoRollConversionManager';

export default class PianoRollSeekerLine extends AbstractSeekerLine {

    section: Section;

    constructor(conversionManager: PianoRollConversionManager, leftPanelWidth: number, section: Section) {
        super(conversionManager, leftPanelWidth);
        this.section = section;
    }

    /**
     * Calculates the x position for the seeker line based upon the current track progress and the
     * start time for the section associated with this PianoRoll instance. 
     */
    calculateSeekerLineXPos() {
        const sectionStartAsTicks = Tone.Ticks(this.section.start).toTicks();
        const relativePositionAsPx = this.conversionManager.convertTicksToPx(
            Tone.Transport.ticks - sectionStartAsTicks
        );
        return relativePositionAsPx;
    }

}
