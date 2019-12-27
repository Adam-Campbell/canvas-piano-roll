import emitter from './EventEmitter';
import { QUANTIZE_VALUE_UPDATE } from './events';


export const initQuantizeSelect = () => {
    const quantizeSelect = document.getElementById('quantize-select');
    quantizeSelect.addEventListener('change', e => {
        //console.log(e.target.value);
        //quantizeValue.currentValue = e.target.value;
        emitter.broadcast(QUANTIZE_VALUE_UPDATE, e.target.value);
    });
};