export default class ScrollManager {
    constructor(noteGridLayer, velocityLayer, pianoKeyLayer, transportLayer, seekerLineLayer) {
        this._noteGridLayer = noteGridLayer;
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
        this._noteGridLayer.updateX(x);
        this._velocityLayer.updateX(x);
        this._transportLayer.updateX(x);
        this._seekerLineLayer.updateX(x);
    }

    get y() {
        return this._y;
    }

    set y(y) {
        this._y = y;
        this._noteGridLayer.updateY(y);
        this._pianoKeyLayer.updateY(y);
    }

}