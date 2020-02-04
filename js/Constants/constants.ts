export const STAGE_WIDTH = 700;
export const STAGE_HEIGHT = 450;
export const BAR_WIDTH = 384;
//export const NOTES_GRID_WIDTH = 1920;
export const NOTES_GRID_WIDTH = BAR_WIDTH * 4;
export const NOTES_GRID_HEIGHT = 2160;
export const ROW_HEIGHT = 20;
export const PIANO_KEY_WIDTH = 120;
export const SCROLLBAR_WIDTH = 24;
export const SCROLLBAR_THUMB_LENGTH = 40;
export const SCROLLBAR_GUTTER = 4;
export const VELOCITY_LAYER_HEIGHT = 60;
export const SEEKER_AREA_HEIGHT = 30;


export const DRAG_MODE_ADJUST_NEW_NOTE_SIZE = 'DRAG_MODE_ADJUST_NEW_NOTE_SIZE';
export const DRAG_MODE_ADJUST_EXISTING_NOTE_SIZE = 'DRAG_MODE_ADJUST_EXISTING_NOTE_SIZE';
export const DRAG_MODE_ADJUST_SELECTED_NOTES_SIZE = 'DRAG_MODE_ADJUST_SELECTED_NOTES_SIZE';
export const DRAG_MODE_ADJUST_SELECTED_NOTES_POSITION = 'DRAG_MODE_ADJUST_SELECTED_NOTES_POSITION';
export const DRAG_MODE_SELECT_NOTES = 'DRAG_MODE_SELECT_NOTES';

export const DRAG_MODE_ADJUST_NOTE_POSITION = 'DRAG_MODE_ADJUST_NOTE_POSITION';
export const DRAG_MODE_ADJUST_NOTE_SIZE = 'DRAG_MODE_ADJUST_NOTE_SIZE';
export const DRAG_MODE_ADJUST_SELECTION = 'DRAG_MODE_ADJUST_SELECTION';
export const DRAG_MODE_ADJUST_SELECTION_FROM_VELOCITY_AREA = 'DRAG_MODE_ADJUST_SELECTION_FROM_VELOCITY_AREA';
export const DRAG_MODE_ADJUST_VELOCITY_AREA_HEIGHT = 'DRAG_MODE_ADJUST_VELOCITY_AREA_HEIGHT';


export const ACTIVE_TOOL_CURSOR = 'ACTIVE_TOOL_CURSOR';
export const ACTIVE_TOOL_PENCIL = 'ACTIVE_TOOL_PENCIL';
export const ACTIVE_TOOL_MARQUEE = 'ACTIVE_TOOL_MARQUEE';



export const StaticMeasurements = {
    stageWidth: 700,
    stageHeight: 450,
    rowHeight: 20,
    pianoKeyWidth: 120,
    scrollbarWidth: 24,
    scollbarThumbLength: 40,
    scrollbarGutter: 4,
    velocityLayerHeight: 60,
    seekerAreaHeight: 30
};


export enum Events {
    quantizeValueUpdate = 'quantizeValueUpdate',
    noteDurationUpdate = 'noteDurationUpdate',
    scaleTypeUpdate = 'scaleTypeUpdate',
    displayScaleUpdate = 'displayScaleUpdate',
    chordTypeUpdate = 'chordTypeUpdate',
    addNote = 'addNote',
    activeToolUpdate = 'activeToolUpdate',
    undoAction = 'undoAction',
    redoAction = 'redoAction',
    copyToClipboard = 'copyToClipboard',
    cutToClipboard = 'cutToClipboard',
    pasteFromClipboard = 'pasteFromClipboard'
}

export enum DragModes {
    adjustNoteSize = 'adjustNoteSize',
    adjustNotePosition = 'adjustNotePosition',
    adjustSelection = 'adjustSelection',
    adjustSelectionFromVelocityArea = 'adjustSelectionFromVelocityArea',
    adjustVelocityAreaHeight = 'adjustVelocityAreaHeight'
}

export enum Tools {
    cursor = 'cursor',
    pencil = 'pencil',
    marquee = 'marquee'
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

const malachite = {
    main: '#07da74',
    lightened: '#1de283',
    darkened: '#0bc56b'
};

// blue
const cerulean = {
    main: '#07b3da',
    lightened: '#23c7ec',
    darkened: '#068cab'
};

// red
const monza = {
    main: '#da0729',
    lightened: '#fda4b2',
    darkened: '#b10521'
};

const blueGrayScale = {
    1: '#daf0f5',
    2: '#bad3d8',
    3: '#9bb2b7',
    4: '#6d8084',
    5: '#4c5a5d',
    6: '#323a3c'
};

const currentGrayScale = {
    1: '#dadada',
    2: '#acacac',
    3: '#6d6d6d',
    4: '#666',
    5: '#555',
    6: '#333',
    7: '#222',
    8: '#0b0b0b'
}

export const Colours = {
    primary: malachite,
    secondary: monza,
    tertiary: cerulean,
    grayscale: currentGrayScale
};