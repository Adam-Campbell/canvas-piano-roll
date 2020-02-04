import { SerializedState } from '../Constants';

export default class HistoryStack {
    
    private stack: any[];
    private currentIndex: number;

    constructor(initialState = {}) {
        this.stack = [ initialState ];
        this.currentIndex = 0;
    }

    /*
        If at the end of the stack, add to the stack. If NOT at the end, remove
        everything after the current index and add this onto the end. 

    */
    addEntry(entry: SerializedState) : void {
        if (this.isAtEnd) {
            this.stack.push(entry);
            this.currentIndex++;
        } else {
            this.stack = [
                ...this.stack.slice(0, ++this.currentIndex),
                entry
            ];
        }
    }

    goForwards() {
        if (!this.isAtEnd) {
            return this.stack[++this.currentIndex];
        }
    }

    goBackwards() {
        if (!this.isAtStart) {
            return this.stack[--this.currentIndex];
        }
    }

    get isAtEnd() {
        return this.currentIndex + 1 >= this.stack.length;
    }

    get isAtStart() {
        return this.currentIndex === 0;
    }

    get currentEntry() {
        return this.stack[this.currentIndex];
    }
    
}