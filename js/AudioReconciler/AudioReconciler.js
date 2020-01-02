import Tone from 'tone';


export default class AudioReconciler {

    constructor(conversionManager) {
        this._conversionManager = conversionManager;
        this._cache = {};
        this._instrument = new Tone.PolySynth(12, Tone.Synth).toMaster();
        this._instrument.set({
            envelope: {
                sustain: 0.9,
                release: 0.1
            },
            oscillator: {
                volume: -22,
                type: 'amsawtooth'
            }
        });
        this._part = new Tone.Part();
        this._part.start("0:0:0");
        this._part.callback = (time, value) => {
            this._instrument.triggerAttackRelease(value.note, value.duration, time, value.velocity);
        };
        this._part.loop = false;
        window.part = this._part;
    }

    _addNoteToEngine(noteObject) {
        console.log(`adding note with id ${noteObject.id} to engine`);
        // const { note, start, duration } = noteObject;
        // const formatted = {
        //     note,
        //     time: Tone.Ticks(start).toBarsBeatsSixteenths(),
        //     duration: Tone.Ticks(duration).toBarsBeatsSixteenths(),
        //     velocity: 1
        // };
        // console.log(formatted);
        this._part.add(noteObject);
    }

    _removeNoteFromEngine(note) {
        console.log(`removing note with id ${note.id} from engine`);
        this._part.remove(note);
    }

    _deriveNoteFromRect(rect) {
        console.log(rect);
        const { x, y, width, id } = rect.attrs;
        const note = this._conversionManager.derivePitchFromY(y);
        const time = Tone.Ticks(
            this._conversionManager.convertPxToTicks(x)
        ).toBarsBeatsSixteenths();
        const duration = Tone.Ticks(
            this._conversionManager.convertPxToTicks(width)
        ).toBarsBeatsSixteenths();
        return {
            note,
            time, 
            duration,
            velocity: 1,
            id
        };
    }

    addNotes(rectsArray) {
        rectsArray.forEach(rect => {
            const note = this._deriveNoteFromRect(rect);
            if (this._cache[note.id]) {
                this._removeNoteFromEngine(this._cache[note.id]);
            }
            this._addNoteToEngine(note);
            this._cache[note.id] = note;
        });
    }

    removeNotes(noteRectsArray) {
        noteRectsArray.forEach(noteRect => {
            if (this._cache[noteRect.attrs.id]) {
                this._removeNoteFromEngine(this._cache[noteRect.attrs.id]);
                delete this._cache[noteRect.attrs.id];
            }
        });
    }

    updateNoteVelocity(id, velocity) {
        const currentNote = this._cache[id];
        if (!currentNote) {
            return;
        }
        const newNote = {
            ...currentNote,
            velocity
        };
        console.log(currentNote, newNote);
        this._cache[id] = newNote;
        this._removeNoteFromEngine(currentNote);
        this._addNoteToEngine(newNote);
    }
}
