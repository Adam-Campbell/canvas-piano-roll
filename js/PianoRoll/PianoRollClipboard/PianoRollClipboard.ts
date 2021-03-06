import { genId } from '../../genId';
import Konva from 'konva';
import PianoRollConversionManager from '../PianoRollConversionManager';
import { Note, Clipboard } from '../../Constants';

export default class PianoRollClipboard implements Clipboard<Note> {

    private conversionManager: PianoRollConversionManager;
    private notesData: Note[] = [];

    constructor(conversionManager: PianoRollConversionManager) {
        this.conversionManager = conversionManager;
    }

    /**
     * Adds note data to the clipboard derived from the given note elements and velocity marker elements. 
     * This is destructive and will replace whatever was there previously. 
     */
    add(noteElements: Konva.Rect[], velocityMarkerElements: Konva.Rect[]) : void {
        // use noteElements in conjunction with velocityMarkerElements to produce plain data
        // describing the copied notes, in the same vein as the note objects used by the audio
        // reconciler. So the shape:

        // { note, time, duration, velocity, id }

        // Store this data in this.notesData
        const newNotesData = noteElements.map(noteElement => {
            const velocityMarkerElement = velocityMarkerElements.find(el => { 
                return el.getAttr('id') === noteElement.getAttr('id');
            });
            const velocity = velocityMarkerElement.attrs.height / (this.conversionManager.velocityAreaHeight - 10);
            const { x, y, width, id } = noteElement.attrs;
            const note = this.conversionManager.derivePitchFromY(y);
            const time = this.conversionManager.convertPxToTicks(x);
            const duration = this.conversionManager.convertPxToTicks(width);
            return {
                note,
                time, 
                duration,
                velocity,
                id
            };
        });

        this.notesData = newNotesData;
    }

    /**
     * Produce and return new notes data based on the previously copied data and the roundedStartTime 
     * (the new notes will maintain the same positions relative to each other, but as a group
     * they will be positioned relative to roundedStartTime).
     */
    produceCopy(roundedStartTime: number) : Note[] {
        // Iterate over the notes data to get the earliest time value found in any of the notes. The delta
        // between this earliest time value and the time value for a given note will be combined with the
        // roundedStartTime to calculate the new time value for the copy being produced. 
        let earliestStartTime = null;
        this.notesData.forEach(noteObject => {
            if (earliestStartTime === null || noteObject.time < earliestStartTime) {
                earliestStartTime = noteObject.time;
            }
        });
        // Then map over the notes data and produce a copy using the same note, duration and velocity 
        // values, but with new id and time values.  
        return this.notesData.map(noteObject => ({
            note: noteObject.note,
            duration: noteObject.duration,
            velocity: noteObject.velocity,
            id: genId(),
            time: roundedStartTime + (noteObject.time - earliestStartTime)
        })); 
    }

}
