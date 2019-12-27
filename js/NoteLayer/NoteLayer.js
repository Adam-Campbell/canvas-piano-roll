import { Rect, Layer } from 'konva';
import { 
    NOTES_GRID_WIDTH, 
    NOTES_GRID_HEIGHT, 
    BAR_WIDTH, 
    ROW_HEIGHT,
    DRAG_MODE_ADJUST_EXISTING_NOTE_SIZE,
    DRAG_MODE_ADJUST_NOTE_SIZE
} from '../constants';
import emitter from '../EventEmitter';
import { ADD_NOTE, QUANTIZE_VALUE_UPDATE, NOTE_DURATION_UPDATE } from '../events';
import { pitchesArray } from '../pitches';
import { genId } from '../genId';


export default class NoteLayer {

    constructor(conversionManager, setDragMode) {
        this.layer = new Layer({ x: 120 });
        window.noteLayer = this.layer;
        this._conversionManager = conversionManager;
        this._setDragMode = setDragMode;
        this._currentlyEditingNoteId = null;
        this.unsubscribe = emitter.subscribe(ADD_NOTE, (x, y) => {
            this.addNewNote(x, y);
        });
        this.layer.on('mousedown', e => {
            this._handleMouseDown(e);
        })
    }

    updateX(x) {
        this.layer.x(x);
        this.layer.batchDraw();
    }

    updateY(y) {
        this.layer.y(y);
        this.layer.batchDraw();
    }

    addNewNote(x, y) {
        const newNote = new Rect({
            x,
            y,
            width: this._conversionManager.noteWidth,
            height: this._conversionManager.rowHeight,
            fill: 'green',
            stroke: '#222',
            strokeWidth: 1,
            cornerRadius: 1,
            id: 'TEMP_NOTE'
        });
        this.layer.add(newNote);
        this._currentlyEditingNoteId = 'TEMP_NOTE'
        this.layer.draw();
    }

    updateNoteDuration(terminalX) {
        if (this._currentlyEditingNoteId === null) return;
        const newNote = this.layer.findOne(`#${this._currentlyEditingNoteId}`);
        if (newNote) {
            const rectStartX = newNote.attrs.x;
            const roundedTerminalX = this._conversionManager.roundToGridCol(terminalX);
            const newWidth = Math.max(
                roundedTerminalX - rectStartX,
                this._conversionManager.colWidth
            );
            newNote.width(newWidth);
            this.layer.batchDraw();
        }
    }

    confirmNote() {
        const newNote = this.layer.findOne('#TEMP_NOTE');
        if (newNote) {
            newNote.setAttr('id', genId());
        }
    }

    draw() {
        this.layer.removeChildren();
        this.layer.draw();
    }

    _handleMouseDown(e) {
        e.cancelBubble = true;
        const { evt, target } = e;
        if (target instanceof Rect && target.attrs.id !== undefined) {
            const { id, width: rectWidth, x: rectX } = target.attrs;
            const evtX = evt.offsetX - this.layer.x();
            if (rectWidth + rectX - evtX < 10) {
                this._currentlyEditingNoteId = id;
                this._setDragMode(DRAG_MODE_ADJUST_NOTE_SIZE);
            }
        }
    }

}
