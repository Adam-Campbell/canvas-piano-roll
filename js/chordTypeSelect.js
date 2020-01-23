import emitter from './EventEmitter';
import { CHORD_TYPE_UPDATE } from './events';

export const initChordTypeSelect = () => {
    const chordTypeSelect = document.getElementById('chord-type-select');
    chordTypeSelect.addEventListener('change', e => {
        emitter.broadcast(CHORD_TYPE_UPDATE, e.target.value);
    });
};
