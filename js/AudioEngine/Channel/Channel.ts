import Section from '../Section';
import Tone from 'tone';
import { genId } from '../../genId';
import { 
    SerializedChannelState, 
    NoteCache, 
    AudioEngineComponent 
} from '../AudioEngineConstants';

interface SectionCache {
    [propName: string]: Section
}

export default class Channel implements AudioEngineComponent {

    name: string;
    id: string;
    sectionCache: SectionCache = {};
    instrumentSettings: any;
    instrument: any;
    livePlayInstrument: any;

    constructor(name: string, id: string, instrumentSettings: any) {
        this.name = name;
        this.id = id;
        this.instrumentSettings = instrumentSettings;
        this.instrument = new Tone.PolySynth(12, Tone.Synth).toMaster();
        this.livePlayInstrument = new Tone.PolySynth(1, Tone.Synth).toMaster();
        this.instrument.set(instrumentSettings);
        this.livePlayInstrument.set(instrumentSettings);
    }

    triggerAttackRelease = (time: number, value: { note: string, duration: string, velocity: number }) => {
        this.instrument.triggerAttackRelease(value.note, value.duration, time, value.velocity);
    }

    addSection(start: string, numBars: number, id: string, notesData?: NoteCache) : Section {
        const newSection = new Section(
            start,
            numBars,
            id, 
            this.triggerAttackRelease,
            notesData
        );
        this.sectionCache[id] = newSection;
        return newSection;
    }

    removeSection(id: string) : void {
        const section = this.sectionCache[id];
        if (section) {
            section.cleanup();
            delete this.sectionCache[id];
        }
    }

    getDataForSection(sectionId: string) {
        if (this.sectionCache[sectionId]) {
            return this.sectionCache[sectionId].serializeState();
        }
        return null;
    }

    // Called before deleting the channel - takes care of anything that needs to be tidied
    // up in order to safely delete.
    cleanup() : void {
        Object.values(this.sectionCache).forEach(section => section.cleanup());
    }

    // Serialize the current state for this channel, including its instrument and any sections
    // it currently owns.  
    serializeState() : SerializedChannelState {
        let serializedSectionCache = {};
        for (const prop in this.sectionCache) {
            serializedSectionCache[prop] = this.sectionCache[prop].serializeState();
        }
        return {
            sections: serializedSectionCache,
            name: this.name,
            id: this.id,
            instrumentSettings: this.instrumentSettings
        }
    }

    // forces this channel, its instrument and sections to a given state.
    forceToState(state: SerializedChannelState) : void {

    }

}