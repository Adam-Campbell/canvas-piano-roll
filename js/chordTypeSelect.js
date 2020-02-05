import emitter from './EventEmitter';
import { Events } from './Constants';

export const initChordTypeSelect = () => {
    const chordTypeSelect = document.getElementById('chord-type-select');
    chordTypeSelect.addEventListener('change', e => {
        emitter.broadcast(Events.chordTypeUpdate, e.target.value);
    });
};
