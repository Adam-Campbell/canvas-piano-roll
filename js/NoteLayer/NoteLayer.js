import { Rect, Group } from 'konva';

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

    constructor(conversionManager, layerRef) {
        //this.layer = new Layer({ x: 120, y: 30 });
        this._conversionManager = conversionManager;
        this.layer = layerRef;
        this._notesContainer = new Group({ x: 120, y: 30 });
    }

    updateX(x) {
        this._notesContainer.x(x);
        this.layer.batchDraw();
    }

    updateY(y) {
        this._notesContainer.y(y);
        this.layer.batchDraw();
    }

    draw() {
        this.layer.add(this._notesContainer);
        this.layer.batchDraw();
    }

    redrawOnZoomAdjustment(isZoomingIn) {
        const noteElements = this._notesContainer.find('.NOTE');
        const multiplier = isZoomingIn ? 2 : 0.5;
        noteElements.forEach(noteElement => {
            noteElement.x(
                noteElement.x() * multiplier
            );
            noteElement.width(
                noteElement.width() * multiplier
            );
            noteElement.setAttr(
                'cachedX', 
                noteElement.attrs.cachedX * multiplier
            );
            noteElement.setAttr(
                'cachedWidth',
                noteElement.attrs.cachedWidth * multiplier
            );
        });
        this.layer.batchDraw();
    }

    _createNoteElement(x, y, width, id, isSelected) {
        return new Rect({
            x,
            y,
            width,
            height: this._conversionManager.rowHeight,
            fill: isSelected ? '#222' : 'green',
            stroke: '#222',
            strokeWidth: 1,
            cornerRadius: 1,
            id,
            cachedWidth: width,
            cachedX: x, 
            cachedY: y,
            isNoteRect: true,
            name: 'NOTE'
        });
    }

    addNewNote(x, y, id) {
        const newNote = this._createNoteElement(
            x,
            y,
            this._conversionManager.noteWidth,
            id,
            true
        );
        newNote.moveTo(this._notesContainer);
        this.layer.batchDraw();
        return newNote;
    }

    moveNoteToNotesContainer(noteElement) {
        noteElement.moveTo(this._notesContainer);
        this.layer.batchDraw();
    }

    _updateSingleNoteDuration(noteRect, xDelta) {
        const newWidth = Math.max(
            noteRect.attrs.cachedWidth + xDelta,
            this._conversionManager.colWidth
        );
        noteRect.width(newWidth);
    }

    updateNoteDurations(originX, terminalX, noteRectsArray) {
        const xDelta = this._conversionManager.roundToGridCol(
            terminalX - originX
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
            newMarquee.moveTo(this._notesContainer);
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

    forceToState(state) {
        // delete all note elements currently on the layer
        this._notesContainer.destroyChildren();
        // delete marquee element if exists
        const marqueeElement = this.layer.findOne('#MARQUEE');
        if (marqueeElement) {
            marqueeElement.destroy();
        }

        const noteElements = state.notes.map(note => {
            const isSelected = state.selectedNoteIds.includes(note.id);
            const x = this._conversionManager.convertTicksToPx(note.time);
            const y = this._conversionManager.deriveYFromPitch(note.note);
            const width = this._conversionManager.convertTicksToPx(note.duration);
            console.log(x, width);
            const noteElement = this._createNoteElement(
                x,
                y,
                width,
                note.id,
                isSelected
            );
            this._notesContainer.add(noteElement);
            return noteElement;
        });

        this.layer.batchDraw();

        return noteElements;

        // map over notes array, for each note use the addNewNote method to add a note
        // element to the layer. Return the result of this in the map function. The end 
        // result will be an array of the note elements themselves, and this is what should
        // be returned from this method so that the PianoRoll class can update the noteCache
        // with them. 
    }

    











    // redrawOnZoomAdjustment(isZoomingIn) {
    //     const noteElements = this.layer.find('.NOTE');
    //     const multiplier = isZoomingIn ? 2 : 0.5;
    //     noteElements.forEach(noteElement => {
    //         noteElement.x(
    //             noteElement.x() * multiplier
    //         );
    //         noteElement.width(
    //             noteElement.width() * multiplier
    //         );
    //         noteElement.setAttr(
    //             'cachedX', 
    //             noteElement.attrs.cachedX * multiplier
    //         );
    //         noteElement.setAttr(
    //             'cachedWidth',
    //             noteElement.attrs.cachedWidth * multiplier
    //         );
    //     });
    //     this.layer.batchDraw();
    // }

    // _createNoteElement(x, y, width, id, isSelected) {
    //     return new Rect({
    //         x,
    //         y,
    //         width,
    //         height: this._conversionManager.rowHeight,
    //         fill: isSelected ? '#222' : 'green',
    //         stroke: '#222',
    //         strokeWidth: 1,
    //         cornerRadius: 1,
    //         id,
    //         cachedWidth: width,
    //         cachedX: x, 
    //         cachedY: y,
    //         isNoteRect: true,
    //         name: 'NOTE'
    //     });
    // }

    // addNewNote(x, y, id) {
    //     const newNote = this._createNoteElement(
    //         x,
    //         y,
    //         this._conversionManager.noteWidth,
    //         id,
    //         true
    //     );
    //     this.layer.add(newNote);
    //     this.layer.batchDraw();
    //     return newNote;
    // }

    // _updateSingleNoteDuration(noteRect, xDelta) {
    //     const newWidth = Math.max(
    //         noteRect.attrs.cachedWidth + xDelta,
    //         this._conversionManager.colWidth
    //     );
    //     noteRect.width(newWidth);
    // }

    // updateNoteDurations(terminalX, noteRectsArray) {
    //     const xDelta = this._conversionManager.roundToGridCol(
    //         terminalX - this._mouseStateManager.x
    //     );
    //     noteRectsArray.forEach(noteRect => {
    //         this._updateSingleNoteDuration(noteRect, xDelta);
    //     });
    //     this.layer.batchDraw();
    // }

    // updateNotesAttributeCaches(noteRectsArray) {
    //     noteRectsArray.forEach(noteRect => {
    //         noteRect.setAttr('cachedWidth', noteRect.attrs.width);
    //         noteRect.setAttr('cachedX', noteRect.attrs.x);
    //         noteRect.setAttr('cachedY', noteRect.attrs.y);
    //     });
    // }

    // deleteNotes(noteRectsArray) {
    //     noteRectsArray.forEach(noteRect => noteRect.destroy());
    //     this.layer.batchDraw();
    // }

    // draw() {
    //     this.layer.removeChildren();
    //     this.layer.draw();
    // }

    // repositionNotes(xDelta, yDelta, noteRectsArray) {
    //     noteRectsArray.forEach(noteRect => {
    //         const { cachedX, cachedY } = noteRect.attrs;
    //         const newX = Math.max(
    //             cachedX + xDelta,
    //             0
    //         );
    //         const newY = Math.max(
    //             cachedY + yDelta,
    //             0
    //         );
    //         noteRect.x(newX);
    //         noteRect.y(newY);
    //     });
    //     this.layer.batchDraw();
    // }

    // updateSelectionMarquee(originX, originY, terminalX, terminalY) {
    //     const marquee = this.layer.findOne('#MARQUEE');
    //     if (!marquee) {
    //         const newMarquee = new Rect({
    //             x: originX,
    //             y: originY,
    //             width: terminalX - originX,
    //             height: terminalY - originY,
    //             fill: '#08b5d3',
    //             opacity: 0.4,
    //             id: 'MARQUEE'
    //         });
    //         this.layer.add(newMarquee); 
    //     } else {
    //         marquee.x(originX);
    //         marquee.y(originY);
    //         marquee.width(terminalX - originX);
    //         marquee.height(terminalY - originY);
    //     }
    //     this.layer.batchDraw();
    // }

    // clearSelectionMarquee() {
    //     const marquee = this.layer.findOne('#MARQUEE');
    //     if (marquee) {
    //         marquee.destroy();
    //         this.layer.batchDraw();
    //     }
    // }

    // addSelectedAppearance(noteRect) {
    //     noteRect.fill('#222');
    //     this.layer.batchDraw();
    // }

    // removeSelectedAppearance(noteRect) {
    //     noteRect.fill('green');
    //     this.layer.batchDraw();
    // }

    // shiftNotesUp(noteRectsArray) {
    //     noteRectsArray.forEach(noteRect => {
    //         noteRect.y(
    //             noteRect.y() - this._conversionManager.rowHeight
    //         );
    //     });
    //     this.layer.batchDraw();
    //     this.updateNotesAttributeCaches(noteRectsArray);
    // }

    // shiftNotesDown(noteRectsArray) {
    //     noteRectsArray.forEach(noteRect => {
    //         noteRect.y(
    //             noteRect.y() + this._conversionManager.rowHeight
    //         );
    //     });
    //     this.layer.batchDraw();
    //     this.updateNotesAttributeCaches(noteRectsArray);
    // }

    // shiftNotesLeft(noteRectsArray) {
    //     noteRectsArray.forEach(noteRect => {
    //         noteRect.x(
    //             noteRect.x() - this._conversionManager.colWidth
    //         );
    //     });
    //     this.layer.batchDraw();
    //     this.updateNotesAttributeCaches(noteRectsArray);
    // }

    // shiftNotesRight(noteRectsArray) {
    //     noteRectsArray.forEach(noteRect => {
    //         noteRect.x(
    //             noteRect.x() + this._conversionManager.colWidth
    //         );
    //     });
    //     this.layer.batchDraw();
    //     this.updateNotesAttributeCaches(noteRectsArray);
    // }

    // forceToState(state) {
    //     // delete all note elements currently on the layer
    //     const existingNoteElements = this.layer.find('.NOTE');
    //     existingNoteElements.forEach(noteElement => noteElement.destroy());
    //     // delete marquee element if exists
    //     const marqueeElement = this.layer.findOne('#MARQUEE');
    //     if (marqueeElement) {
    //         marqueeElement.destroy();
    //     }
        
    //     console.log(state.notes);

    //     const noteElements = state.notes.map(note => {
    //         const isSelected = state.selectedNoteIds.includes(note.id);
    //         const x = this._conversionManager.convertTicksToPx(note.time);
    //         const y = this._conversionManager.deriveYFromPitch(note.note);
    //         const width = this._conversionManager.convertTicksToPx(note.duration);
    //         console.log(x, width);
    //         const noteElement = this._createNoteElement(
    //             x,
    //             y,
    //             width,
    //             note.id,
    //             isSelected
    //         );
    //         this.layer.add(noteElement);
    //         return noteElement;
    //     });

    //     this.layer.batchDraw();

    //     return noteElements;

    //     // map over notes array, for each note use the addNewNote method to add a note
    //     // element to the layer. Return the result of this in the map function. The end 
    //     // result will be an array of the note elements themselves, and this is what should
    //     // be returned from this method so that the PianoRoll class can update the noteCache
    //     // with them. 
    // }

}
