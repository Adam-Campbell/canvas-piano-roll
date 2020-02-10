import Channel from './Channel';
import Section from './Section';
import { genId } from '../genId';
import { SerializedAudioEngineState } from './AudioEngineConstants';

const padInstrumentSettings = {
    envelope: {
        sustain: 0.9,
        release: 0.1
    },
    oscillator: {
        volume: -22,
        type: 'amsawtooth'
    }
};

const bassInstrumentSettings = {
    envelope: {
        sustain: 0.9,
        release: 0.1
    },
    oscillator: {
        volume: -22,
        type: 'fatsquare'
    }
}

const leadInstrumentSettings = {
    envelope: {
        sustain: 0.9,
        release: 0.1
    },
    oscillator: {
        volume: -22,
        type: 'triangle'
    }
}

export default class AudioEngine {

    channels: Channel[] = [];

    init() {
        this.addChannel('Channel 1', padInstrumentSettings);
        this.addChannel('Channel 2', bassInstrumentSettings);
        this.addChannel('Channel 3', leadInstrumentSettings);
        this.addChannel('Channel 4');
    }

    addChannel(name: string, settings = padInstrumentSettings) {
        const id = genId();
        this.channels.push(
            new Channel(name, id, settings)
        );
    }

    getSectionContext(sectionId: string) : {
        section: Section,
        livePlayInstrument: any
    } | null {
        const channel = this.channels.find(c => c.sectionCache.hasOwnProperty(sectionId));
        if (!channel) {
            return null;
        }
        return {
            section: channel.sectionCache[sectionId],
            livePlayInstrument: channel.livePlayInstrument 
        }
    }

    getSectionById(sectionId: string) {

    }

    deleteSection(sectionId: string) {

    }

    // serializes the state of the entire audio engine. 
    serializeState() : SerializedAudioEngineState {
        return {
            channels: this.channels.map(channel => channel.serializeState())
        };
    }

    // forces the entire audio engine to a given state
    forceToState() : void {
    
    }

}
