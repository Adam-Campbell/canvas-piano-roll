import emitter from './EventEmitter';
import { Events } from './Constants';

export const initToolSelect = () => {
    const cursorInput = document.getElementById('tool-type-cursor');
    const pencilInput = document.getElementById('tool-type-pencil');
    const marqueeInput = document.getElementById('tool-type-marquee');
    [cursorInput, pencilInput, marqueeInput].forEach(input => {
        input.addEventListener('change', e => {
            const tool = e.target.value;
            emitter.broadcast(Events.activeToolUpdate, tool);
        });
    });
}