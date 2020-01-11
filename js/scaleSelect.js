import emitter from './EventEmitter';
import { SCALE_TYPE_UPDATE } from './events';

export const initScaleSelect = () => {
    const scaleKeySelect = document.getElementById('scale-key-select');
    const scaleTypeSelect = document.getElementById('scale-type-select');
    const handleChange = (e) => {
        const key = scaleKeySelect.value;
        const type = scaleTypeSelect.value;
        const newScale = `${key} ${type}`;
        emitter.broadcast(SCALE_TYPE_UPDATE, newScale);
    }
    scaleKeySelect.addEventListener('change', handleChange);
    scaleTypeSelect.addEventListener('change', handleChange);
}