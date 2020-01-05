import Tone from 'tone';
import emitter from './EventEmitter';
import {
    UNDO_ACTION,
    REDO_ACTION,
    COPY_TO_CLIPBOARD,
    CUT_TO_CLIPBOARD,
    PASTE_FROM_CLIPBOARD
} from './events';

export const initButtons = () => {

    const startButton = document.getElementById('start-button');
    const stopButton = document.getElementById('stop-button');
    const pauseButton = document.getElementById('pause-button');
    startButton.addEventListener('click', e => {
        Tone.Transport.start();
    });
    stopButton.addEventListener('click', e => {
        Tone.Transport.stop();
    });
    pauseButton.addEventListener('click', e => {
        Tone.Transport.pause();
    });

    const undoButton = document.getElementById('undo-button');
    const redoButton = document.getElementById('redo-button');
    undoButton.addEventListener('click', e => {
        emitter.broadcast(UNDO_ACTION);
    });
    redoButton.addEventListener('click', e => {
        emitter.broadcast(REDO_ACTION);
    });

    const cutButton = document.getElementById('cut-button');
    const copyButton = document.getElementById('copy-button');
    const pasteButton = document.getElementById('paste-button');
    cutButton.addEventListener('click', e => {
        emitter.broadcast(CUT_TO_CLIPBOARD);
    });
    copyButton.addEventListener('click', e => {
        emitter.broadcast(COPY_TO_CLIPBOARD);
    });
    pasteButton.addEventListener('click', e => {
        emitter.broadcast(PASTE_FROM_CLIPBOARD);
    });
}