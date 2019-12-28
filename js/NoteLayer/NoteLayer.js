import { Rect, Layer } from 'konva';
import { 
    NOTES_GRID_WIDTH, 
    NOTES_GRID_HEIGHT, 
    BAR_WIDTH, 
    ROW_HEIGHT,
    DRAG_MODE_ADJUST_EXISTING_NOTE_SIZE,
    DRAG_MODE_ADJUST_NOTE_SIZE,
    DRAG_MODE_ADJUST_NOTE_POSITION
} from '../constants';
import emitter from '../EventEmitter';
import { ADD_NOTE, QUANTIZE_VALUE_UPDATE, NOTE_DURATION_UPDATE } from '../events';
import { pitchesArray } from '../pitches';
import { genId } from '../genId';

/*

Note layer mouse down logic

Possible actions to take:
- update length of note
- update length of all notes in selection
- select note
- deselect note

cursor tool
    if edge click
        && target selected
            -> adjust length of all selected notes
        && target not selected
            -> replace selection with just this notes, then adjust length of all selected notes
               (which is now just this note).
    else if not edge click
        && target selected
            -> enter mode to adjust note position AND take timestamp. On mouseup we compare
               that timestamp with mouseup time, if below threshold we deselect the note.
        && target not selected
            -> do nothing HOWEVER on mouse up we add the note to the selection


pencil tool
    do nothing

marquee tool
  - enter DRAG_MODE_ADJUST_SELECTION




*/




export default class NoteLayer {

    constructor(conversionManager, setDragMode, audioReconciler, noteSelection, keyboardStateManager) {
        this.layer = new Layer({ x: 120 });
        this._conversionManager = conversionManager;
        this._audioReconciler = audioReconciler;
        this._setDragMode = setDragMode;
        this._noteSelection = noteSelection;
        this._keyboardStateManager = keyboardStateManager;
        this._mouseDownTimestamp = null;
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
            id: genId()
        });
        this.layer.add(newNote);
        this._noteSelection.add(newNote);
        this.layer.draw();
    }

    _updateSingleNoteDuration(note, terminalX) {
        const rectStartX = note.attrs.x;
        const roundedTerminalX = this._conversionManager.roundToGridCol(terminalX);
        const newWidth = Math.max(
            roundedTerminalX - rectStartX,
            this._conversionManager.colWidth
        );
        note.width(newWidth);
        this.layer.batchDraw();
    }

    updateNoteDurations(terminalX) {
        //console.log('updateNoteDuration called');
        this._noteSelection.each(note => {
            this._updateSingleNoteDuration(note, terminalX);
        });
    }

    confirmNotes() {
        const notes = this._noteSelection.toArray();
        this._audioReconciler.addNotes(notes);
    }

    draw() {
        this.layer.removeChildren();
        this.layer.draw();
    }

    repositionSelectedNotes(e) {
        console.log('repositionSelectedNotes was called');
    }

    deselectIfNeeded(e) {
        console.log('deselectIfNeeded called');
        const now = Date.now();
        if (now - this._mouseDownTimestamp < 250) {
            console.log('and threshold met');
            this._noteSelection.clear();
            this.layer.batchDraw();
        }
    }

    _handleMouseDown(e) {
        e.cancelBubble = true;
        this._mouseDownTimestamp = Date.now();
        const { evt, target: note } = e;
        const { id, width: rectWidth, x: rectX } = note.attrs;
        const evtX = evt.offsetX - this.layer.x();
        const isEdgeClick = rectWidth + rectX - evtX < 10;
        const isSelected = this._noteSelection.has(note);

        if (isEdgeClick) {
            if (!isSelected) {
                this._noteSelection.clear();
                this._noteSelection.add(note);
            }
            this._setDragMode(DRAG_MODE_ADJUST_NOTE_SIZE);
        } else {
            if (isSelected) {
                this._setDragMode(DRAG_MODE_ADJUST_NOTE_POSITION);
            } else {
                if (!this._keyboardStateManager.shiftKey) {
                    this._noteSelection.clear();
                }
                this._noteSelection.add(note);
                this.layer.batchDraw();
            }
        }

    }

    // _oldhandleMouseDown(e) {
    //     e.cancelBubble = true;
    //     const { evt, target } = e;
    //     if (target instanceof Rect && target.attrs.id !== undefined) {
    //         const { id, width: rectWidth, x: rectX } = target.attrs;
    //         const evtX = evt.offsetX - this.layer.x();
    //         if (rectWidth + rectX - evtX < 10) {
    //             this._currentlyEditingNoteId = id;
    //             this._setDragMode(DRAG_MODE_ADJUST_NOTE_SIZE);
    //         }
    //     }
    // }

}
