
export default class NoteSelection {
    constructor() {
        this._cache = new Set();
    }

    has(canvasElement) {
        return this._cache.has(canvasElement.attrs.id);
    }

    add(canvasElement) {
        this._cache.add(canvasElement.attrs.id);
    }

    remove(canvasElement) {
        console.log('noteSelection remove method called')
        this._cache.delete(canvasElement.attrs.id);
    }

    clear() {
        const selected = this.retreiveAll();
        this._cache.clear();
        return selected;
    }

    retreiveAll() {
        return [
            ...this._cache.values()
        ];
    }

}




/*


export default class NoteSelection {
    constructor() {
        this._cache = {};
    }

    _addSelectedAppearance(noteRect) {
        noteRect.fill('#222');
    }

    _removeSelectedAppearance(noteRect) {
        noteRect.fill('green');
    }

    update(note, shiftKeyPressed) {
        const isCurrentlySelected = this.has(note);
        if (shiftKeyPressed) {
            if (isCurrentlySelected) {
                this.remove(note);
            } else {
                this.add(note);
            }
        } else {
            this.clear();
            if (!isCurrentlySelected) {
                this.add(note);
            }
        }
    }

    has(note) {
        return this._cache.hasOwnProperty(note.attrs.id);
    }

    add(note) {
        this._cache[note.attrs.id] = note;
        //this._addSelectedAppearance(note);
    }

    remove(note) {
        delete this._cache[note.attrs.id];
        //this._removeSelectedAppearance(note);
    }

    clear() {
        const selected = this.toArray();
        //selected.forEeach(note => this._removeSelectedAppearance(note));
        this._cache = {};
        return  selected;
    }

    each(cb) {
        for (let noteId in this._cache) {
            cb(this._cache[noteId]);
        }
    }

    toArray() {
        return Object.values(this._cache);
    }

}




*/