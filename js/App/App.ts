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
    WindowTypes 
} from '../Constants';
import CrazySquare from '../CrazySquare';
import PianoRoll from '../PianoRoll';
import AudioEngine from '../AudioEngine';
import Arranger from '../Arranger';
import HistoryStack from '../HistoryStack';

const windowsData = [
    { id: '0', title: 'Lead Synth' },
    { id: '1', title: 'Wubby Bass' },
    { id: '2', title: 'Ethereal Pads' },
    { id: '3', title: 'Electro Drums' },
    { id: '4', title: 'Arps' }
];

let idx = 0;

export default class App {
    
    private activeWindows: Window[] = [];
    audioEngine: AudioEngine;
    eventEmitter: EventEmitter;
    private historyStack: HistoryStack;

    constructor() {
        this.eventEmitter = new EventEmitter();
        this.audioEngine = new AudioEngine();
        this.audioEngine.init();
        const initialHistoryStackEntry = this.audioEngine.serializeState();
        console.log('initialState: ', initialHistoryStackEntry)
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
        
    }

    init() {
        this.renderApp();
        this.addArrangerWindow();
    }

    private serializeStateAndAddToStack = () =>  {
        // use the audio engine to get the new serialized state, then add it to the stack
        const newState = this.audioEngine.serializeState();
        console.log('HAS SERIALIZED STATE, NEW STATE IS: ', newState);
        this.historyStack.addEntry(newState);
        // this.historyStack.addEntry(
        //     this.audioEngine.serializeState()
        // );
    }

    private undoActionAndPushState = () => {
        //go back to previous history stack entry and emit historyTravelled event with that
        // state
        if (!this.historyStack.isAtStart) {
            const nextState = this.historyStack.goBackwards();
            console.log('TRAVELLED BACK THROUGH HISTORY, NEXT STATE IS: ', nextState)
            this.eventEmitter.emit(Events.historyTravelled, nextState);
        }
    }

    private redoActionAndPushState = () => {
        // go forwards to next history stack entry and emit historyTravelled event with that
        // state
        if (!this.historyStack.isAtEnd) {
            const nextState = this.historyStack.goForwards();
            this.eventEmitter.emit(Events.historyTravelled, nextState);
        }
    }

    addWindow = (childClass: any, childContext: any) => {
        const data = windowsData[idx++];
        const newWindow = new Window({
            id: data.id,
            title: data.title,
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

    addArrangerWindow = () => {
        this.addWindow(Arranger, {
            audioEngine: this.audioEngine
        });
    }

    addPianoRollWindow = (sectionId: string) => {
        console.log(sectionId)
        const { section, livePlayInstrument } = this.audioEngine.getSectionContext(sectionId);
        this.addWindow(PianoRoll, {
            section,
            livePlayInstrument,
            numBars: section.numBars,
            initialQuantize: '16n',
            initialNoteDuration: '16n'
        });
    }

    removeWindow = (id: string) => {
        this.activeWindows = this.activeWindows.filter(window => window.id !== id);
        this.renderApp();
    }

    reorderZIndexes = (id: string) => {
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

    focusWindow = (id: string) => {
        this.reorderZIndexes(id);
        this.renderApp();
    }


    renderApp = () => {
        render(
            html`
                ${generateMenubarMarkup(this.addWindow)}
                ${generateTaskbarMarkup(this.activeWindows)}
                ${generateWindowsMarkup(this.activeWindows)}
            `,
            document.getElementById('main-container')
        );
    }

}