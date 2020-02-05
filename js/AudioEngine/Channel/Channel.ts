import Section from '../Section';
import Tone from 'tone';
import { genId } from '../../genId';

export default class Channel {

    name: string;
    id: string;
    sectionCache = {};
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
        console.log('triggerAttackRelease method called!');
        this.instrument.triggerAttackRelease(value.note, value.duration, time, value.velocity);
    }

    addSection(start: string, numBars: number) {
        const id = genId();
        const newSection = new Section(
            start,
            numBars,
            id, 
            this.triggerAttackRelease
        );
        this.sectionCache[id] = newSection;
        return newSection;
    }

    removeSection(id: string) {

    }

    // Called before deleting the channel - takes care of anything that needs to be tidied
    // up in order to safely delete.
    cleanup() {
        Object.values(this.sectionCache).forEach(section => section.cleanup());
    }

    // Serialize the current state for this channel, including its instrument and any sections
    // it currently owns.  
    serializeState() {

    }

    // forces this channel, its instrument and sections to a given state.
    forceToState() {

    }

}