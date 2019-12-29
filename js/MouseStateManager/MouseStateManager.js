export default class MouseStateManager {
    constructor() {
        this._x = null;
        this._y = null;
        this._mouseDownTimestamp = null;
    }

    addMouseDownEvent(x, y, timestamp) {
        this._x = x;
        this._y = y;
        this._mouseDownTimestamp = timestamp;
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
}