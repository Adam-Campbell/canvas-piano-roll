import Tone from 'tone';
import emitter from './EventEmitter';
import { Events } from './Constants';

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
        emitter.broadcast(Events.undoAction);
    });
    redoButton.addEventListener('click', e => {
        emitter.broadcast(Events.redoAction);
    });

    const cutButton = document.getElementById('cut-button');
    const copyButton = document.getElementById('copy-button');
    const pasteButton = document.getElementById('paste-button');
    cutButton.addEventListener('click', e => {
        emitter.broadcast(Events.cutToClipboard);
    });
    copyButton.addEventListener('click', e => {
        emitter.broadcast(Events.copyToClipboard);
    });
    pasteButton.addEventListener('click', e => {
        emitter.broadcast(Events.pasteFromClipboard);
    });
}