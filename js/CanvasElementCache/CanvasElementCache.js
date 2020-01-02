export default class CanvasElementCache {
    constructor() {
        this._cache = {};
    }

    add(canvasElement) {
        const { id } = canvasElement.attrs;
        this._cache[id] = canvasElement;
    }

    remove(canvasElement) {
        const { id } = canvasElement.attrs;
        delete this._cache[id];
    }

    retrieveOne(elementId) {
        return this._cache[elementId];
    }

    retrieve(elementIds) {
        let canvasElementsArr = [];
        elementIds.forEach(id => {
            const canvasElement = this._cache[id];
            if (canvasElement) {
                canvasElementsArr.push(canvasElement);
            }
        });
        return canvasElementsArr;
    }

    retrieveAll() {
        return Object.values(this._cache);
    }

}