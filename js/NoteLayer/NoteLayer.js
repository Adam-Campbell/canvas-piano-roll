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
import { 
    doesOverlap,
    canShiftUp,
    canShiftDown,
    canShiftLeft,
    canShiftRight 
} from './utils';

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

    constructor(conversionManager, audioReconciler, noteSelection, mouseStateManager) {
        this.layer = new Layer({ x: 120 });
        this._conversionManager = conversionManager;
        this._audioReconciler = audioReconciler;
        this._noteSelection = noteSelection;
        this._mouseStateManager = mouseStateManager;
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
            id: genId(),
            cachedWidth: this._conversionManager.noteWidth,
            cachedX: x,
            cachedY: y,
            isNoteRect: true
        });
        this.layer.add(newNote);
        this._noteSelection.add(newNote);
        this.layer.draw();
    }

    _updateSingleNoteDuration(note, xDelta) {
        const newWidth = Math.max(
            note.attrs.cachedWidth + xDelta,
            this._conversionManager.colWidth
        );
        note.width(newWidth);
        this.layer.batchDraw();
    }

    updateNoteDurations(terminalX) {
        const xDelta = this._conversionManager.roundToGridCol(
            terminalX - this._mouseStateManager.x
        );
        console.log('xDelta: ', xDelta);
        this._noteSelection.each(note => {
            this._updateSingleNoteDuration(note, xDelta);
        });
    }

    confirmNotes() {
        const notes = this._noteSelection.toArray();
        notes.forEach(note => {
            note.setAttr('cachedWidth', note.attrs.width);
            note.setAttr('cachedX', note.attrs.x);
            note.setAttr('cachedY', note.attrs.y);
        });
        this._audioReconciler.addNotes(notes);
        const allNoteRects = this.layer.find('Rect');
        const asNotes = allNoteRects.map(noteRect => {
            return this._audioReconciler._deriveNoteFromRect(noteRect);
        });
        console.log(asNotes);
    }

    draw() {
        this.layer.removeChildren();
        this.layer.draw();
    }

    repositionSelectedNotes(x, y) {
        console.log('repositionSelectedNotes was called');
        const xDelta = this._conversionManager.roundToGridCol(
            x - this._mouseStateManager.x
        );
        const yDelta = this._conversionManager.roundToGridRow(
            y - this._mouseStateManager.y
        );
        console.log({
            xDelta,
            yDelta
        });
        this._noteSelection.each(note => {
            const { cachedX, cachedY } = note.attrs;
            const newX = Math.max(
                cachedX + xDelta,
                0
            );
            const newY = Math.max(
                cachedY + yDelta,
                0
            );
            note.x(newX);
            note.y(newY);
        });
        this.layer.batchDraw();
    }

    _reconcileSelectionWithMarquee(selectionX1, selectionX2, selectionY1, selectionY2) {
        const rectChildren = this.layer.find('Rect');
        rectChildren.forEach(rect => {
            if (rect.getAttr('id') === 'MARQUEE') {
                return;
            }
            const { x, y, width, height } = rect.attrs;
            const noteX1 = x;
            const noteX2 = x + width;
            const noteY1 = y;
            const noteY2 = y + height;
            const overlapsWithSelection = doesOverlap(
                noteX1,
                noteX2,
                noteY1,
                noteY2,
                selectionX1,
                selectionX2,
                selectionY1,
                selectionY2
            );
            if (overlapsWithSelection) {
                this._noteSelection.add(rect);
            } else {
                this._noteSelection.remove(rect);
            }
            console.log(overlapsWithSelection);
        });
    }

    updateSelectionMarquee(x, y) {
        console.log('updateSelectionMarquee called');
        const mouseDownX = this._conversionManager.roundToGridCol(
            this._mouseStateManager.x
        );
        const mouseDownY = this._conversionManager.roundToGridRow(
            this._mouseStateManager.y
        );
        const currentX = this._conversionManager.roundToGridCol(x);
        const currentY = this._conversionManager.roundToGridRow(y);
        const originX = Math.min(mouseDownX, currentX);
        const terminalX = Math.max(mouseDownX, currentX);
        const originY = Math.min(mouseDownY, currentY);
        const terminalY = Math.max(mouseDownY, currentY);
        const marquee = this.layer.findOne('#MARQUEE');
        if (!marquee) {
            const newMarquee = new Rect({
                x: originX,
                y: originY,
                width: terminalX - originX,
                height: terminalY - originY,
                fill: '#08b5d3',
                opacity: 0.4,
                id: 'MARQUEE'
            });
            this.layer.add(newMarquee); 
        } else {
            marquee.x(originX);
            marquee.y(originY);
            marquee.width(terminalX - originX);
            marquee.height(terminalY - originY);
        }
        this._reconcileSelectionWithMarquee(
            originX, 
            terminalX,
            originY,
            terminalY
        );
        this.layer.batchDraw();
    }

    clearSelectionMarquee() {
        const marquee = this.layer.findOne('#MARQUEE');
        if (marquee) {
            marquee.destroy();
            this.layer.batchDraw();
        }
    }

    _shiftSelectionPitchUp() {
        const notes = this._noteSelection.toArray();
        if (!canShiftUp(notes)) {
            return;
        }
        notes.forEach(note => {
            note.y(
                note.y() - this._conversionManager.rowHeight
            );
        });
        this.layer.batchDraw();
        this.confirmNotes();
    }

    _shiftSelectionPitchDown() {
        const notes = this._noteSelection.toArray();
        if (!canShiftDown(notes, this._conversionManager.gridHeight)) {
            return;
        }
        notes.forEach(note => {
            note.y(
                note.y() + this._conversionManager.rowHeight
            );
        });
        this.layer.batchDraw();
        this.confirmNotes();
    }

    _shiftSelectionTimeBackwards() {
        const notes = this._noteSelection.toArray();
        if (!canShiftLeft(notes)) {
            return;
        }
        notes.forEach(note => {
            note.x(
                note.x() - this._conversionManager.colWidth
            );
        });
        this.layer.batchDraw();
        this.confirmNotes();
    }

    _shiftSelectionTimeForwards() {
        const notes = this._noteSelection.toArray();
        if (!canShiftRight(notes, this._conversionManager.gridWidth)) {
            return;
        }
        notes.forEach(note => {
            note.x(
                note.x() + this._conversionManager.colWidth
            );
        });
        this.layer.batchDraw();
        this.confirmNotes();
    }

}
