export default class MouseStateManager {
    constructor() {
        this._x = null;
        this._y = null;
        this._mouseDownTimestamp = null;
        this._hasTravelled = null;
    }

    addMouseDownEvent(x, y, timestamp) {
        this._x = x;
        this._y = y;
        this._mouseDownTimestamp = timestamp;
        this._hasTravelled = false;
    }

    updateHasTravelled(x, y) {
        if (this._hasTravelled) return;
        const absX = Math.abs(this.x - x);
        const absY = Math.abs(this.y - y);
        if (absX > 5 || absY > 5) {
            this._hasTravelled = true;
        }
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    get mouseDownTimestamp() {
        return this._mouseDownTimestamp
    }

    get hasTravelled() {
        return this._hasTravelled;
    }
}