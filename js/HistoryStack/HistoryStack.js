export default class HistoryStack {
    constructor(initialState = {}) {
        this._stack = [ initialState ];
        this._currentIndex = 0;
    }

    /*
        If at the end of the stack, add to the stack. If NOT at the end, remove
        everything after the current index and add this onto the end. 

    */
    addEntry(entry) {
        if (this.isAtEnd) {
            this._stack.push(entry);
            this._currentIndex++;
        } else {
            this._stack = [
                ...this._stack.slice(0, ++this._currentIndex),
                entry
            ];
        }
    }

    goForwards() {
        if (!this.isAtEnd) {
            return this._stack[++this._currentIndex];
        }
    }

    goBackwards() {
        if (!this.isAtStart) {
            return this._stack[--this._currentIndex];
        }
    }

    get isAtEnd() {
        return this._currentIndex + 1 >= this._stack.length;
    }

    get isAtStart() {
        return this._currentIndex === 0;
    }

    get currentEntry() {
        return this._stack[this._currentIndex];
    }
    
}