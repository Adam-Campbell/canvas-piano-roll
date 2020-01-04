import { Stage, Layer, Shape, Rect, Tween, Easings } from 'konva';
import { STAGE_WIDTH, STAGE_HEIGHT } from './constants';
import { initQuantizeSelect } from './quantizeSelect';
import { initNoteDurationSelect } from './noteDurationSelect';
import emitter from './EventEmitter';
import PianoRoll from './PianoRoll/index.js';
import { initButtons } from './buttons';
import { initToolSelect } from './toolSelect';

initQuantizeSelect();
initNoteDurationSelect();
initButtons();
initToolSelect();

const initialWidth = document.documentElement.clientWidth;
const initialHeight = document.documentElement.clientHeight - 50;

const pianoRoll = new PianoRoll('canvas-container', initialWidth, initialHeight).init();