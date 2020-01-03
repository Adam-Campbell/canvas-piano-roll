import { Rect, Layer } from 'konva';

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

    constructor(conversionManager, audioReconciler, mouseStateManager) {
        this.layer = new Layer({ x: 120 });
        this._conversionManager = conversionManager;
        this._audioReconciler = audioReconciler;
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

    addNewNote(x, y, id) {
        const newNote = new Rect({
            x,
            y,
            width: this._conversionManager.noteWidth,
            height: this._conversionManager.rowHeight,
            fill: '#222',
            stroke: '#222',
            strokeWidth: 1,
            cornerRadius: 1,
            id,
            cachedWidth: this._conversionManager.noteWidth,
            cachedX: x,
            cachedY: y,
            isNoteRect: true
        });
        this.layer.add(newNote);
        this.layer.batchDraw();
        return newNote;
    }

    _updateSingleNoteDuration(noteRect, xDelta) {
        const newWidth = Math.max(
            noteRect.attrs.cachedWidth + xDelta,
            this._conversionManager.colWidth
        );
        noteRect.width(newWidth);
    }

    updateNoteDurations(terminalX, noteRectsArray) {
        const xDelta = this._conversionManager.roundToGridCol(
            terminalX - this._mouseStateManager.x
        );
        noteRectsArray.forEach(noteRect => {
            this._updateSingleNoteDuration(noteRect, xDelta);
        });
        this.layer.batchDraw();
    }

    updateNotesAttributeCaches(noteRectsArray) {
        noteRectsArray.forEach(noteRect => {
            noteRect.setAttr('cachedWidth', noteRect.attrs.width);
            noteRect.setAttr('cachedX', noteRect.attrs.x);
            noteRect.setAttr('cachedY', noteRect.attrs.y);
        });
    }

    deleteNotes(noteRectsArray) {
        noteRectsArray.forEach(noteRect => noteRect.destroy());
        this.layer.batchDraw();
    }

    draw() {
        this.layer.removeChildren();
        this.layer.draw();
    }

    repositionNotes(xDelta, yDelta, noteRectsArray) {
        noteRectsArray.forEach(noteRect => {
            const { cachedX, cachedY } = noteRect.attrs;
            const newX = Math.max(
                cachedX + xDelta,
                0
            );
            const newY = Math.max(
                cachedY + yDelta,
                0
            );
            noteRect.x(newX);
            noteRect.y(newY);
        });
        this.layer.batchDraw();
    }

    updateSelectionMarquee(originX, originY, terminalX, terminalY) {
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
        this.layer.batchDraw();
    }

    clearSelectionMarquee() {
        const marquee = this.layer.findOne('#MARQUEE');
        if (marquee) {
            marquee.destroy();
            this.layer.batchDraw();
        }
    }

    addSelectedAppearance(noteRect) {
        noteRect.fill('#222');
        this.layer.batchDraw();
    }

    removeSelectedAppearance(noteRect) {
        noteRect.fill('green');
        this.layer.batchDraw();
    }

    shiftNotesUp(noteRectsArray) {
        noteRectsArray.forEach(noteRect => {
            noteRect.y(
                noteRect.y() - this._conversionManager.rowHeight
            );
        });
        this.layer.batchDraw();
        this.updateNotesAttributeCaches(noteRectsArray);
    }

    shiftNotesDown(noteRectsArray) {
        noteRectsArray.forEach(noteRect => {
            noteRect.y(
                noteRect.y() + this._conversionManager.rowHeight
            );
        });
        this.layer.batchDraw();
        this.updateNotesAttributeCaches(noteRectsArray);
    }

    shiftNotesLeft(noteRectsArray) {
        noteRectsArray.forEach(noteRect => {
            noteRect.x(
                noteRect.x() - this._conversionManager.colWidth
            );
        });
        this.layer.batchDraw();
        this.updateNotesAttributeCaches(noteRectsArray);
    }

    shiftNotesRight(noteRectsArray) {
        noteRectsArray.forEach(noteRect => {
            noteRect.x(
                noteRect.x() + this._conversionManager.colWidth
            );
        });
        this.layer.batchDraw();
        this.updateNotesAttributeCaches(noteRectsArray);
    }

}
