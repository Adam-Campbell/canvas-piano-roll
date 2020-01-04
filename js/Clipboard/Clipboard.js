import Tone from 'tone';
import { genId } from '../genId';

export default class Clipboard {

    constructor(conversionManager) {
        this._conversionManager = conversionManager;
        this._notesData = [];
    }

    add(noteElements, velocityMarkerElements) {
        // use noteElements in conjunction with velocityMarkerElements to produce plain data
        // describing the copied notes, in the same vein as the note objects used by the audio
        // reconciler. So the shape:

        // { note, time, duration, velocity, id }

        // Store this data in this._noteData
        const newNotesData = noteElements.map(noteElement => {
            const velocityMarkerElement = velocityMarkerElements.find(el => { 
                return el.getAttr('id') === noteElement.getAttr('id');
            });
            const velocity = velocityMarkerElement.attrs.height / 50;
            const { x, y, width, id } = noteElement.attrs;
            const note = this._conversionManager.derivePitchFromY(y);
            const time = Tone.Ticks(
                this._conversionManager.convertPxToTicks(x)
            ).toTicks();
            const duration = Tone.Ticks(
                this._conversionManager.convertPxToTicks(width)
            ).toTicks();
            return {
                note,
                time, 
                duration,
                velocity,
                id
            };
        });

        this._notesData = newNotesData;
    }

    produceCopy(roundedStartTime) {
        // Map over _noteData to produce the new note data. For each note, keep the note, duration
        // and velocity properties the same, but generate a new id, and calculate a new time based
        // off of the notes original time property and the startTime argument. 

        // Once this new data has been produced simply return it.
        return this._notesData.map(noteObject => ({
            note: noteObject.note,
            duration: noteObject.duration,
            velocity: noteObject.velocity,
            id: genId(),
            time: roundedStartTime + noteObject.time
        })); 
    }

}

