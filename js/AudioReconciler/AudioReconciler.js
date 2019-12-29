
export default class AudioReconciler {

    constructor(conversionManager) {
        this._conversionManager = conversionManager;
        this._cache = {};
    }

    _addNoteToEngine(note) {
        console.log(`adding note with id ${note.id} to engine`);
    }

    _removeNoteFromEngine(note) {
        console.log(`removing note with id ${note.id} from engine`);
    }

    _deriveNoteFromRect(rect) {
        console.log(rect);
        const { x, y, width, id } = rect.attrs;
        const pitch = this._conversionManager.derivePitchFromY(y);
        const start = this._conversionManager.convertPxToTicks(x);
        const duration = this._conversionManager.convertPxToTicks(width);
        return {
            pitch,
            start, 
            duration,
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
}