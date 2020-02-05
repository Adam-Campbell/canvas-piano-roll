import GridLayer from '../GridLayer';
import NoteLayer from '../NoteLayer';
import VelocityLayer from '../VelocityLayer';
import PianoKeyLayer from '../PianoKeyLayer';
import TransportLayer from '../TransportLayer';
import SeekerLineLayer from '../SeekerLineLayer';

export default class ScrollManager {

    private gridLayer: GridLayer;
    private noteLayer: NoteLayer;
    private velocityLayer: VelocityLayer;
    private pianoKeyLayer: PianoKeyLayer;
    private transportLayer: TransportLayer;
    private seekerLineLayer: SeekerLineLayer;
    private _x: number;
    private _y: number;
    
    constructor(
        gridLayer: GridLayer, 
        noteLayer: NoteLayer, 
        velocityLayer: VelocityLayer,
        pianoKeyLayer: PianoKeyLayer, 
        transportLayer: TransportLayer, 
        seekerLineLayer: SeekerLineLayer
    ) {
        this.gridLayer = gridLayer;
        this.noteLayer = noteLayer;
        this.velocityLayer = velocityLayer;
        this.pianoKeyLayer = pianoKeyLayer;
        this.transportLayer = transportLayer;
        this.seekerLineLayer = seekerLineLayer;
        this._x = 120;
        this._y = 30;
    }

    get x() : number {
        return this._x;
    }

    set x(x: number) {
        this._x = x;
        this.gridLayer.updateX(x);
        this.noteLayer.updateX(x);
        this.velocityLayer.updateX(x);
        this.transportLayer.updateX(x);
        this.seekerLineLayer.updateX(x);
    }

    get y() : number {
        return this._y;
    }

    set y(y: number) {
        this._y = y;
        this.gridLayer.updateY(y);
        this.noteLayer.updateY(y);
        this.pianoKeyLayer.updateY(y);
    }

}
