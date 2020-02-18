export default class KeyboardStateManager {

    private stageContainer: HTMLElement;
    private _shiftKey = false;
    private _ctrlKey = false;
    private _altKey = false;
    private keyListeners = {};

    constructor(stageContainer: HTMLElement) {
        this.stageContainer = stageContainer;
        this.stageContainer.addEventListener('keydown', e => {
            const { key, code, repeat, keyCode } = e;
            if (repeat) return;

            const keyString = keyCode >= 65 && keyCode <= 90 ? key.toLowerCase() : key;
            this.updateKeyState(code, true);
            this.triggerKeyListeners(keyString);
        });
        this.stageContainer.addEventListener('keyup', e => {
            const { code } = e;
            this.updateKeyState(code, false);
        });
    }

    /**
     * If the key is one of the keys that this class is responsible for tracking the state of,
     * then it updates its internal state for that key according to isPressed.
     */
    private updateKeyState(key: string, isPressed: boolean) : void {
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

    /**
     * Returns true if the shift key is currently pressed, else false.
     */
    get shiftKey() : boolean {
        return this._shiftKey;
    }

    /**
     * Returns true if the contol key is currently pressed, else false. 
     */
    get ctrlKey() : boolean {
        return this._ctrlKey;
    }

    /**
     * Returns true if the alt key is currently pressed, else false.
     */
    get altKey() : boolean {
        return this._altKey;
    }

    /**
     * Registers a key listener that will call the given callback whenever the given key is pressed. 
     * Returns a function that when called will terminate the key listener. 
     */
    addKeyListener(key: string, cb: Function) : Function {
        if (!this.keyListeners[key]) {
            this.keyListeners[key] = [];
        }
        this.keyListeners[key].push(cb);
        return () => {
            if (this.keyListeners[key]) {
                this.keyListeners[key] = this.keyListeners[key].filter(func => func !== cb);
            }
        }
    }

    /**
     * Given a key, triggers all key listeners currently listening for that key, if any such
     * key listeners exist. 
     */
    private triggerKeyListeners(key: string) : void {
        if (this.keyListeners[key]) {
            this.keyListeners[key].forEach(cb => cb());
        }
    }

} 