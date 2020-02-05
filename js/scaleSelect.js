import emitter from './EventEmitter';
import { Events } from './Constants';

export const initScaleSelect = () => {
    const scaleKeySelect = document.getElementById('scale-key-select');
    const scaleTypeSelect = document.getElementById('scale-type-select');
    const handleChange = (e) => {
        const key = scaleKeySelect.value;
        const type = scaleTypeSelect.value;
        const newScale = `${key} ${type}`;
        emitter.broadcast(Events.scaleTypeUpdate, newScale);
    }
    scaleKeySelect.addEventListener('change', handleChange);
    scaleTypeSelect.addEventListener('change', handleChange);

    const displayScaleToggle = document.getElementById('display-scale-toggle');
    displayScaleToggle.addEventListener('change', e => {
        emitter.broadcast(Events.displayScaleUpdate, e.target.checked);
    });
}