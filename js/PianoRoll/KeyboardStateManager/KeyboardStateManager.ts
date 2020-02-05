export default class KeyboardStateManager {

    private stageContainer: HTMLElement;
    private _shiftKey = false;
    private _ctrlKey = false;
    private _altKey = false;
    private keyListeners = {};

    constructor(stageContainer: HTMLElement) {
        console.log(stageContainer)
        this.stageContainer = stageContainer;
        this.stageContainer.addEventListener('keydown', e => {
            console.log('keydown fired')
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

    get shiftKey() : boolean {
        return this._shiftKey;
    }

    get ctrlKey() : boolean {
        return this._ctrlKey;
    }

    get altKey() : boolean {
        return this._altKey;
    }

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

    private triggerKeyListeners(key: string) : void {
        if (this.keyListeners[key]) {
            this.keyListeners[key].forEach(cb => cb());
        }
    }

} 