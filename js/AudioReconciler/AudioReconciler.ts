import Tone from 'tone';
import ConversionManager from '../ConversionManager';
import Konva from 'konva';
import { Note, NoteBBS } from '../Constants';


export default class AudioReconciler {

    private conversionManager: ConversionManager;
    private cache = {};
    private instrument;
    private part;

    constructor(conversionManager: ConversionManager) {
        this.conversionManager = conversionManager;
        this.instrument = new Tone.PolySynth(12, Tone.Synth).toMaster();
        this.instrument.set({
            envelope: {
                sustain: 0.9,
                release: 0.1
            },
            oscillator: {
                volume: -22,
                type: 'amsawtooth'
            }
        });
        this.part = new Tone.Part();
        this.part.start("0:0:0");
        this.part.callback = (time, value) => {
            this.instrument.triggerAttackRelease(value.note, value.duration, time, value.velocity);
        };
        this.part.loop = false;
    }

    private addNoteToEngine(noteObject: NoteBBS) : void {
        this.part.add(noteObject);
    }

    private removeNoteFromEngine(note: NoteBBS) : void {
        this.part.remove(note);
    }

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

    addNote(noteElement: Konva.Rect, velocityMarkerElement: Konva.Rect) : void {
        const note = this.deriveNoteFromElements(noteElement, velocityMarkerElement);
        if (this.cache[note.id]) {
            this.removeNoteFromEngine(this.cache[note.id]);
        }
        this.addNoteToEngine(note);
        this.cache[note.id] = note;
    }

    removeNotes(noteIds: string[]) : void {
        noteIds.forEach(id => {
            if (this.cache[id]) {
                this.removeNoteFromEngine(this.cache[id]);
                delete this.cache[id];
            }
        });
    }

    forceToState(notesState: Note[]) : void {
        // remove all current notes from the engine and reset cache
        Object.values(this.cache).forEach(note => this.removeNoteFromEngine(note));
        this.cache = {};
        // iterate over notes, convert each note into a valid note object.
        // add that note object to the cache and the underlying _part
        notesState.forEach(note => {
            const noteObject = {
                note: note.note,
                time: Tone.Ticks(note.time).toBarsBeatsSixteenths(),
                duration: Tone.Ticks(note.duration).toBarsBeatsSixteenths(),
                velocity: note.velocity,
                id: note.id
            };
            this.addNoteToEngine(noteObject);
            this.cache[note.id] = noteObject;
        });
    }

}
