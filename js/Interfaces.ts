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