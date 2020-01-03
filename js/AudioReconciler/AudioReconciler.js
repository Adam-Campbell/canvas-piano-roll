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
        this._part.add(noteObject);
    }

    _removeNoteFromEngine(note) {
        this._part.remove(note);
    }

    _deriveNoteFromElements(noteElement, velocityMarkerElement) {
        const velocity = velocityMarkerElement.attrs.height / 50;
        const { x, y, width, id } = noteElement.attrs;
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
            velocity,
            id
        };
    }

    addNote(noteElement, velocityMarkerElement) {
        const note = this._deriveNoteFromElements(noteElement, velocityMarkerElement);
        if (this._cache[note.id]) {
            this._removeNoteFromEngine(this._cache[note.id]);
        }
        this._addNoteToEngine(note);
        this._cache[note.id] = note;
    }

    removeNotes(noteIds) {
        noteIds.forEach(id => {
            if (this._cache[id]) {
                this._removeNoteFromEngine(this._cache[id]);
                delete this._cache[id];
            }
        })
    }

}
