import Tone from 'tone';
import { NoteBBS } from '../../Constants';
import { 
    SerializedSectionState,
    NoteCache,
    AudioEngineComponent
} from '../AudioEngineConstants';

export default class Section implements AudioEngineComponent {

    noteCache: NoteCache = {};
    part: any;
    start: string;
    numBars: number;
    id: string;

    constructor(
        start: string, 
        numBars: number, 
        id: string, 
        instrumentCallback: Function, 
        notes: NoteCache = {}
    ) {
        this.start = start;
        this.numBars = numBars;
        this.id = id;
        this.part = new Tone.Part();
        this.part.start(start);
        this.part.loop = false;
        this.part.callback = instrumentCallback;
        Object.values(notes).forEach(noteObject => this.addNote(noteObject));
    }

    private addNoteToPart(noteObject: NoteBBS) : void {
        this.part.add(noteObject);
    }

    private removeNoteFromPart(noteObject: NoteBBS) : void {
        this.part.remove(noteObject);
    }

    /**
     * Adds a note to this section. If a note with that id already exists then it removes the old 
     * note before adding the new one.
     */
    addNote(newNoteObject: NoteBBS) : void {
        if (this.noteCache[newNoteObject.id]) {
            this.removeNoteFromPart(this.noteCache[newNoteObject.id]);
        }
        this.noteCache[newNoteObject.id] = newNoteObject;
        this.addNoteToPart(newNoteObject);
    }

    /**
     * Removes from this section the notes matching the ids given to it, if they exist.
     */
    removeNotes(noteIds: string[]) : void {
        noteIds.forEach(id => {
            if (this.noteCache[id]) {
                this.removeNoteFromPart(this.noteCache[id]);
                delete this.noteCache[id];
            }
        });
    }

    /**
     * Removes all notes from this section.
     */
    removeAllNotes() : void {
        Object.values(this.noteCache).forEach(this.removeNoteFromPart);
        this.noteCache = {};
    }

    /**
     * Performs the necessary cleanup on this section before it can be safely deleted.
     */
    cleanup() : void {
        this.part.dispose();
    }

    /**
     * Clones the note cache allowing it to be safely passed around to other parts of the program
     * without this section being affected by any mutations that may be performed on the note cache
     * clone.
     */
    private cloneNoteCache(noteCache) : NoteCache {
        let copiedNoteCache = {};
        for (let key in noteCache) {
            copiedNoteCache[key] = {
                ...noteCache[key]
            };
        }
        return copiedNoteCache;
    }

    /**
     * Serializes this section.
     */
    serializeState() : SerializedSectionState {
        return {
            notes: this.cloneNoteCache(this.noteCache),
            id: this.id,
            start: this.start,
            numBars: this.numBars
        }
    }

    /**
     * Updates this section to match a given state.
     */
    forceToState(state: SerializedSectionState) : void {
        // First reconcile the start and numBars to match state.
        if (state.start !== this.start) {
            this.start = state.start;
            this.part.start(state.start);
        }
        this.numBars = state.numBars;
        // Then, iterate over notes in engine.
        // If any notes are not in state, remove them from engine. 
        for (const noteId in this.noteCache) {
            if (!state.notes[noteId]) {
                this.removeNoteFromPart(this.noteCache[noteId]);
                delete this.noteCache[noteId];
            }
        }
        // Then, iterate over notes in state.
        // If any notes are not in engine, add them to engine. 
        // If any notes are already there, reconcile them
        for (const noteId in state.notes) {
            const sNote = state.notes[noteId];
            const eNote = this.noteCache[noteId];
            if (
                !eNote ||
                sNote.note !== eNote.note ||
                sNote.time !== eNote.time ||
                sNote.duration !== eNote.duration ||
                sNote.velocity !== eNote.velocity
            ) {
                this.addNote(sNote);
            }
        }
    }

}
