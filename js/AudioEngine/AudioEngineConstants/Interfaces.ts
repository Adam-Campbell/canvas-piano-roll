import { NoteBBS } from '../../Constants';

export interface NoteCache {
    [propName: string]: NoteBBS
}

export interface SerializedSectionState {
    notes: NoteCache,
    id: string,
    start: string,
    numBars: number,
    channelIdx?: number
}

export interface SerializedSectionCache {
    [propName: string]: SerializedSectionState
}

export interface SerializedChannelState {
    sections: SerializedSectionCache,
    name: string,
    id: string,
    instrumentSettings: any
}

export interface SerializedAudioEngineState {
    channels: SerializedChannelState[]
}

export interface AudioEngineComponent {
    forceToState(state: any) : void,
    serializeState() : SerializedAudioEngineState | SerializedChannelState | SerializedSectionState
}