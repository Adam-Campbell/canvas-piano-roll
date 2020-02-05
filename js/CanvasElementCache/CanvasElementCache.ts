import Konva from 'konva';

export default class CanvasElementCache {

    private cache = {};

    add(canvasElement: Konva.Rect) {
        const { id } = canvasElement.attrs;
        this.cache[id] = canvasElement;
    }

    remove(canvasElement: Konva.Rect) {
        const { id } = canvasElement.attrs;
        delete this.cache[id];
    }

    retrieveOne(elementId: string) : Konva.Rect {
        return this.cache[elementId];
    }

    retrieve(elementIds: string[]) : Konva.Rect[] {
        let canvasElementsArr = [];
        elementIds.forEach(id => {
            const canvasElement = this.cache[id];
            if (canvasElement) {
                canvasElementsArr.push(canvasElement);
            }
        });
        return canvasElementsArr;
    }

    retrieveAll() : Konva.Rect[] {
        return Object.values(this.cache);
    }

    forceToState(canvasElementsState) {
        this.cache = {};
        canvasElementsState.forEach(canvasElement => {
            this.cache[canvasElement.attrs.id] = canvasElement;
        });
    }

}