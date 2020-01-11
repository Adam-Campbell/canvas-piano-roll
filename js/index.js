import { Stage, Layer, Shape, Rect, Tween, Easings } from 'konva';
import { STAGE_WIDTH, STAGE_HEIGHT } from './constants';
import { initQuantizeSelect } from './quantizeSelect';
import { initNoteDurationSelect } from './noteDurationSelect';
import emitter from './EventEmitter';
import PianoRoll from './PianoRoll/index.js';
import { initButtons } from './buttons';
import { initToolSelect } from './toolSelect';
import { scale } from '@tonaljs/scale';
import { note } from '@tonaljs/tonal';
import { initScaleSelect } from './scaleSelect';

//const cMajorScale = scale('c major');
//console.log(cMajorScale);

//console.log(scale('c minor'));
console.log(scale('c melodic minor'))
//console.log(note('c#'));
//console.log(note('db'))
//console.log(note('c'))

initQuantizeSelect();
initNoteDurationSelect();
initButtons();
initToolSelect();
initScaleSelect();

const initialWidth = document.documentElement.clientWidth;
const initialHeight = document.documentElement.clientHeight - 50;

const pianoRoll = new PianoRoll('canvas-container', initialWidth, initialHeight).init();