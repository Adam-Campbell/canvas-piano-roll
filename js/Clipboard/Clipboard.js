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
            const velocity = velocityMarkerElement.attrs.height / (this._conversionManager.velocityAreaHeight - 10);
            const { x, y, width, id } = noteElement.attrs;
            const note = this._conversionManager.derivePitchFromY(y);
            const time = this._conversionManager.convertPxToTicks(x);
            const duration = this._conversionManager.convertPxToTicks(width);
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
        // Iterate over the notes data to get the earliest time value found in any of the notes. The delta
        // between this earliest time value and the time value for a given note will be combined with the
        // roundedStartTime to calculate the new time value for the copy being produced. 
        let earliestStartTime = null;
        this._notesData.forEach(noteObject => {
            if (earliestStartTime === null || noteObject.time < earliestStartTime) {
                earliestStartTime = noteObject.time;
            }
        });
        // Then map over the notes data and produce a copy using the same note, duration and velocity 
        // values, but with new id and time values.  
        return this._notesData.map(noteObject => ({
            note: noteObject.note,
            duration: noteObject.duration,
            velocity: noteObject.velocity,
            id: genId(),
            time: roundedStartTime + (noteObject.time - earliestStartTime)
        })); 
    }

}

