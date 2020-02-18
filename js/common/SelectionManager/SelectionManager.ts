import Konva from 'konva';

export default class SelectionManager {

    private cache = new Set();

    /**
     * Returns a boolean indicating whether the cache contains the id matching the id of the
     * given element.
     */
    has(canvasElement: Konva.Rect) : boolean {
        return this.cache.has(canvasElement.attrs.id);
    }

    /**
     * Extracts the id from the given element and adds the id to the cache. 
     */
    add(canvasElement: Konva.Rect) : void {
        this.cache.add(canvasElement.attrs.id);
    }

    /**
     * Extracts the id from the given element and removes the id from the cache. 
     */
    remove(canvasElement: Konva.Rect) : void {
        this.cache.delete(canvasElement.attrs.id);
    }

    /**
     * Empts the cache and returns whatever was previously in it. 
     */
    clear() : string[] {
        const selected = this.retrieveAll();
        this.cache.clear();
        return selected;
    }

    /**
     * Retrieves everything from the cache. 
     */
    retrieveAll() {
        return Array.from(this.cache.values());
    }

    /**
     * Clears the cache and repopulates it to match the given state. 
     */
    forceToState(selectedNoteIdsState: string[] = []) : void {
        this.cache = new Set(selectedNoteIdsState);
    }

}

