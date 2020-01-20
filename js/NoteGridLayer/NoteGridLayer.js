import { Layer, Rect, Line, Group } from 'konva';
import { 
    getHorizontalLinesData,
    getVerticalLinesData
} from './utils';
import emitter from '../EventEmitter'; 
import { 
    QUANTIZE_VALUE_UPDATE,
    NOTE_DURATION_UPDATE,
    SCALE_TYPE_UPDATE,
    DISPLAY_SCALE_UPDATE
} from '../events';
import {
    SCROLLBAR_WIDTH
} from '../constants';
import { pitchesArray } from '../pitches';
import { scale } from '@tonaljs/scale';
import { note } from '@tonaljs/tonal';
import { createContextMenu } from '../createContextMenu';

const isSameNote = (noteA, noteB) => note(noteA).chroma === note(noteB).chroma;

export default class NoteGridLayer {

    constructor(conversionManager) {
        this.layer = new Layer();
        this._gridContainer = new Group({ x: 120, y: 30 });
        this._scaleHighlightsSubContainer = null;
        this._gridLinesSubContainer = null;
        this._notesContainer = new Group({ x: 120, y: 30 });
        this._conversionManager = conversionManager;
        this._scaleType = 'C major';
        this._shouldDisplayScaleHighlighting = false;
        this._unsubscribe1 = emitter.subscribe(QUANTIZE_VALUE_UPDATE, qVal => {
            this._drawGrid();
        });
        this._unsubscribe2 = emitter.subscribe(SCALE_TYPE_UPDATE, scaleType => {
            this._scaleType = scaleType;
            console.log(scaleType);
            this._drawScaleHighlights();
        });
        this._unsubscribe3 = emitter.subscribe(DISPLAY_SCALE_UPDATE, shouldDisplay => {
            this._shouldDisplayScaleHighlighting = shouldDisplay;
            this._drawScaleHighlights();
        });
    }

    updateX(x) {
        //this.layer.x(x);
        this._gridContainer.x(x);
        this._notesContainer.x(x);
        this.layer.batchDraw();
    }

    updateY(y) {
        this._gridContainer.y(y);
        this._notesContainer.y(y);
        this.layer.batchDraw();
    }

    _toggleScaleHighlights() {
        this._shouldDisplayScaleHighlighting = !this._shouldDisplayScaleHighlighting;
        this._drawScaleHighlights();
    }

    _drawScaleHighlights() {
        this._scaleHighlightsSubContainer.destroyChildren();
        if (this._shouldDisplayScaleHighlighting) {
            const scaleObject = scale(this._scaleType);
            console.log(scaleObject);
            const { notes, tonic } = scaleObject;
            pitchesArray.forEach((noteObj, idx) => {
                if (notes.find((scaleNote) => isSameNote(scaleNote, noteObj.note))) {
                    const isTonic = isSameNote(tonic, noteObj.note);
                    const highlightRect = new Rect({
                        x: 0,
                        y: idx * this._conversionManager.rowHeight,
                        width: this._conversionManager.gridWidth,
                        height: this._conversionManager.rowHeight,
                        fill: isTonic ? 'tomato' : 'pink',
                    });
                    highlightRect.moveTo(this._scaleHighlightsSubContainer);
                }
            });
        }
        this.layer.batchDraw();
    }

    _drawGridLines() {
        const horizontalLinesData = getHorizontalLinesData(this._conversionManager.gridWidth);
        const verticalLinesData = getVerticalLinesData(
            this._conversionManager.numBars, 
            this._conversionManager.barWidth,
            this._conversionManager.colWidth,
            this._conversionManager.gridHeight
        );
        [ ...horizontalLinesData, ...verticalLinesData ]
        .forEach(lineProps => {
            const line = new Line({ ...lineProps });
            line.moveTo(this._gridLinesSubContainer);
        }); 
        this.layer.batchDraw();
    }

    _drawGrid() {
        this._gridContainer.destroyChildren();
        const background = new Rect({
            x: 0,
            y: 0,
            width: this._conversionManager.gridWidth,
            height: this._conversionManager.gridHeight,
            fill: '#dadada'
        });
        background.moveTo(this._gridContainer);
        this._scaleHighlightsSubContainer = new Group();
        this._scaleHighlightsSubContainer.moveTo(this._gridContainer);
        if (this._shouldDisplayScaleHighlighting) {
            this._drawScaleHighlights();
        }
        this._gridLinesSubContainer = new Group();
        this._gridLinesSubContainer.moveTo(this._gridContainer);
        this._drawGridLines();
        this.layer.batchDraw();
    }

    redrawOnZoomAdjustment(isZoomingIn) {
        // At the moment I just completely redraw the grid aspects when zoom changes. If I need to
        // I can do this in a more precise way by simply updating the width of the background and
        // repositioning the horizontal lines. If I implement this I should split it out into a 
        // separate method. 
        this._drawGrid();
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
        // const xDelta = this._conversionManager.roundToGridCol(
        //     terminalX - this._mouseStateManager.x
        // );
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

    draw() {
        this.layer.removeChildren();
        this.layer.add(this._gridContainer);
        this.layer.add(this._notesContainer);
        this._drawGrid();
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
            //this.layer.add(newMarquee); 
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

    addContextMenu(rawX, rawY, xScroll, yScroll, menuItems, shouldIncludeScaleHighlightItem) {
        if (shouldIncludeScaleHighlightItem) {
            menuItems.push({
                label: this._shouldDisplayScaleHighlighting ? 'Hide scale highlighting' : 'Show scale highlighting',
                callback: () => this._toggleScaleHighlights()
            })
        }
        const contextMenuGroup = createContextMenu({
            rawX,
            rawY,
            rightBoundary: this._conversionManager.stageWidth - SCROLLBAR_WIDTH,
            bottomBoundary: this._conversionManager.stageHeight - this._conversionManager.velocityAreaHeight - SCROLLBAR_WIDTH,
            xScroll,
            yScroll,
            accountForScrollDirection: 'both',
            batchDrawCallback: () => this.layer.batchDraw(),
            menuItems
        });
        this.layer.add(contextMenuGroup);
        this.layer.batchDraw();
    }

    removeContextMenu() {
        const contextMenu = this.layer.findOne('#CONTEXT_MENU_GROUP');
        if (contextMenu) {
            contextMenu.destroy();
            this.layer.batchDraw();
        }
    }

    forceToState(state) {
        // delete all note elements currently on the layer
        //const existingNoteElements = this._notesContainer.find('.NOTE');
        //existingNoteElements.forEach(noteElement => noteElement.destroy());
        this._notesContainer.destroyChildren();
        // delete marquee element if exists
        const marqueeElement = this.layer.findOne('#MARQUEE');
        if (marqueeElement) {
            marqueeElement.destroy();
        }
        
        console.log(state.notes);

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