import Channel from './Channel';
import Section from './Section';
import EventEmitter from '../EventEmitter';
import { genId } from '../genId';
import { SerializedAudioEngineState, AudioEngineComponent } from './AudioEngineConstants';
import { Events } from '../Constants';

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

export default class AudioEngine implements AudioEngineComponent {

    channels: Channel[] = [];
    private eventEmitter: EventEmitter;

    constructor(eventEmitter: EventEmitter) {
        this.eventEmitter = eventEmitter;
    }

    init() {
        this.addChannel('Channel 1', padInstrumentSettings);
        this.addChannel('Channel 2', bassInstrumentSettings);
        this.addChannel('Channel 3', leadInstrumentSettings);
        this.addChannel('Channel 4');
        this.addChannel('Channel 5');
        this.addChannel('Channel 6');
        this.eventEmitter.subscribe(Events.historyTravelled, (state: SerializedAudioEngineState) => {
            this.forceToState(state);
        })
    }

    addChannel(name: string, settings = padInstrumentSettings) {
        const id = genId();
        this.channels.push(
            new Channel(name, id, settings)
        );
    }

    getSectionContext(sectionId: string) : {
        section: Section,
        sectionTitle: string,
        livePlayInstrument: any
    } | null {
        const channel = this.channels.find(c => c.sectionCache.hasOwnProperty(sectionId));
        if (!channel) {
            return null;
        }
        const section = channel.sectionCache[sectionId]
        return {
            section,
            sectionTitle: `${channel.name} -- ${section.start}`,
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
    forceToState(state: SerializedAudioEngineState) : void {
        // This is not the proper algorithm. At the moment the program does not have the ability
        // to add/remove tracks/ alter track names etc, so this algorithm can assume that the channels
        // in the state provided will match the channels in the engine in every respect besides the 
        // sections that they contain. 
        this.channels.forEach((channel: Channel, idx: number) => {
            channel.forceToState(state.channels[idx]);
        });

        // The actual algorithm:

        // First iterate over the channels in the engine.
        // If any of the channels do not exist in the new state, clean them up and replace them in the existing
        // channels array with some sentinel value, eg null. 

        // Now iterate over the channels in state, in order to produce a new channels array for the engine. 
        // For each channel in state, if the channel with that id can be found in the engines old channels
        // array, grab that channel instance and reconcile it with the new channel data in state, then add
        // it to the new engine channels array at the appropriate index.
        // If the channel was not found in the old engine channels array, then create the channel instance,
        // reconcile it with the data for that channel in state, and add it to the new engine channels array
        // at the appropriate index. 
        
    }

}
