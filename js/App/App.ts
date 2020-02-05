import { render, html } from 'lit-html';
import Window from '../Window';
import EventEmitter from '../EventEmitter';
import {
    generateMenubarMarkup,
    generateTaskbarMarkup,
    generateWindowsMarkup, 
} from './templateFns';
import { Events } from '../Constants';
import CrazySquare from '../CrazySquare';

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

    eventEmitter = new EventEmitter();

    constructor() {
        this.eventEmitter.subscribe(Events.closeWindow, this.removeWindow);
        this.eventEmitter.subscribe(Events.renderApp, this.renderApp);
        this.eventEmitter.subscribe(Events.focusWindow, this.focusWindow);
    }

    addWindow = () => {
        const data = windowsData[idx++];
        const newWindow = new Window(
            data.id,
            data.title,
            this.eventEmitter,
            this.activeWindows.length,
            CrazySquare
        );
        this.activeWindows.push(newWindow);
        this.renderApp();
        newWindow.init();
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