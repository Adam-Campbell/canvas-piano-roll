import Konva from 'konva';

export default class CanvasElementCache {

    private cache = {};

    /**
     * Add an element to the cache.
     */
    add(canvasElement: Konva.Rect) {
        const { id } = canvasElement.attrs;
        this.cache[id] = canvasElement;
    }

    /**
     * Remove an element from the cache that you already have a reference to. 
     */
    remove(canvasElement: Konva.Rect) {
        const { id } = canvasElement.attrs;
        delete this.cache[id];
    }

    /**
     * Retrieve an element from the cache by its id. 
     */
    retrieveOne(elementId: string) : Konva.Rect {
        return this.cache[elementId];
    }

    /**
     * Retrieve multiple elements from the cache by their ids. 
     */
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

    /**
     * Retreive all elements from the cache. 
     */
    retrieveAll() : Konva.Rect[] {
        return Object.values(this.cache);
    }

    /**
     * Empties the cache and repopulates it with the given elements.
     */
    forceToState(canvasElementsState: any[]) {
        this.cache = {};
        canvasElementsState.forEach(canvasElement => {
            this.cache[canvasElement.attrs.id] = canvasElement;
        });
    }

}