import { render, html } from 'lit-html';
import Window from '../Window';
import EventEmitter from '../EventEmitter';
import {
    generateMenubarMarkup,
    generateTaskbarMarkup,
    generateWindowsMarkup, 
} from './templateFns';
import { 
    Events,
    WindowTypes,
    WindowChild
} from '../Constants';
import PianoRoll from '../PianoRoll';
import AudioEngine from '../AudioEngine';
import Arranger from '../Arranger';
import HistoryStack from '../HistoryStack';

export default class App {
    
    private activeWindows: Window[] = [];
    audioEngine: AudioEngine;
    eventEmitter: EventEmitter;
    private historyStack: HistoryStack;
    quantizeValue = '16n';
    noteDurationValue = '16n';
    scaleKey = 'C';
    scaleType = 'major';
    chordType = 'major';

    constructor() {
        this.eventEmitter = new EventEmitter();
        this.audioEngine = new AudioEngine(this.eventEmitter);
        this.audioEngine.init();
        const initialHistoryStackEntry = this.audioEngine.serializeState();
        this.historyStack = new HistoryStack(initialHistoryStackEntry);
        this.eventEmitter.subscribe(Events.closeWindow, this.removeWindow);
        this.eventEmitter.subscribe(Events.renderApp, this.renderApp);
        this.eventEmitter.subscribe(Events.focusWindow, this.focusWindow);
        this.eventEmitter.subscribe(Events.openPianoRollWindow, this.addPianoRollWindow);
        this.eventEmitter.subscribe(Events.addStateToStack, this.serializeStateAndAddToStack);
        this.eventEmitter.subscribe(Events.undoAction, this.undoActionAndPushState);
        this.eventEmitter.subscribe(Events.redoAction, this.redoActionAndPushState);
        window.audioEngine = this.audioEngine;
        window.historyStack = this.historyStack;
        window.app = this;
    }

    init() : void {
        this.renderApp();
        this.addArrangerWindow();
    }

    setQuantizeValue = (e) => {
        const newQuantizeValue = e.target.value;
        console.log(`changed to ${newQuantizeValue}`);
        this.quantizeValue = newQuantizeValue;
        this.renderApp();
    }

    setNoteDurationValue = (e) => {
        const newValue = e.target.value;
        this.noteDurationValue = newValue;
        this.renderApp();
    }

    setScaleKey = (e) => {
        const newValue = e.target.value;
        this.scaleKey = newValue;
        this.renderApp();
    }

    setScaleType = (e) => {
        const newValue = e.target.value;
        this.scaleType = newValue;
        this.renderApp();
    }

    setChordType = (e) => {
        const newValue = e.target.value;
        this.chordType = newValue;
        this.renderApp();
    }

    /**
     * Serializes the current state of the program and adds it to the history stack.
     */
    private serializeStateAndAddToStack = () : void =>  {
        const newState = this.audioEngine.serializeState();
        this.historyStack.addEntry(newState);
    }

    /**
     * Moves back to the previous entry in the history stack and pushes that state to the rest
     * of the app via the event emitter.
     */
    private undoActionAndPushState = () : void => {
        if (!this.historyStack.isAtStart) {
            const nextState = this.historyStack.goBackwards();
            this.eventEmitter.emit(Events.historyTravelled, nextState);
        }
    }

    /**
     * Moves forward to the next entry in the history stack and pushes that state to the rest
     * of the app via the event emitter.
     */
    private redoActionAndPushState = () : void => {
        if (!this.historyStack.isAtEnd) {
            const nextState = this.historyStack.goForwards();
            this.eventEmitter.emit(Events.historyTravelled, nextState);
        }
    }

    /**
     * Adds a new window to the application, triggers a rerender to add it to the DOM and then
     * initializes the window and its child class.
     */
    addWindow = (title: string, id: string, childClass: any, childContext: any) : void => {
        const newWindow = new Window({
            id,
            title,
            eventEmitter: this.eventEmitter,
            initialZIndex: this.activeWindows.length,
            childClass,
            childContext,
            defaultWidth: 650,
            defaultHeight: 500
        });
        this.activeWindows.push(newWindow);
        this.renderApp();
        newWindow.init();
    }

    /**
     * Add a window containing the Arranger into the application by using the addWindow method
     * configured with specific arguments.
     */
    addArrangerWindow = () : void => {
        this.addWindow('Arranger', '-1', Arranger, {
            audioEngine: this.audioEngine
        });
    }

    /**
     * Add a window containing a PianoRoll into the application by using the addWindow method
     * configured with specific arguments.
     */
    addPianoRollWindow = (sectionId: string) : void => {
        const { 
            section, 
            sectionTitle, 
            livePlayInstrument 
        } = this.audioEngine.getSectionContext(sectionId);
        this.addWindow(sectionTitle, section.id, PianoRoll, {
            section,
            livePlayInstrument,
            numBars: section.numBars,
            initialQuantize: '16n',
            initialNoteDuration: '16n'
        });
    }

    /**
     * Remove a window with a specific id from the app and trigger a rerender.
     */
    removeWindow = (id: string) : void => {
        this.activeWindows = this.activeWindows.filter(window => window.id !== id);
        this.renderApp();
    }

    /**
     * Reorders the zIndex properties of all current windows such that the window with the specified
     * id will be brought to the front, but all other windows will maintain the same visual order in
     * relation to each other. Note - this method merely updates the zIndex properties on the Window
     * class instances, it does not actually trigger any visual updates.
     */
    reorderZIndexes = (id: string) : void => {
        const windowToFocus = this.activeWindows.find(el => el.id === id);
        if (!windowToFocus) return;
        const oldZIndex = windowToFocus.zIndex;
        const newZIndex = this.activeWindows.length - 1;
        if (oldZIndex === newZIndex) return;
        this.activeWindows.forEach(window => {
            if (window.zIndex > oldZIndex) {
                window.zIndex = window.zIndex - 1;
            }
        });
        windowToFocus.zIndex = newZIndex; 
    }

    /**
     * Uses the reorderZIndexes method to put the zIndex properties in the correct order and then 
     * triggers a rerender of the app. 
     */
    focusWindow = (id: string) : void => {
        this.reorderZIndexes(id);
        this.renderApp();
    }

    /**
     * Renders the entire application.
     */
    renderApp = () : void => {
        render(
            html`
                ${generateMenubarMarkup({
                    quantizeValue: this.quantizeValue,
                    setQuantizeValue: this.setQuantizeValue,
                    noteDurationValue: this.noteDurationValue,
                    setNoteDurationValue: this.setNoteDurationValue,
                    scaleKey: this.scaleKey,
                    setScaleKey: this.setScaleKey,
                    scaleType: this.scaleType,
                    setScaleType: this.setScaleType,
                    chordType: this.chordType,
                    setChordType: this.setChordType
                })}
                ${generateTaskbarMarkup(this.activeWindows)}
                ${generateWindowsMarkup(this.activeWindows)}
            `,
            document.getElementById('main-container')
        );
    }

}
