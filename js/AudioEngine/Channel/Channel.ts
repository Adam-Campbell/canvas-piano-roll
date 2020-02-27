import Section from '../Section';
import Tone from 'tone';
import { genId } from '../../genId';
import { 
    SerializedChannelState, 
    SerializedSectionState,
    NoteCache, 
    AudioEngineComponent 
} from '../AudioEngineConstants';
import { InstrumentPresets } from '../../Constants';
import Instrument from '../Instrument';

interface SectionCache {
    [propName: string]: Section
}

export default class Channel implements AudioEngineComponent {

    name: string;
    id: string;
    sectionCache: SectionCache = {};
    instrument: any;
    livePlayInstrument: any;
    instrumentPreset: InstrumentPresets;

    constructor(name: string, id: string, instrumentPreset = InstrumentPresets.softSynth) {
        this.name = name;
        this.id = id;
        this.instrumentPreset = instrumentPreset;
        this.instrument = new Instrument(this.instrumentPreset);
        this.livePlayInstrument = new Instrument(this.instrumentPreset);  
    }

    /**
     * Takes the note information given to it and uses it to trigger a note to be played by this channels
     * instrument. This method acts as a callback passed to each of this channels sections, allowing them 
     * to schedule notes with the channels instrument without having to have a reference to the instrument
     * itself (this means that if the channels instrument is swapped out at runtime the sections don't need 
     * to know, they just keep using the same callback and it will work with the new instrument).
     */
    triggerAttackRelease = (time: number, value: { note: string, duration: string, velocity: number }) : void => {
        this.instrument.triggerAttackRelease(value.note, value.duration, time, value.velocity);
    }

    /**
     * Adds a section to this channel using the information given then returns it. If notesData is
     * omitted then it adds an empty section.
     */
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

    /**
     * If there is a section on this channel matching the given id then it remove the section and
     * performs all necessary cleanup.
     */
    removeSection(id: string) : void {
        const section = this.sectionCache[id];
        if (section) {
            section.cleanup();
            delete this.sectionCache[id];
        }
    }

    /**
     * If a section is found with the given id it serializes the section and returns the result, else
     * returns null.
     */
    getDataForSection(sectionId: string) : SerializedSectionState | null {
        if (this.sectionCache[sectionId]) {
            return this.sectionCache[sectionId].serializeState();
        }
        return null;
    }

    updateInstrument(instrumentPreset: InstrumentPresets) : void {
        this.instrumentPreset = instrumentPreset;
        this.instrument.updatePreset(instrumentPreset);
        this.livePlayInstrument.updatePreset(instrumentPreset);
    }

    /**
     * Performs all the necessary cleanup required for this channel before it can be safely deleted.
     */
    cleanup() : void {
        Object.values(this.sectionCache).forEach(section => section.cleanup());
    }

    /**
     * Serializes this channel, including all sections belonging to it and its current instrument, and 
     * returns the result. 
     */
    serializeState() : SerializedChannelState {
        let serializedSectionCache = {};
        for (const prop in this.sectionCache) {
            serializedSectionCache[prop] = this.sectionCache[prop].serializeState();
        }
        return {
            sections: serializedSectionCache,
            name: this.name,
            id: this.id,
            instrumentPreset: this.instrumentPreset
        }
    }

    /**
     * Updates this channel and all of its sections to match a given state. 
     */
    forceToState(state: SerializedChannelState) : void {
        // First reconcile the channel details with the provided state
        if (this.name !== state.name) {
           this.name = state.name; 
        }
        // TODO: reconcile instrumentSettings.
        if (state.instrumentPreset !== this.instrumentPreset) {
            this.instrumentPreset = state.instrumentPreset;
            this.instrument.updatePreset(state.instrumentPreset);
            this.livePlayInstrument.updatePreset(state.instrumentPreset);
        }

        // Iterate over sections in engine
        // If any are not in state, remove from engine.
        for (const sectionId in this.sectionCache) {
            if (!state.sections[sectionId]) {
                this.removeSection(sectionId);
            }
        }
        // Then, iterate over sections in state.
        // If a section does not exist in engine, add it. 
        // If a section already exists in engine, reconcile it. 
        for (const sectionId in state.sections) {
            const section = state.sections[sectionId];
            if (this.sectionCache[sectionId]) {
                this.sectionCache[sectionId].forceToState(section);
            } else {
                this.addSection(
                    section.start,
                    section.numBars,
                    section.id,
                    section.notes
                );
            }
        }
    }

}