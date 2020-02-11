import Konva from 'konva';
import Tone from 'tone';
import ConversionManager from '../ConversionManager';
import { Colours, SerializedState, NoteBBS } from '../../Constants';
import { SerializedSectionState } from '../../AudioEngine/AudioEngineConstants';


export default class NoteLayer {

    private conversionManager: ConversionManager;
    private layer: Konva.Layer;
    private notesContainer: Konva.Group;

    constructor(conversionManager: ConversionManager, layerRef: Konva.Layer) {
        this.conversionManager = conversionManager;
        this.layer = layerRef;
        this.notesContainer = new Konva.Group({ x: 120, y: 30 });
    }

    init() : void {
        this.layer.add(this.notesContainer);
        this.layer.batchDraw();
    }

    updateX(x: number) : void {
        this.notesContainer.x(x);
        this.layer.batchDraw();
    }

    updateY(y: number) : void {
        this.notesContainer.y(y);
        this.layer.batchDraw();
    }

    redrawOnZoomAdjustment(isZoomingIn: boolean) : void {
        const noteElements = this.notesContainer.find('.NOTE');
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

    createNoteElement(x: number, y: number, width: number, id: string, isSelected?: boolean) : Konva.Rect {
        return new Konva.Rect({
            x,
            y,
            width,
            height: this.conversionManager.rowHeight,
            fill: isSelected ? Colours.grayscale[6] : Colours.primary.main,
            stroke: Colours.grayscale[7],
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

    addNewNote(x: number, y: number, id: string, width?: number) : Konva.Rect {
        const newNote = this.createNoteElement(
            x,
            y,
            width || this.conversionManager.noteWidth,
            id,
            true
        );
        newNote.moveTo(this.notesContainer);
        this.layer.batchDraw();
        return newNote;
    }

    moveNoteToNotesContainer(noteElement: Konva.Rect) : void {
        noteElement.moveTo(this.notesContainer);
        this.layer.batchDraw();
    }

    private updateSingleNoteDuration(noteRect: Konva.Rect, xDelta: number) : void {
        const newWidth = Math.max(
            noteRect.attrs.cachedWidth + xDelta,
            this.conversionManager.colWidth
        );
        noteRect.width(newWidth);
    }

    updateNoteDurations(originX: number, terminalX: number, noteRectsArray: Konva.Rect[]) : void {
        const xDelta = this.conversionManager.roundToGridCol(
            terminalX - originX
        );
        noteRectsArray.forEach(noteRect => {
            this.updateSingleNoteDuration(noteRect, xDelta);
        });
        this.layer.batchDraw();
    }

    updateNotesAttributeCaches(noteRectsArray: Konva.Rect[]) : void {
        noteRectsArray.forEach(noteRect => {
            noteRect.setAttr('cachedWidth', noteRect.attrs.width);
            noteRect.setAttr('cachedX', noteRect.attrs.x);
            noteRect.setAttr('cachedY', noteRect.attrs.y);
        });
    }

    deleteNotes(noteRectsArray: Konva.Rect[]) : void {
        noteRectsArray.forEach(noteRect => noteRect.destroy());
        this.layer.batchDraw();
    }

    repositionNotes(xDelta: number, yDelta: number, noteRectsArray: Konva.Rect[]) : void {
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

    updateSelectionMarquee(originX: number, originY: number, terminalX: number, terminalY: number) : void {
        const marquee = this.layer.findOne('#MARQUEE');
        if (!marquee) {
            const newMarquee = new Konva.Rect({
                x: originX,
                y: originY,
                width: terminalX - originX,
                height: terminalY - originY,
                fill: Colours.tertiary.main,
                opacity: 0.4,
                id: 'MARQUEE'
            });
            newMarquee.moveTo(this.notesContainer);
        } else {
            marquee.x(originX);
            marquee.y(originY);
            marquee.width(terminalX - originX);
            marquee.height(terminalY - originY);
        }
        this.layer.batchDraw();
    }

    clearSelectionMarquee() : void {
        const marquee = this.layer.findOne('#MARQUEE');
        if (marquee) {
            marquee.destroy();
            this.layer.batchDraw();
        }
    }

    addSelectedAppearance(noteRect: Konva.Rect) : void {
        noteRect.fill(Colours.grayscale[6]);
        this.layer.batchDraw();
    }

    removeSelectedAppearance(noteRect: Konva.Rect) : void {
        noteRect.fill(Colours.primary.main);
        this.layer.batchDraw();
    }

    shiftNotesUp(noteRectsArray: Konva.Rect[], shiftAmount: number) : void {
        noteRectsArray.forEach(noteRect => {
            noteRect.y(
                noteRect.y() - shiftAmount
            );
        });
        this.layer.batchDraw();
        this.updateNotesAttributeCaches(noteRectsArray);
    }

    shiftNotesDown(noteRectsArray: Konva.Rect[], shiftAmount: number) : void {
        noteRectsArray.forEach(noteRect => {
            noteRect.y(
                noteRect.y() + shiftAmount
            );
        });
        this.layer.batchDraw();
        this.updateNotesAttributeCaches(noteRectsArray);
    }

    shiftNotesLeft(noteRectsArray: Konva.Rect[]) : void {
        noteRectsArray.forEach(noteRect => {
            noteRect.x(
                noteRect.x() - this.conversionManager.colWidth
            );
        });
        this.layer.batchDraw();
        this.updateNotesAttributeCaches(noteRectsArray);
    }

    shiftNotesRight(noteRectsArray: Konva.Rect[]) : void {
        noteRectsArray.forEach(noteRect => {
            noteRect.x(
                noteRect.x() + this.conversionManager.colWidth
            );
        });
        this.layer.batchDraw();
        this.updateNotesAttributeCaches(noteRectsArray);
    }

    forceToState(state: SerializedSectionState) : Konva.Rect[] {
        // delete all note elements currently on the layer
        this.notesContainer.destroyChildren();
        // delete marquee element if exists
        const marqueeElement = this.layer.findOne('#MARQUEE');
        if (marqueeElement) {
            marqueeElement.destroy();
        }

        const noteElements = Object.values(state.notes).map((note: NoteBBS) => {
            const noteRectX = this.conversionManager.convertTicksToPx(
                Tone.Ticks(note.time).toTicks()
            );
            const noteRectWidth = this.conversionManager.convertTicksToPx(
                Tone.Ticks(note.duration).toTicks()
            );
            const noteRectY = this.conversionManager.deriveYFromPitch(note.note);
            const noteRectId = note.id;
            const noteRect = this.createNoteElement(
                noteRectX,
                noteRectY,
                noteRectWidth,
                noteRectId,
                false
            );
            noteRect.moveTo(this.notesContainer);
            return noteRect;
        });
        this.layer.batchDraw();
        return noteElements;

        // const noteElements = state.notes.map(note => {
        //     const isSelected = state.selectedNoteIds.includes(note.id);
        //     const x = this.conversionManager.convertTicksToPx(note.time);
        //     const y = this.conversionManager.deriveYFromPitch(note.note);
        //     const width = this.conversionManager.convertTicksToPx(note.duration);
        //     console.log(x, width);
        //     const noteElement = this.createNoteElement(
        //         x,
        //         y,
        //         width,
        //         note.id,
        //         isSelected
        //     );
        //     this.notesContainer.add(noteElement);
        //     return noteElement;
        // });

        // this.layer.batchDraw();

        // return noteElements;

        // map over notes array, for each note use the addNewNote method to add a note
        // element to the layer. Return the result of this in the map function. The end 
        // result will be an array of the note elements themselves, and this is what should
        // be returned from this method so that the PianoRoll class can update the noteCache
        // with them. 
    }

}
