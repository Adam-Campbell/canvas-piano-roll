import EventEmitter from '../EventEmitter';
import {
    Tools,
    Events
} from '../Constants';


export default class SettingsManager {

    private eventEmitter: EventEmitter;
    private _quantize = '16n';
    private _noteDuration = '16n';
    private _scaleKey = 'C';
    private _scaleType = 'major';
    private _shouldShowScaleHighlights = false;
    private _chordType = 'major';
    private _activeTool = Tools.cursor;


    constructor(eventEmitter: EventEmitter) {
        this.eventEmitter = eventEmitter;
    }

    init() {
        this.eventEmitter.subscribe(Events.quantizeValueUpdate, (quantize: string) => {
            this._quantize = quantize;
            this.triggerUIRender();
        });
        this.eventEmitter.subscribe(Events.noteDurationUpdate, (duration: string) => {
            this._noteDuration = duration;
            this.triggerUIRender();
        });
        this.eventEmitter.subscribe(Events.scaleKeyUpdate, (scaleKey: string) => {
            this._scaleKey = scaleKey;
            this.triggerUIRender();
        });
        this.eventEmitter.subscribe(Events.scaleTypeUpdate, (scaleType: string) => {
            this._scaleType = scaleType;
            this.triggerUIRender();
        });
        this.eventEmitter.subscribe(Events.displayScaleUpdate, (shouldShow: boolean) => {
            this._shouldShowScaleHighlights = shouldShow;
            this.triggerUIRender();
        });
        this.eventEmitter.subscribe(Events.chordTypeUpdate, (chordType: string) => {
            this._chordType = chordType;
            this.triggerUIRender();
        });
        this.eventEmitter.subscribe(Events.activeToolUpdate, (activeTool: Tools) => {
            this._activeTool = activeTool;
            this.triggerUIRender();
        });
    }

    get quantize() : string {
        return this._quantize;
    }

    get noteDuration() : string {
        return this._noteDuration;
    }

    get scaleKey() : string {
        return this._scaleKey;
    }

    get scaleType() : string {
        return this._scaleType;
    }

    get shouldShowScaleHighlights() : boolean {
        return this._shouldShowScaleHighlights;
    }

    get chordType() : string {
        return this._chordType;
    }

    get activeTool() : Tools {
        return this._activeTool;
    }

    private triggerUIRender = () => {
        this.eventEmitter.emit(Events.triggerUIRender);
    }

}