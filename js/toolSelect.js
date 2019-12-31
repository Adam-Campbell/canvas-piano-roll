// import {
//     ACTIVE_TOOL_CURSOR,
//     ACTIVE_TOOL_PENCIL,
//     ACTIVE_TOOL_MARQUEE
// } from './constants';
import { ACTIVE_TOOL_UPDATE } from './events';
import emitter from './EventEmitter';

export const initToolSelect = () => {
    const cursorInput = document.getElementById('tool-type-cursor');
    const pencilInput = document.getElementById('tool-type-pencil');
    const marqueeInput = document.getElementById('tool-type-marquee');
    [cursorInput, pencilInput, marqueeInput].forEach(input => {
        input.addEventListener('change', e => {
            const tool = e.target.value;
            emitter.broadcast(ACTIVE_TOOL_UPDATE, tool);
        });
    });
}