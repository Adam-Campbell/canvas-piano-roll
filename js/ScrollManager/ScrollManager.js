export default class ScrollManager {
    constructor(gridLayer, noteLayer, pianoKeyLayer) {
        this._gridLayer = gridLayer;
        this._noteLayer = noteLayer;
        this._pianoKeyLayer = pianoKeyLayer;
        this._x = 120;
        this._y = 0;
    }

    get x() {
        return this._x;
    }

    set x(x) {
        this._x = x;
        this._gridLayer.updateX(x);
        this._noteLayer.updateX(x);
    }

    get y() {
        return this._y;
    }

    set y(y) {
        this._y = y;
        this._gridLayer.updateY(y);
        this._noteLayer.updateY(y);
        this._pianoKeyLayer.updateY(y);
    }

}