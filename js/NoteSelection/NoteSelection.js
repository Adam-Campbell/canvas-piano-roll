
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
        const selected = this.retrieveAll();
        this._cache.clear();
        return selected;
    }

    retrieveAll() {
        return [
            ...this._cache.values()
        ];
    }

    forceToState(selectedNoteIdsState = []) {
        this._cache = new Set(selectedNoteIdsState);
    }

}
