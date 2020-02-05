import emitter from './EventEmitter';
import { Events } from './Constants';

export const initQuantizeSelect = () => {
    const quantizeSelect = document.getElementById('quantize-select');
    quantizeSelect.addEventListener('change', e => {
        //console.log(e.target.value);
        //quantizeValue.currentValue = e.target.value;
        emitter.broadcast(Events.quantizeValueUpdate, e.target.value);
    });
};