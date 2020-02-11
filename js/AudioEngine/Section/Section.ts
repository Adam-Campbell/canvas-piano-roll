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
        //console.log(notes)
        Object.values(notes).forEach(noteObject => {
            console.log(noteObject)
            this.addNote(noteObject);
        });
    }

    private addNoteToPart(noteObject: NoteBBS) : void {
        this.part.add(noteObject);
    }

    private removeNoteFromPart(noteObject: NoteBBS) : void {
        this.part.remove(noteObject);
    }

    addNote(newNoteObject: NoteBBS) : void {
        if (this.noteCache[newNoteObject.id]) {
            this.removeNoteFromPart(this.noteCache[newNoteObject.id]);
        }
        this.noteCache[newNoteObject.id] = newNoteObject;
        this.addNoteToPart(newNoteObject);
    }

    removeNotes(noteIds: string[]) : void {
        noteIds.forEach(id => {
            if (this.noteCache[id]) {
                this.removeNoteFromPart(this.noteCache[id]);
                delete this.noteCache[id];
            }
        });
    }

    removeAllNotes() : void {
        Object.values(this.noteCache).forEach(this.removeNoteFromPart);
        this.noteCache = {};
    }

    cleanup() : void {
        this.part.dispose();
    }

    private serializeNoteCache(noteCache) {
        let copiedNoteCache = {};
        for (let key in noteCache) {
            copiedNoteCache[key] = {
                ...noteCache[key]
            };
        }
        return copiedNoteCache;
    }

    // serializes state for this particular section and returns it
    serializeState() : SerializedSectionState {
        return {
            //notes: this.noteCache,
            notes: this.serializeNoteCache(this.noteCache),
            id: this.id,
            start: this.start,
            numBars: this.numBars
        }
    }

    // forces this section to a given state
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
