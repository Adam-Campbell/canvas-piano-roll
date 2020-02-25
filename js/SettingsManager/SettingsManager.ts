import EventEmitter from '../EventEmitter';
import {
    Tools,
    Events
} from '../Constants';


export default class SettingsManager {

    private emitter: EventEmitter;
    private _quantize = '16n';
    private _noteDuration = '16n';
    private _scaleKey = 'C';
    private _scaleType = 'major';
    private _shouldShowScaleHighlights = false;
    private _chordType = 'major';
    private _activeTool = Tools.cursor;


    constructor(eventEmitter: EventEmitter) {
        this.emitter = eventEmitter;
    }

    init() {
        this.emitter.subscribe(Events.quantizeValueUpdate, (quantize: string) => this._quantize = quantize);
        this.emitter.subscribe(Events.noteDurationUpdate, (duration: string) => this._noteDuration = duration);
        this.emitter.subscribe(Events.scaleKeyUpdate, (scaleKey: string) => this._scaleKey = scaleKey);
        this.emitter.subscribe(Events.scaleTypeUpdate, (scaleType: string) => this._scaleType = scaleType);
        this.emitter.subscribe(Events.displayScaleUpdate, (shouldShow: boolean) => {
            this._shouldShowScaleHighlights = shouldShow;
        });
        this.emitter.subscribe(Events.chordTypeUpdate, (chordType: string) => this._chordType = chordType);
        this.emitter.subscribe(Events.activeToolUpdate, (activeTool: Tools) => this._activeTool = activeTool);
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

    get activeTool() : string {
        return this._activeTool;
    }

}