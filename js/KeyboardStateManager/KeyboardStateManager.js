
/*

key
code
ctrlKey
shiftKey
altKey
metaKey

Key Names:

Shift
Control
Alt



*/

export default class KeyboardStateManager {

    constructor(stageContainer) {
        this._stageContainer = stageContainer;
        this._shiftKey = false;
        this._ctrlKey = false;
        this._altKey = false;
        this._stageContainer.addEventListener('keydown', e => {
            const { key, code, ctrlKey, shiftKey, altKey, metaKey } = e;
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
                this._shiftKey = isPressed;
                break;
            case 'Control':
                this._ctrlKey = isPressed;
                break;
            case 'Alt':
                this._altKey = isPressed;
                break;
        }
    }

    get shiftKey() {
        return this._shiftKey;
    }

    get ctrlKey() {
        return this._ctrlKey;
    }

    get altKey() {
        return this._altKey;
    }

} 