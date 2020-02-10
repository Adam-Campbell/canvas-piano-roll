import { SerializedAudioEngineState } from '../AudioEngine/AudioEngineConstants';

const defaultState = { channels: [] };

export default class HistoryStack {
    
    private stack: any[];
    private currentIndex: number;

    constructor(initialState = defaultState) {
        this.stack = [ initialState ];
        this.currentIndex = 0;
    }

    /*
        If at the end of the stack, add to the stack. If NOT at the end, remove
        everything after the current index and add this onto the end. 

    */
    addEntry(entry: SerializedAudioEngineState) : void {
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
        return this.stack[++this.currentIndex];
    }

    goBackwards() {
        return this.stack[--this.currentIndex];
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