export default class KeyboardStateManager {

    constructor(stageContainer) {
        this._stageContainer = stageContainer;
        this._shiftKey = false;
        this._ctrlKey = false;
        this._altKey = false;
        this._keyListeners = {};
        this._stageContainer.addEventListener('keydown', e => {
            const { key, code, repeat, keyCode } = e;
            if (repeat) return;

            const keyString = keyCode >= 65 && keyCode <= 90 ? key.toLowerCase() : key;
            this._updateKeyState(code, true);
            this._triggerKeyListeners(keyString);
        });
        this._stageContainer.addEventListener('keyup', e => {
            const { code } = e;
            this._updateKeyState(code, false);
        });
    }

    _updateKeyState(key, isPressed) {
        switch (key) {
            case 'Shift':
            case 'ShiftLeft':
            case 'ShiftRight':
                this._shiftKey = isPressed;
                break;
            case 'Control':
            case 'ControlLeft':
            case 'ControlRight':
                this._ctrlKey = isPressed;
                break;
            case 'Alt':
            case 'AltLeft':
            case 'AltRight':
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

    addKeyListener(key, cb) {
        if (!this._keyListeners[key]) {
            this._keyListeners[key] = [];
        }
        this._keyListeners[key].push(cb);
        return () => {
            if (this._keyListeners[key]) {
                this._keyListeners[key] = this._keyListeners[key].filter(func => func !== cb);
            }
        }
    }

    _triggerKeyListeners(key) {
        if (this._keyListeners[key]) {
            this._keyListeners[key].forEach(cb => cb());
        }
    }

} 