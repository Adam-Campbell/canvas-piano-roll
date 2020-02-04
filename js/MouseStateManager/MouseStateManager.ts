export default class MouseStateManager {
   
    private _x: number;
    private _y: number;
    private _hasTravelled: boolean;
    
    constructor() {
        this._x = null;
        this._y = null;
        this._hasTravelled = null;
    }

    addMouseDownEvent(x: number, y: number) : void {
        this._x = x;
        this._y = y;
        this._hasTravelled = false;
    }

    updateHasTravelled(x: number, y: number) : void {
        if (this._hasTravelled) return;
        const absX = Math.abs(this.x - x);
        const absY = Math.abs(this.y - y);
        if (absX > 5 || absY > 5) {
            this._hasTravelled = true;
        }
    }

    get x() : number {
        return this._x;
    }

    get y() : number {
        return this._y;
    }

    get hasTravelled() : boolean {
        return this._hasTravelled;
    }

}
