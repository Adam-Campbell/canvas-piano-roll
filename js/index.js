import { initQuantizeSelect } from './quantizeSelect';
import { initNoteDurationSelect } from './noteDurationSelect';
//import emitter from './EventEmitter';
//import PianoRoll from './PianoRoll';
//import { initButtons } from './buttons';
//import { initToolSelect } from './toolSelect';
//import { initScaleSelect } from './scaleSelect';
//import { initChordTypeSelect } from './chordTypeSelect';
import App from './App';

//console.log('Hello world')
const app = new App();
app.renderApp();
app.addWindow();

//app.addWindow();
//app.renderApp();


// initQuantizeSelect();
// initNoteDurationSelect();
// initButtons();
// initToolSelect();
// initScaleSelect();
// initChordTypeSelect();

// const initialWidth = document.documentElement.clientWidth;
// const initialHeight = document.documentElement.clientHeight - 50;

// const pianoRoll = new PianoRoll('canvas-container', initialWidth, initialHeight).init();