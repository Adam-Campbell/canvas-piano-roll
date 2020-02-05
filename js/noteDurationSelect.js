import emitter from './EventEmitter';
import { Events } from './Constants';

export const initNoteDurationSelect = () => {
    const noteDurationSelect = document.getElementById('note-duration-select');
    noteDurationSelect.addEventListener('change', e => {
        emitter.broadcast(Events.noteDurationUpdate, e.target.value);
    });
};