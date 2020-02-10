import GridLayer from '../GridLayer';
import SectionLayer from '../SectionLayer';
import TransportLayer from '../TransportLayer';
import SeekerLineLayer from '../SeekerLineLayer';

export default class ScrollManager {

    private gridLayer: GridLayer;
    private sectionLayer: SectionLayer;
    private transportLayer: TransportLayer;
    private seekerLineLayer: SeekerLineLayer;
    private _x: number;
    private _y: number;
    
    constructor(
        gridLayer: GridLayer, 
        sectionLayer: SectionLayer, 
        transportLayer: TransportLayer, 
        seekerLineLayer: SeekerLineLayer
    ) {
        this.gridLayer = gridLayer;
        this.sectionLayer = sectionLayer;
        this.transportLayer = transportLayer;
        this.seekerLineLayer = seekerLineLayer;
        this._x = 0;
        this._y = 30;
    }

    get x() : number {
        return this._x;
    }

    set x(x: number) {
        this._x = x;
        this.gridLayer.updateX(x);
        this.sectionLayer.updateX(x);
        this.transportLayer.updateX(x);
        this.seekerLineLayer.updateX(x);
    }

    get y() : number {
        return this._y;
    }

    set y(y: number) {
        this._y = y;
        //this.gridLayer.updateY(y);
        //this.sectionLayer.updateY(y);
    }

}
