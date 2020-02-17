import Tone from 'tone';
import AbstractSeekerLine from '../../common/AbstractSeekerLine';
import Section from '../../AudioEngine/Section';

export default class PianoRollSeekerLine extends AbstractSeekerLine {

    section: Section;

    constructor(conversionManager: any, leftPanelWidth: number, section: Section) {
        super(conversionManager, leftPanelWidth);
        this.section = section;
    }

    calculateSeekerLineXPos() {
        const sectionStartAsTicks = Tone.Ticks(this.section.start).toTicks();
        const relativePositionAsPx = this.conversionManager.convertTicksToPx(
            Tone.Transport.ticks - sectionStartAsTicks
        );
        return relativePositionAsPx;
    }

}
