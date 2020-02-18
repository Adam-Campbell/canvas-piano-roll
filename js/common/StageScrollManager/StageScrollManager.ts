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

    /**
     * Gets the current x scroll value.
     */
    get x() : number {
        return this._x;
    }

    /**
     * Sets the x scroll position, and also updates all stage components within the 
     * horizontallyScrollableComponents array with the new x scroll value.
     */
    set x(x: number) {
        this._x = x;
        this.horizontallyScrollableComponents.forEach(component => component.updateX(x));
    }

    /**
     * Gets the current y scroll value.
     */
    get y() : number {
        return this._y;
    }

    /**
     * Sets the y scroll position, and also updates all stage components within the 
     * verticallyScrollableComponents array with the new y scroll value.
     */
    set y(y: number) {
        this._y = y;
        this.verticallyScrollableComponents.forEach(component => component.updateY(y));
    }

}
