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
        this.emitter.subscribe(Events.quantizeValueUpdate, (quantize) => this._quantize = quantize);
        this.emitter.subscribe(Events.noteDurationUpdate, (duration) => this._noteDuration = duration);
        
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