import Tone from 'tone';
import { NoteBBS } from '../../Constants';

export default class Section {

    noteCache = {};
    part: any;
    start: string;
    numBars: number;
    id: string;

    constructor(start: string, numBars: number, id: string, instrumentCallback: Function) {
        this.start = start;
        this.numBars = numBars;
        this.id = id;
        this.part = new Tone.Part();
        this.part.start = start;
        this.part.loop = false;
        this.part.callback = () => console.log('part callback was called')
        //this.part.callback = instrumentCallback;
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

    removeAllNotes() {
        Object.values(this.noteCache).forEach(this.removeNoteFromPart);
        this.noteCache = {};
    }

    cleanup() {
        this.part.dispose();
    }

    // serializes state for this particular section and returns it
    serializeState() {

    }

    // forces this section to a given state
    forceToState() {

    }

}
