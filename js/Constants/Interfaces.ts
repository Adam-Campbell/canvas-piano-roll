import Konva from 'konva';
import EventEmitter from '../EventEmitter';
import Section from '../AudioEngine/Section';
import AudioEngine from '../AudioEngine';

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

export interface PianoRollOptions {
    container: string,
    initialWidth: number,
    initialHeight: number,
    initialQuantize: string,
    initialNoteDuration: string,
    numBars: number,
    eventEmitter: EventEmitter,
    section: Section,
    livePlayInstrument: any
}

export interface WindowOptions {
    id: string,
    title: string,
    eventEmitter: EventEmitter,
    initialZIndex: number,
    childClass: any,
    childContext: any,
    defaultWidth: number,
    defaultHeight: number
}

export interface KonvaLineData {
    points: number[],
    stroke: string,
    strokeWidth: number
}

export interface ArrangerConversionManagerOptions {
    stageWidth: number,
    stageHeight: number,
    barWidth: number,
    barHeight: number,
    numBars: number,
    numChannels: number,
    tickToPxRatio: number
}

export interface ArrangerOptions {
    container: HTMLElement,
    initialWidth: number,
    initialHeight: number,
    audioEngine: AudioEngine
}

export interface Clipboard<SerializedEntityType> {
    //add(): void,
    add(...args: any[]) : void,
    produceCopy(...args: any[]) : SerializedEntityType[]
}

export interface HorizontallyScrollableComponent {
    updateX(x: number) : void
}

export interface VerticallyScrollableComponent {
    updateY(y: number) : void
}

export interface WindowChild {
    init(options: Object) : void,
    cleanup() : void,
    handleResize(width: number, height: number) : void
}

export interface ConversionManager {
    stageWidth: number,
    stageHeight: number, 
    colWidth: number,
    rowHeight: number,
    gridWidth: number,
    gridHeight: number,
    tickToPxRatio: number,
    seekerAreaHeight?: number,
    velocityAreaHeight?: number
    numBars?: number,
    barWidth?: number,
    noteWidth?: number,
    round(total: number, divisor: number) : number,
    roundToGridRow(y: number) : number,
    roundToGridCol(x: number) : number,
    roundDown(total: number, divisor: number) : number,
    roundDownToGridRow(y: number) : number,
    roundDownToGridCol(x: number) : number,
    convertTicksToPx(ticks: number) : number,
    convertPxToTicks(px: number) : number,
    convertDurationToPx?(duration: string) : number,
    derivePitchFromY?(y: number) : string,
    deriveYFromPitch?(pitch: string) : number
}