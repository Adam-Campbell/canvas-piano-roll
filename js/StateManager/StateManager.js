export default class StateManager {
    constructor(stageContainer) {
        this._stageContainer = stageContainer;
        this._shiftKeyPressed = false;
        this._ctrlKeyPressed = false;
        this._altKeyPressed = false;
        this._x = null;
        this._y = null;
        this._mouseDownTimestamp = null;
        this._stageContainer.addEventListener('keydown', e => {
            const { key, code, ctrlKey, shiftKey, altKey, metaKey } = e;
            console.log(key);
            this._updateKeyState(key, true);
        });
        this._stageContainer.addEventListener('keyup', e => {
            const { key, code, ctrlKey, shiftKey, altKey, metaKey } = e;
            this._updateKeyState(key, false);
        });
    }

    _updateKeyState(key, isPressed) {
        switch (key) {
            case 'Shift':
                this._shiftKeyPressed = isPressed;
                break;
            case 'Control':
                this._ctrlKeyPressed = isPressed;
                break;
            case 'Alt':
                this._altKeyPressed = isPressed;
                break;
        }
    }

    get shiftKeyPressed() {
        return this._shiftKey;
    }

    get ctrlKeyPressed() {
        return this._ctrlKey;
    }

    get altKeyPressed() {
        return this._altKey;
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
}