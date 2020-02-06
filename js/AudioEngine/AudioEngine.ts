import Channel from './Channel';
import Section from './Section';
import { genId } from '../genId';
import { SerializedAudioEngineState } from './AudioEngineConstants';

const defaultInstrumentSettings = {
    envelope: {
        sustain: 0.9,
        release: 0.1
    },
    oscillator: {
        volume: -22,
        type: 'amsawtooth'
    }
};

export default class AudioEngine {

    channels: Channel[] = [];

    addChannel(name: string) {
        const id = genId();
        this.channels.push(
            new Channel(name, id, defaultInstrumentSettings)
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
