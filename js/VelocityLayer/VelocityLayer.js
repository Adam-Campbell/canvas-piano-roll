import { Layer, Rect, Group } from 'konva';
import {
    STAGE_HEIGHT,
    SCROLLBAR_WIDTH
} from '../constants';

export default class VelocityLayer {
    constructor(conversionManager) {
        this.layer = new Layer({ x: 120 });
        this._conversionManager = conversionManager;
        this._background = this._constructBackground();
        this._border = this._constructBorder();
        this._unselectedGroup = new Group();
        this._selectedGroup = new Group();
        this.layer.on('mousedown', e => {
            this._handleMouseDown(e);
        });
    }

    updateX(x) {
        this.layer.x(x);
        this.layer.batchDraw();
    }

    _constructBackground() {
        const background = new Rect({
            width: this._conversionManager.gridWidth,
            height: 60,
            x: 0,
            y: STAGE_HEIGHT - SCROLLBAR_WIDTH - 60,
            fill: '#acacac'
        });
        return background;
    }

    _constructBorder() {
        const border = new Rect({
            width: this._conversionManager.gridWidth,
            height: 2,
            x: 0,
            y: STAGE_HEIGHT - SCROLLBAR_WIDTH - 60,
            fill: '#222'
        });
        return border;
    }

    addNewVelocityMarker(noteRect) {
        const { x, id } = noteRect.getAttrs();
        const velocityMarker = new Rect({
            width: 8,
            height: 50,
            cornerRadius: [2, 2, 0, 0],
            x,
            y: STAGE_HEIGHT - SCROLLBAR_WIDTH - 50,
            fill: '#222',
            id,
            cachedX: x
        });
        //this._unselectedGroup.add(velocityMarker);
        velocityMarker.moveTo(this._selectedGroup);
        this.layer.batchDraw(); 
    }

    deleteVelocityMarkers(noteRectsArray) {
        noteRectsArray.forEach(noteRect => {
            const id = noteRect.getAttr('id');
            const velocityRect = this.layer.findOne(`#${id}`);
            velocityRect.destroy();
        });
        this.layer.batchDraw();
    }

    updateVelocityMarkersAttributeCaches(noteRectsArray) {
        noteRectsArray.forEach(noteRect => {
            const id = noteRect.getAttr('id');
            const velocityRect = this.layer.findOne(`#${id}`);
            velocityRect.setAttr('cachedX', velocityRect.attrs.x);
        });
    }

    repositionVelocityMarkers(xDelta, noteRectsArray) {
        noteRectsArray.forEach(noteRect => {
            const id = noteRect.getAttr('id');
            const velocityRect = this.layer.findOne(`#${id}`);
            const { cachedX } = velocityRect.attrs;
            const newX = Math.max(
                cachedX + xDelta,
                0
            );
            velocityRect.x(newX);
        });
        this.layer.batchDraw();
    }

    shiftVelocityMarkersLeft(noteRects) {
        noteRects.forEach(noteRect => {
            const id = noteRect.getAttr('id');
            const velocityRect = this.layer.findOne(`#${id}`);
            velocityRect.x(
                velocityRect.x() - this._conversionManager.colWidth
            );
        });
        this.layer.batchDraw();
    }

    shiftVelocityMarkersRight(noteRects) {
        noteRects.forEach(noteRect => {
            const id = noteRect.getAttr('id');
            const velocityRect = this.layer.findOne(`#${id}`);
            velocityRect.x(
                velocityRect.x() + this._conversionManager.colWidth
            );
        });
        this.layer.batchDraw();
    }

    addSelectedAppearance(noteRect) {
        const id = noteRect.getAttr('id');
        const velocityRect = this.layer.findOne(`#${id}`);
        velocityRect.fill('#222');
        velocityRect.moveTo(this._selectedGroup);
        this.layer.batchDraw();
    }

    removeSelectedAppearance(noteRect) {
        const id = noteRect.getAttr('id');
        const velocityRect = this.layer.findOne(`#${id}`);
        velocityRect.fill('green');
        velocityRect.moveTo(this._unselectedGroup);
        this.layer.batchDraw();
    }

    draw() {
        this.layer.add(this._background);
        this.layer.add(this._border);
        this.layer.add(this._unselectedGroup);
        this.layer.add(this._selectedGroup);
        this.layer.batchDraw();
    }

    /*
        Mousedown logic:

        All of this logic should take place in the PianoRoll class. Move it to there. I just started
        it here for ease. 

        - calculate the velocityValue based on event (done).
        - calculate the grid col clicked based on event (done).
        - determine whether there were any matching velocity rects (any with an x value matching
          the grid col calculation).
        
        - if there are none, return. 
        - still need to work out desired behaviour if there is one or more. Maybe:
            - if one, update it.
            - if multiple and none are selected or all are selected, update all.
            - if multiple but only some selected, update selected ones but don't touch the others. 

        - whichever ones do get updated:
        - update the velocity rects appearance (y and height) based on the velocityValue calculated earlier.
        - update the note in the audio reconcilier.

    */
    _handleMouseDown(e) {
        e.cancelBubble = true;
        const { evt, target } = e;
        const { offsetX, offsetY } = evt;

        const pxFromBottom = STAGE_HEIGHT - offsetY - SCROLLBAR_WIDTH;
        const velocityValue = pxFromBottom / 50;
        
        const roundedX = this._conversionManager.roundDownToGridCol(
            offsetX - this.layer.x()
        );
        console.log(roundedX);
    }
}