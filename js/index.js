import { Stage, Layer, Shape, Rect, Tween, Easings } from 'konva';
import { STAGE_WIDTH, STAGE_HEIGHT } from './Constants';
import { initQuantizeSelect } from './quantizeSelect';
import { initNoteDurationSelect } from './noteDurationSelect';
import emitter from './EventEmitter';
//import PianoRoll from './PianoRoll/index.ts';
import PianoRoll from './PianoRoll';
import { initButtons } from './buttons';
import { initToolSelect } from './toolSelect';
import { initScaleSelect } from './scaleSelect';
import { initChordTypeSelect } from './chordTypeSelect';


initQuantizeSelect();
initNoteDurationSelect();
initButtons();
initToolSelect();
initScaleSelect();
initChordTypeSelect();

const initialWidth = document.documentElement.clientWidth;
const initialHeight = document.documentElement.clientHeight - 50;

const pianoRoll = new PianoRoll('canvas-container', initialWidth, initialHeight).init();