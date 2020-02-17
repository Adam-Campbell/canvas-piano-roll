import {
    HorizontallyScrollableComponent,
    VerticallyScrollableComponent
} from '../../Constants';

export default class StageScrollManager {

    private _x: number;
    private _y: number;
    private horizontallyScrollableComponents: HorizontallyScrollableComponent[];
    private verticallyScrollableComponents: VerticallyScrollableComponent[];
    
    constructor(
        horizontallyScrollableComponents: HorizontallyScrollableComponent[],
        verticallyScrollableComponents: VerticallyScrollableComponent[],
        initialX: number,
        initialY: number
    ) {
        this.horizontallyScrollableComponents = [ ...horizontallyScrollableComponents ];
        this.verticallyScrollableComponents = [ ...verticallyScrollableComponents ]; 
        this._x = initialX;
        this._y = initialY;
    }

    get x() : number {
        return this._x;
    }

    set x(x: number) {
        this._x = x;
        this.horizontallyScrollableComponents.forEach(component => component.updateX(x));
        // this.gridLayer.updateX(x);
        // this.sectionLayer.updateX(x);
        // this.transportLayer.updateX(x);
        // this.seekerLineLayer.updateX(x);
    }

    get y() : number {
        return this._y;
    }

    set y(y: number) {
        this._y = y;
        this.verticallyScrollableComponents.forEach(component => component.updateY(y));
        // this.gridLayer.updateY(y);
        // this.sectionLayer.updateY(y);
        // this.channelInfoLayer.updateY(y);
    }

}
