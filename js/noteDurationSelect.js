import emitter from './EventEmitter';
import { NOTE_DURATION_UPDATE } from './events';


export const initNoteDurationSelect = () => {
    const noteDurationSelect = document.getElementById('note-duration-select');
    noteDurationSelect.addEventListener('change', e => {
        emitter.broadcast(NOTE_DURATION_UPDATE, e.target.value);
    });
};