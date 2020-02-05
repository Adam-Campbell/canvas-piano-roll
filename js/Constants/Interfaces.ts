export interface KonvaEvent {
    evt: any,
    pointerId: number,
    target: any,
    currentTarget: any,
    type: string,
    cancelBubble?: boolean
}

export interface NoteBBS {
    note: string,
    time: string, 
    duration: string,
    velocity: number,
    id: string
}

export interface Note {
    note: string,
    time: number,
    duration: number,
    velocity: number,
    id: string
}

export interface SerializedState {
    notes: Note[],
    selectedNoteIds: string[]
}

export interface Pitch {
    note: string,
    octave: string,
    full: string
}
