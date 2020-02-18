export default class MouseStateManager {
   
    private _x: number;
    private _y: number;
    private _hasTravelled: boolean;
    
    constructor() {
        this._x = null;
        this._y = null;
        this._hasTravelled = null;
    }

    /**
     * Adds a mouse event with the x and y coordinates provided, and an initial hasTravelled 
     * value of false. 
     */
    addMouseDownEvent(x: number, y: number) : void {
        this._x = x;
        this._y = y;
        this._hasTravelled = false;
    }

    /**
     * Compares the given x and y coordinates to the x and y coordinates from the stored mouse
     * event, and if their values deviate by more than a certain amount then hasTravelled is
     * set to true. 
     */
    updateHasTravelled(x: number, y: number) : void {
        if (this._hasTravelled) return;
        const absX = Math.abs(this.x - x);
        const absY = Math.abs(this.y - y);
        if (absX > 5 || absY > 5) {
            this._hasTravelled = true;
        }
    }

    /**
     * Returns the x coordinate of the stored mouse event. 
     */
    get x() : number {
        return this._x;
    }

    /**
     * Returns the y coordinate of the stored mouse event.
     */
    get y() : number {
        return this._y;
    }

    /**
     * Returns the hasTravelled value from the stored mouse event.
     */
    get hasTravelled() : boolean {
        return this._hasTravelled;
    }

}
