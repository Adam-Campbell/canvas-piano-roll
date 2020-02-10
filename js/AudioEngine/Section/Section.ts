import Tone from 'tone';
import { NoteBBS } from '../../Constants';
import { SerializedSectionState, NoteCache } from '../AudioEngineConstants';

export default class Section {

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

    // serializes state for this particular section and returns it
    serializeState() : SerializedSectionState {
        return {
            notes: this.noteCache,
            id: this.id,
            start: this.start,
            numBars: this.numBars
        }
    }

    // forces this section to a given state
    forceToState(state: SerializedSectionState) : void {

    }

}
