import Konva from 'konva';

export default class SelectionManager {

    private cache = new Set();

    has(canvasElement: Konva.Rect) : boolean {
        return this.cache.has(canvasElement.attrs.id);
    }

    add(canvasElement: Konva.Rect) : void {
        this.cache.add(canvasElement.attrs.id);
    }

    remove(canvasElement: Konva.Rect) : void {
        this.cache.delete(canvasElement.attrs.id);
    }

    clear() : string[] {
        const selected = this.retrieveAll();
        this.cache.clear();
        return selected;
    }

    retrieveAll() {
        return Array.from(this.cache.values());
    }

    forceToState(selectedNoteIdsState: string[] = []) : void {
        this.cache = new Set(selectedNoteIdsState);
    }

}

