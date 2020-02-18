import { SerializedAudioEngineState } from '../AudioEngine/AudioEngineConstants';

const defaultState = { channels: [] };

export default class HistoryStack {
    
    stack: SerializedAudioEngineState[];
    currentIndex: number;

    constructor(initialState = defaultState) {
        this.stack = [ initialState ];
        this.currentIndex = 0;
    }

    /**
     * If currentIndex is already at the end of the stack (the most recent entry), this method will add 
     * the new entry and increment the currentIndex. If currentIndex is not at the end of the stack, all
     * entries after (more recent than) the current index are removed before adding the new entry and
     * incrementing currentIndex.
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

    /**
     * Increments currentIndex to the next position in the stack and returns the entry at that 
     * position.
     */
    goForwards() : SerializedAudioEngineState {
        return this.stack[++this.currentIndex];
    }

    /**
     * Decrements currentIndex to the previous position in the stack and returns the entry at
     * that position.
     */
    goBackwards() : SerializedAudioEngineState {
        return this.stack[--this.currentIndex];
    }

    get isAtEnd() : boolean {
        return this.currentIndex + 1 >= this.stack.length;
    }

    get isAtStart() : boolean {
        return this.currentIndex === 0;
    }

    /**
     * Returns the entry at currentIndex of the stack.
     */
    get currentEntry() : SerializedAudioEngineState {
        return this.stack[this.currentIndex];
    }
    
}