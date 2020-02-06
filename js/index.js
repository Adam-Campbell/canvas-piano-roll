import { initQuantizeSelect } from './quantizeSelect';
import { initNoteDurationSelect } from './noteDurationSelect';
//import emitter from './EventEmitter';
//import PianoRoll from './PianoRoll';
//import { initButtons } from './buttons';
//import { initToolSelect } from './toolSelect';
//import { initScaleSelect } from './scaleSelect';
//import { initChordTypeSelect } from './chordTypeSelect';
import App from './App';


const app = new App();
app.renderApp();

window.audioEngine = app.audioEngine;
app.audioEngine.addChannel('Channel 1');
const section = app.audioEngine.channels[0].addSection('0:0:0', 8);

app.addPianoRollWindow(section.id);



// initQuantizeSelect();
// initNoteDurationSelect();
// initButtons();
// initToolSelect();
// initScaleSelect();
// initChordTypeSelect();

// const initialWidth = document.documentElement.clientWidth;
// const initialHeight = document.documentElement.clientHeight - 50;

// const pianoRoll = new PianoRoll('canvas-container', initialWidth, initialHeight).init();