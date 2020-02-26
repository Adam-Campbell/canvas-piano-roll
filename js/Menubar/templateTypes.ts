import { Tools } from '../Constants';

export interface CheckboxData {
    id: string,
    label: string
}

export interface ButtonData {
    label: string
}

export interface SelectOptionData {
    value: string,
    label: string
}

export interface SelectOptionGroup {
    label: string,
    options: SelectOptionData[]
}

export interface SelectData {
    id: string,
    label: string,
    options?: SelectOptionData[],
    optionGroups?: SelectOptionGroup[]
}

export interface RadioButtonData {
	id: string,
	icon: string,
	value: string
}

export interface RadioGroupData {
	name: string,
	options: RadioButtonData[]
}

export interface GenerateMenubarMarkupOptions {
    quantizeValue: string,
    setQuantizeValue: Function,
    noteDurationValue: string,
    setNoteDurationValue: Function,
    scaleKey: string,
    setScaleKey: Function,
    scaleType: string,
    setScaleType: Function,
    shouldShowScaleHighlights: boolean,
    toggleScaleHighlightsVisibility: Function,
    chordType: string,
    setChordType: Function, 
    playTrack: Function,
    pauseTrack: Function,
    stopTrack: Function,
    undoAction: Function,
    redoAction: Function, 
    activeTool: Tools,
    setActiveTool: Function,
    bpm: string | number,
    setBpm: Function
}