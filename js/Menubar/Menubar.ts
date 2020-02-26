import Tone from 'tone';
import EventEmitter from '../EventEmitter';
import SettingsManager from '../SettingsManager';
import { generateMenubarMarkup } from './templateFns';
import { Events } from '../Constants';

/*

This needs:

- a render method that produces the lit-html template used by the Apps master render method. 

- the render method will use template functions defined in a separate file. 

- setter methods for each of the UI controls that can be passed to the render method allowing the 
controls to update the program state (in reality these setter methods will simply dispatch the
relevant event with the new value). 



*/

export default class Menubar {

    private eventEmitter: EventEmitter;
    private settingsManager: SettingsManager;
    bpm = 120;

    constructor(eventEmitter: EventEmitter, settingsManager: SettingsManager) {
        this.eventEmitter = eventEmitter;
        this.settingsManager = settingsManager;
    }

    setQuantizeValue = (e) => {
        this.eventEmitter.emit(Events.quantizeValueUpdate, e.target.value);
    }

    setNoteDurationValue = (e) => {
        this.eventEmitter.emit(Events.noteDurationUpdate, e.target.value);
    }

    setScaleKey = (e) => {
        this.eventEmitter.emit(Events.scaleKeyUpdate, e.target.value);
    }

    setScaleType = (e) => {
        this.eventEmitter.emit(Events.scaleTypeUpdate, e.target.value);
    }

    toggleScaleHighlightsVisibility = () => {
        this.eventEmitter.emit(Events.displayScaleUpdate, !this.settingsManager.shouldShowScaleHighlights);
    }

    setChordType = (e) => {
        this.eventEmitter.emit(Events.chordTypeUpdate, e.target.value);
    }

    playTrack = () => Tone.Transport.start();

    pauseTrack = () => Tone.Transport.pause();

    stopTrack = () => Tone.Transport.stop();

    undoAction = () => {
        this.eventEmitter.emit(Events.undoAction);
    }

    redoAction = () => {
        this.eventEmitter.emit(Events.redoAction);
    }

    setActiveTool = (e) => {
        this.eventEmitter.emit(Events.activeToolUpdate, e.target.value);
    }

    setBpm = (e) => {
        const newValue = parseInt(e.target.value);
        this.bpm = newValue;
        Tone.Transport.bpm.value = newValue;
        this.eventEmitter.emit(Events.triggerUIRender);
    }

    generateMarkup() {
        return generateMenubarMarkup({
            quantizeValue: this.settingsManager.quantize,
            setQuantizeValue: this.setQuantizeValue,
            noteDurationValue: this.settingsManager.noteDuration,
            setNoteDurationValue: this.setNoteDurationValue,
            scaleKey: this.settingsManager.scaleKey,
            setScaleKey: this.setScaleKey,
            scaleType: this.settingsManager.scaleType,
            setScaleType: this.setScaleType,
            shouldShowScaleHighlights: this.settingsManager.shouldShowScaleHighlights,
            toggleScaleHighlightsVisibility: this.toggleScaleHighlightsVisibility,
            chordType: this.settingsManager.chordType,
            setChordType: this.setChordType,
            playTrack: this.playTrack,
            pauseTrack: this.pauseTrack,
            stopTrack: this.stopTrack,
            undoAction: this.undoAction,
            redoAction: this.redoAction,
            activeTool: this.settingsManager.activeTool,
            setActiveTool: this.setActiveTool,
            bpm: this.bpm,
            setBpm: this.setBpm
        });
    }



}