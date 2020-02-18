import Tone from 'tone';
import Konva from 'konva';
import PianoRollConversionManager from '../PianoRollConversionManager';
import { NoteBBS } from '../../Constants';
import Section from '../../AudioEngine/Section';


export default class AudioReconciler {

    private conversionManager: PianoRollConversionManager;
    private section;

    constructor(conversionManager: PianoRollConversionManager, section: Section) {
        this.conversionManager = conversionManager;
        this.section = section;
    }

    /**
     * Takes a note element and a velocity marker element and uses them to create and return a note
     * object conforming to the NoteBBS interface required by the audio engine. 
     */
    private deriveNoteFromElements(noteElement: Konva.Rect, velocityMarkerElement: Konva.Rect) : NoteBBS {
        const velocity = velocityMarkerElement.attrs.height / 50;
        const { x, y, width, id } = noteElement.attrs;
        const note = this.conversionManager.derivePitchFromY(y);
        const time = Tone.Ticks(
            this.conversionManager.convertPxToTicks(x)
        ).toBarsBeatsSixteenths();
        const duration = Tone.Ticks(
            this.conversionManager.convertPxToTicks(width)
        ).toBarsBeatsSixteenths();
        return {
            note,
            time, 
            duration,
            velocity,
            id
        };
    }

    /**
     * Adds a note to the audio engine via the owned Section instance. 
     */
    addNote(noteElement: Konva.Rect, velocityMarkerElement: Konva.Rect) : void {
        const note = this.deriveNoteFromElements(noteElement, velocityMarkerElement);
        this.section.addNote(note);
    }

    /**
     * Removes a note from the audio engine via the owned Section instance. 
     */
    removeNotes(noteIds: string[]) : void {
        this.section.removeNotes(noteIds);
    }

}
