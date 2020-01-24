import { Rect, Group } from 'konva';
import colours from '../colours';

export default class NoteLayer {

    constructor(conversionManager, layerRef) {
        this._conversionManager = conversionManager;
        this.layer = layerRef;
        this._notesContainer = new Group({ x: 120, y: 30 });
    }

    init() {
        this.layer.add(this._notesContainer);
        this.layer.batchDraw();
    }

    updateX(x) {
        this._notesContainer.x(x);
        this.layer.batchDraw();
    }

    updateY(y) {
        this._notesContainer.y(y);
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
            fill: isSelected ? colours.grayscale[6] : colours.primary.main,
            stroke: colours.grayscale[7],
            strokeWidth: 1,
            cornerRadius: 2,
            id,
            cachedWidth: width,
            cachedX: x, 
            cachedY: y,
            isNoteRect: true,
            name: 'NOTE'
        });
    }

    addNewNote(x, y, id, width) {
        const newNote = this._createNoteElement(
            x,
            y,
            width || this._conversionManager.noteWidth,
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
                fill: colours.tertiary.main,
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
        noteRect.fill(colours.grayscale[6]);
        this.layer.batchDraw();
    }

    removeSelectedAppearance(noteRect) {
        noteRect.fill(colours.primary.main);
        this.layer.batchDraw();
    }

    shiftNotesUp(noteRectsArray, shiftAmount) {
        noteRectsArray.forEach(noteRect => {
            noteRect.y(
                noteRect.y() - shiftAmount
            );
        });
        this.layer.batchDraw();
        this.updateNotesAttributeCaches(noteRectsArray);
    }

    shiftNotesDown(noteRectsArray, shiftAmount) {
        noteRectsArray.forEach(noteRect => {
            noteRect.y(
                noteRect.y() + shiftAmount
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

}
