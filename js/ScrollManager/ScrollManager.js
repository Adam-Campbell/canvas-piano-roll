export default class ScrollManager {
    
    constructor(gridLayer, noteLayer, velocityLayer, pianoKeyLayer, transportLayer, seekerLineLayer) {
        this._gridLayer = gridLayer;
        this._noteLayer = noteLayer;
        this._velocityLayer = velocityLayer;
        this._pianoKeyLayer = pianoKeyLayer;
        this._transportLayer = transportLayer;
        this._seekerLineLayer = seekerLineLayer;
        this._x = 120;
        this._y = 30;
    }

    get x() {
        return this._x;
    }

    set x(x) {
        this._x = x;
        this._gridLayer.updateX(x);
        this._noteLayer.updateX(x);
        this._velocityLayer.updateX(x);
        this._transportLayer.updateX(x);
        this._seekerLineLayer.updateX(x);
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