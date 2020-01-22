import Tone from 'tone';
import { Stage, Layer } from 'konva';
import { 
    STAGE_WIDTH, 
    STAGE_HEIGHT,
    DRAG_MODE_ADJUST_NOTE_SIZE,
    DRAG_MODE_ADJUST_NOTE_POSITION,
    DRAG_MODE_ADJUST_SELECTION,
    DRAG_MODE_ADJUST_SELECTION_FROM_VELOCITY_AREA,
    DRAG_MODE_ADJUST_VELOCITY_AREA_HEIGHT,
    VELOCITY_LAYER_HEIGHT,
    SCROLLBAR_WIDTH,
    PIANO_KEY_WIDTH,
    SCROLLBAR_GUTTER
} from '../constants';
import {
    ACTIVE_TOOL_UPDATE,
    UNDO_ACTION,
    REDO_ACTION,
    COPY_TO_CLIPBOARD,
    CUT_TO_CLIPBOARD,
    PASTE_FROM_CLIPBOARD
} from '../events';
import emitter from '../EventEmitter';
import PianoKeyLayer from '../PianoKeyLayer';
import ScrollbarLayer from '../ScrollbarLayer';
import ConversionManager from '../ConversionManager';
import AudioReconciler from '../AudioReconciler';
import NoteSelection from '../NoteSelection';
import KeyboardStateManager from '../KeyboardStateManager';
import MouseStateManager from '../MouseStateManager';
import ScrollManager from '../ScrollManager';
import VelocityLayer from '../VelocityLayer';
import { 
    doesOverlap,
    canShiftUp,
    canShiftDown,
    canShiftLeft,
    canShiftRight,
    easingFns
} from './utils';
import CanvasElementCache from '../CanvasElementCache';
import { genId } from '../genId';
import HistoryStack from '../HistoryStack';
import Clipboard from '../Clipboard';
import { clamp, pipe } from '../utils';
import TransportLayer from '../TransportLayer';
import SeekerLineLayer from '../SeekerLineLayer';
import ContextMenuLayer from '../ContextMenuLayer';
import NoteLayer from '../NoteLayer';
import GridLayer from '../GridLayer';
import { pitchesArray } from '../pitches';
import { chordType } from '@tonaljs/chord-dictionary';

export default class PianoRoll {

    constructor(containerId, width = STAGE_WIDTH, height = STAGE_HEIGHT, initialQuantize = '16n', initialNoteDuration = '16n', numBars = 8) {
        
        // Initialize class properties
        window.pianoRoll = this;
        this._dragMode = null;
        this._activeTool = 'cursor';
        this._previousBumpTimestamp = null;
        this._chordType = 'major';

        // Initialize canvas stage
        this._stage = new Stage({
            container: containerId,
            width,
            height
        });

        // Initialize non canvas layer related classes
        this._noteCache = new CanvasElementCache();
        this._velocityMarkerCache = new CanvasElementCache();
        this._keyboardStateManager = new KeyboardStateManager(this._stage.container());
        this._mouseStateManager = new MouseStateManager();
        this._conversionManager = new ConversionManager(
            width, 
            height,
            initialQuantize,
            initialNoteDuration,
            numBars
        );
        this._audioReconciler = new AudioReconciler(this._conversionManager);
        this._noteSelection = new NoteSelection();
        this._historyStack = new HistoryStack({ notes: [], selectedNoteIds: [] });
        this._clipboard = new Clipboard(this._conversionManager);

        // Initialize canvas layer related classes
        this._primaryBackingLayer = new Layer();
        this._secondaryBackingLayer = new Layer();
        this._gridLayer = new GridLayer(this._conversionManager, this._primaryBackingLayer);
        this._noteLayer = new NoteLayer(this._conversionManager, this._primaryBackingLayer);
        this._velocityLayer = new VelocityLayer(this._conversionManager, this._primaryBackingLayer);
        this._transportLayer = new TransportLayer(this._conversionManager, this._primaryBackingLayer);
        this._seekerLineLayer = new SeekerLineLayer(this._conversionManager);
        this._pianoKeyLayer = new PianoKeyLayer(this._secondaryBackingLayer);
        this._contextMenuLayer = new ContextMenuLayer(this._conversionManager, this._secondaryBackingLayer);
        this._scrollManager = new ScrollManager(
            this._gridLayer,
            this._noteLayer,
            this._velocityLayer,
            this._pianoKeyLayer,
            this._transportLayer,
            this._seekerLineLayer
        );
        this._scrollbarLayer = new ScrollbarLayer(
            this._scrollManager,
            this._conversionManager,
            this._secondaryBackingLayer
        );

        // add stage event listeners
        this._stage.on('mousedown', e => this._handleInteractionStart(e));
        this._stage.on('mousemove', e => this._handleInteractionUpdate(e));
        this._stage.on('mouseup', e => this._handleInteractionEnd(e));
        this._stage.on('touchstart', e => this._handleInteractionStart(e));
        this._stage.on('touchmove', e => this._handleInteractionUpdate(e));
        this._stage.on('touchend', e => this._handleInteractionEnd(e));
        this._stage.on('contextmenu', e => this._handleContextMenu(e));

        // Add keyboard event listeners
        this._keyboardStateManager.addKeyListener('Delete', () => this._deleteSelectedNotes());
        this._keyboardStateManager.addKeyListener('1', () => {
            if (this._keyboardStateManager.altKey) {
                emitter.broadcast(ACTIVE_TOOL_UPDATE, 'cursor');
            }
        });
        this._keyboardStateManager.addKeyListener('2', () => {
            if (this._keyboardStateManager.altKey) {
                emitter.broadcast(ACTIVE_TOOL_UPDATE, 'pencil');
            }
        });
        this._keyboardStateManager.addKeyListener('3', () => {
            if (this._keyboardStateManager.altKey) {
                emitter.broadcast(ACTIVE_TOOL_UPDATE, 'marquee');
            }
        });
        this._keyboardStateManager.addKeyListener('ArrowUp', () => {
            if (this._keyboardStateManager.altKey) {
                this._moveUpwardsThroughInversions();
            } else {
                this._shiftSelectionUp(
                    this._keyboardStateManager.shiftKey
                );
            }
        });
        this._keyboardStateManager.addKeyListener('ArrowDown', () => {
            if (this._keyboardStateManager.altKey) {
                this._moveDownwardsThroughInversions();
            } else {
                this._shiftSelectionDown(
                    this._keyboardStateManager.shiftKey
                );
            }
        });
        this._keyboardStateManager.addKeyListener('ArrowLeft', () => this._shiftSelectionLeft());
        this._keyboardStateManager.addKeyListener('ArrowRight', () => this._shiftSelectionRight());
        this._keyboardStateManager.addKeyListener('z', () => this._keyboardStateManager.ctrlKey && this._undo());
        this._keyboardStateManager.addKeyListener('y', () => this._keyboardStateManager.ctrlKey && this._redo());
        this._keyboardStateManager.addKeyListener('x', () => this._keyboardStateManager.ctrlKey && this._cut());
        this._keyboardStateManager.addKeyListener('c', () => this._keyboardStateManager.ctrlKey && this._copy());
        this._keyboardStateManager.addKeyListener('v', () => this._keyboardStateManager.ctrlKey && this._paste());
        this._keyboardStateManager.addKeyListener('i', () => {
            this._keyboardStateManager.altKey && this._handleZoomAdjustment(true);
        });
        this._keyboardStateManager.addKeyListener('o', () => {
            this._keyboardStateManager.altKey && this._handleZoomAdjustment(false);
        });
        this._keyboardStateManager.addKeyListener('m', () => {
            this._scrollManager.x = this._scrollManager.x - 100;
        });

        // Subscribe to global events
        emitter.subscribe(ACTIVE_TOOL_UPDATE, tool => {
            this._activeTool = tool;
            console.log(this._activeTool);
        });
        emitter.subscribe(UNDO_ACTION, () => this._undo());
        emitter.subscribe(REDO_ACTION, () => this._redo());
        emitter.subscribe(COPY_TO_CLIPBOARD, () => this._copy());
        emitter.subscribe(CUT_TO_CLIPBOARD, () => this._cut());
        emitter.subscribe(PASTE_FROM_CLIPBOARD, () => this._paste());
        
        window.addEventListener('resize', e => this._handleResize(e));

        
    }

    init() {
        this._stage.add(this._primaryBackingLayer);
        this._stage.add(this._seekerLineLayer.layer);
        this._stage.add(this._secondaryBackingLayer);
        this._gridLayer.draw();
        this._noteLayer.draw();
        this._velocityLayer.draw();
        this._transportLayer.draw();
        this._pianoKeyLayer.draw();
        this._scrollbarLayer.draw();
        this._seekerLineLayer.draw();
    }

    _handleZoomAdjustment(isZoomingIn) {
        const zoomLevels = [0.125, 0.25, 0.5, 1];
        const currentZoomIdx = zoomLevels.indexOf(this._conversionManager.tickToPxRatio);
        const newZoomIdx = clamp(
            isZoomingIn ? currentZoomIdx + 1 : currentZoomIdx - 1,
            0,
            zoomLevels.length - 1
        );
        if (currentZoomIdx !== newZoomIdx) {
            const newZoomLevel = zoomLevels[newZoomIdx];
            this._conversionManager.tickToPxRatio = newZoomLevel;
            this._gridLayer.redrawOnZoomAdjustment();
            this._noteLayer.redrawOnZoomAdjustment(isZoomingIn);
            this._velocityLayer.redrawOnZoomAdjustment(isZoomingIn);
            this._transportLayer.redrawOnZoomAdjustment();
        }
    }

    _handleResize(e) {
        // grab clientWidth and clientHeight from event

        // if clientWidth not equals stageWidth
            // update stage width
            // if new clientWidth would expose stage OOB
                // adjust x scroll accordingly
            // call method to update scrollbar layer horizontally
        // if clientHeight not equals stageHeight
            // update stage height
            // if new clientHeight would expose stage OOB
                // adjust y scroll accordingly
            // call method to update scrollbar layer vertically
        const window = e.target;
        const { clientWidth, clientHeight } = window.document.documentElement;

        if (clientWidth !== this._conversionManager.stageWidth) {
            this._conversionManager.stageWidth = clientWidth;
            this._stage.width(clientWidth);
            const willExposeOutOfBounds = this._scrollManager.x * -1 > this._conversionManager.gridWidth + SCROLLBAR_WIDTH - clientWidth;
            if (willExposeOutOfBounds) {
                const newXScroll = (-1 * (this._scrollbarLayer.horizontalScrollRange)) + PIANO_KEY_WIDTH;
                this._scrollManager.x = newXScroll;
            }
            
        }
        if (clientHeight - 50 !== this._conversionManager.stageHeight) {
            this._conversionManager.stageHeight = clientHeight - 50;
            this._stage.height(clientHeight - 50);
            const willExposeOutOfBounds = this._scrollManager.y * -1 >= this._scrollbarLayer.verticalScrollRange;
            if (willExposeOutOfBounds) {
                const newYScroll = (-1 * this._scrollbarLayer.verticalScrollRange) + this._conversionManager.seekerAreaHeight;
                this._scrollManager.y = newYScroll;
            }
        }
        this._velocityLayer.redrawOnVerticalResize();
        this._scrollbarLayer.redrawOnHorizontalResize();
        this._scrollbarLayer.redrawOnVerticalResize();
    }

    // Valid values for nudgeDirection are 'BOTH', 'VERTICAL' and 'HORIZONTAL'
    _nudgeGridIfRequired(x, y, nudgeDirection = 'BOTH') {
        const now = Date.now();
        if (now - this._previousBumpTimestamp <= 67) {
            return;
        }
        this._previousBumpTimestamp = now;
        const triggerThreshold = 24;
        
        if (nudgeDirection === 'BOTH' || nudgeDirection === 'HORIZONTAL') {
            const isAtLeftEdge = x < PIANO_KEY_WIDTH + triggerThreshold;
            const isAtRightEdge = this._conversionManager.stageWidth - SCROLLBAR_WIDTH - x < triggerThreshold;
            if (isAtLeftEdge) {
                const scrollLimit = PIANO_KEY_WIDTH;
                this._scrollManager.x = Math.min(scrollLimit, this._scrollManager.x + 100);
                this._scrollbarLayer.syncHorizontalThumbToScrollPosition();
            } else if (isAtRightEdge) {
                const scrollLimit = -1 * (this._conversionManager.gridWidth - this._conversionManager.stageWidth + SCROLLBAR_WIDTH);
                this._scrollManager.x = Math.max(scrollLimit, this._scrollManager.x - 100);
                this._scrollbarLayer.syncHorizontalThumbToScrollPosition();
            }
        }

        if (nudgeDirection === 'BOTH' || nudgeDirection === 'VERTICAL') {
            const isAtTopEdge = y < this._conversionManager.seekerAreaHeight + triggerThreshold;
            const isAtBottomEdge = this._conversionManager.stageHeight - SCROLLBAR_WIDTH - this._conversionManager.velocityAreaHeight - y < triggerThreshold;
            if (isAtTopEdge) {
                const scrollLimit = this._conversionManager.seekerAreaHeight;
                this._scrollManager.y = Math.min(scrollLimit, this._scrollManager.y + 100);
                this._scrollbarLayer.syncVerticalThumbToScrollPosition();
            } else if (isAtBottomEdge) {
                const scrollLimit = -1 * (
                    this._conversionManager.gridHeight - this._conversionManager.stageHeight + 
                    SCROLLBAR_WIDTH + this._conversionManager.velocityAreaHeight
                );
                this._scrollManager.y = Math.max(scrollLimit, this._scrollManager.y - 100);
                this._scrollbarLayer.syncVerticalThumbToScrollPosition();
            }
        }
    }

    _serializeState() {
        // grab all of the noteElements
        // grab all of the velocityMarkerElements
        // for each pair of noteElement & velocityMarkerElement, produce a plain object
        // representing that note. 
        // grab the ids of all selected notes. 
        // use all of this information to produce the complete serialized state. Return it. 

        const serializedNotes = this._noteCache.retrieveAll().map(noteElement => {
            const velocityMarkerElement = this._velocityMarkerCache.retrieveOne(
                noteElement.attrs.id
            );
            return {
                note: this._conversionManager.derivePitchFromY(noteElement.attrs.y),
                time: this._conversionManager.convertPxToTicks(noteElement.attrs.x),
                duration: this._conversionManager.convertPxToTicks(noteElement.attrs.width),
                velocity: velocityMarkerElement.attrs.velocity,
                id: noteElement.attrs.id
            }
        });
        
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const serializedState = {
            notes: serializedNotes,
            selectedNoteIds
        };
        
        this._historyStack.addEntry(serializedState);
    }

    _forceToState(state) {
        const noteElements = this._noteLayer.forceToState(state);
        const velocityMarkerElements = this._velocityLayer.forceToState(state);
        this._noteCache.forceToState(noteElements);
        this._velocityMarkerCache.forceToState(velocityMarkerElements);
        this._noteSelection.forceToState(state.selectedNoteIds);
        this._audioReconciler.forceToState(state.notes);
    }

    _addNoteToAudioEngine(noteId) {
        const noteElement = this._noteCache.retrieveOne(noteId);
        const velocityMarkerElement = this._velocityMarkerCache.retrieveOne(noteId);
        console.log(noteElement, velocityMarkerElement);
        this._audioReconciler.addNote(noteElement, velocityMarkerElement);
    }

    _addNewNote(x, y, width) {
        const id = genId();
        const newNote = this._noteLayer.addNewNote(x, y, id, width);
        const newVelocityMarker = this._velocityLayer.addNewVelocityMarker(x, id);
        this._noteCache.add(newNote);
        this._velocityMarkerCache.add(newVelocityMarker);
        this._noteSelection.add(newNote);
    }    

    _deleteSelectedNotes() {
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this._velocityMarkerCache.retrieve(selectedNoteIds);
        this._noteLayer.deleteNotes(selectedNoteElements);
        this._velocityLayer.deleteVelocityMarkers(selectedVelocityMarkerElements);
        this._noteSelection.clear();
        selectedNoteElements.forEach(el => this._noteCache.remove(el));
        selectedVelocityMarkerElements.forEach(el => this._velocityMarkerCache.remove(el));
        this._audioReconciler.removeNotes(selectedNoteIds);
        this._serializeState();
    }

    _clearSelection() {
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this._velocityMarkerCache.retrieve(selectedNoteIds);
        selectedNoteElements.forEach(el => this._noteLayer.removeSelectedAppearance(el));
        selectedVelocityMarkerElements.forEach(el => this._velocityLayer.removeSelectedAppearance(el));
        this._noteSelection.clear();
    }

    _addNoteToSelection(noteElement) {
        this._noteSelection.add(noteElement);
        const velocityMarkerElement = this._velocityMarkerCache.retrieveOne(noteElement.attrs.id);
        this._noteLayer.addSelectedAppearance(noteElement);
        this._velocityLayer.addSelectedAppearance(velocityMarkerElement);
    }

    _removeNoteFromSelection(noteElement) {
        this._noteSelection.remove(noteElement);
        const velocityMarkerElement = this._velocityMarkerCache.retrieveOne(noteElement.attrs.id);
        this._noteLayer.removeSelectedAppearance(noteElement);
        this._velocityLayer.removeSelectedAppearance(velocityMarkerElement);
    }

    _reconcileNoteSelectionWithSelectionArea(selectionX1, selectionY1, selectionX2, selectionY2) {
        const allNotes = this._noteCache.retrieveAll();

        allNotes.forEach(noteRect => {
            const { x, y, width, height } = noteRect.attrs;
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
            const isSelected = this._noteSelection.has(noteRect);
            if (overlapsWithSelection && !isSelected) {
                    this._addNoteToSelection(noteRect);
            } else if (!overlapsWithSelection && isSelected) {
                this._removeNoteFromSelection(noteRect);
            }
        });
    }

    _shiftSelectionUp(shiftByOctave) {
        const shiftAmount = shiftByOctave ? 
            this._conversionManager.rowHeight * 12 : 
            this._conversionManager.rowHeight;
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        if (canShiftUp(selectedNoteElements, shiftAmount)) {
            this._noteLayer.shiftNotesUp(selectedNoteElements, shiftAmount);
            selectedNoteIds.forEach(id => this._addNoteToAudioEngine(id));
            this._serializeState();
        }
    }

    _shiftSelectionDown(shiftByOctave) {
        const shiftAmount = shiftByOctave ?
            this._conversionManager.rowHeight * 12 :
            this._conversionManager.rowHeight;
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        if (canShiftDown(selectedNoteElements, this._conversionManager.gridHeight, shiftAmount)) {
            this._noteLayer.shiftNotesDown(selectedNoteElements, shiftAmount);
            selectedNoteIds.forEach(id => this._addNoteToAudioEngine(id));
            this._serializeState();
        }
    }

    _shiftSelectionLeft() {
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this._velocityMarkerCache.retrieve(
            selectedNoteIds
        );
        if (canShiftLeft(selectedNoteElements)) {
            this._noteLayer.shiftNotesLeft(selectedNoteElements);
            this._velocityLayer.shiftVelocityMarkersLeft(selectedVelocityMarkerElements);
            selectedNoteIds.forEach(id => this._addNoteToAudioEngine(id));
            this._serializeState();
        }
    }

    _shiftSelectionRight() {
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this._velocityMarkerCache.retrieve(
            selectedNoteIds
        );
        if (canShiftRight(selectedNoteElements, this._conversionManager.gridWidth)) {
            this._noteLayer.shiftNotesRight(selectedNoteElements);
            this._velocityLayer.shiftVelocityMarkersRight(selectedVelocityMarkerElements);
            selectedNoteIds.forEach(id => this._addNoteToAudioEngine(id));
            this._serializeState();
        }
    }

    _moveUpwardsThroughInversions() {
        const noteElements = this._noteCache.retrieve(
            this._noteSelection.retrieveAll()
        );

        const sortedNotesAndRowIndexes = noteElements.map(noteElement => {
            return {
                noteElement,
                rowIndex: Math.floor(noteElement.y() / this._conversionManager.rowHeight)
            }
        })
        .sort((a,b) => {
            if (a.rowIndex < b.rowIndex) {
                return 1;
            } else if (a.rowIndex > b.rowIndex) {
                return -1;
            } else {
                return 0;
            }
        });

        const noteElementToUpdate = sortedNotesAndRowIndexes[0].noteElement;
        let newY = null;

        for (let currNote of sortedNotesAndRowIndexes) {
            const isTaken = sortedNotesAndRowIndexes.find(el => el.rowIndex === currNote.rowIndex - 12);
            if (currNote.rowIndex >= 12 && !isTaken) {
                newY = (currNote.rowIndex - 12) * this._conversionManager.rowHeight;
                break;
            }
        }
        
        if (newY === null) {
            return;
        }

        noteElementToUpdate.y(newY);
        this._primaryBackingLayer.batchDraw();
        this._noteLayer.updateNotesAttributeCaches([ noteElementToUpdate ]);
        this._addNoteToAudioEngine(noteElementToUpdate.id());
        this._serializeState();
    }

    _moveDownwardsThroughInversions() {
        const noteElements = this._noteCache.retrieve(
            this._noteSelection.retrieveAll()
        );

        const sortedNotesAndRowIndexes = noteElements.map(noteElement => {
            return {
                noteElement,
                rowIndex: Math.floor(noteElement.y() / this._conversionManager.rowHeight)
            }
        })
        .sort((a,b) => {
            if (a.rowIndex < b.rowIndex) {
                return -1;
            } else if (a.rowIndex > b.rowIndex) {
                return 1;
            } else {
                return 0;
            }
        });

        const noteElementToUpdate = sortedNotesAndRowIndexes[0].noteElement;
        let newY = null;

        for (let currNote of sortedNotesAndRowIndexes) {
            const isTaken = sortedNotesAndRowIndexes.find(el => el.rowIndex === currNote.rowIndex + 12);
            if (currNote.rowIndex + 12 < pitchesArray.length && !isTaken) {
                newY = (currNote.rowIndex + 12) * this._conversionManager.rowHeight;
                break;
            }
        }
        
        if (newY === null) {
            return;
        }

        noteElementToUpdate.y(newY);
        this._primaryBackingLayer.batchDraw();
        this._noteLayer.updateNotesAttributeCaches([ noteElementToUpdate ]);
        this._addNoteToAudioEngine(noteElementToUpdate.id());
        this._serializeState();
    }

    _constructChordFromRoot() {
        const { chroma } = chordType(this._chordType);
        let relativePositions = [];
        chroma.split('').forEach((binary, idx) => {
            if (parseInt(binary) && idx > 0) {
                relativePositions.push(idx);
            }
        });
        const rootNote = this._noteCache.retrieve(
            this._noteSelection.retrieveAll()
        )[0];

        if (!rootNote) {
            return;
        }

        const rootX = rootNote.x();
        const rootY = rootNote.y();
        const rootWidth = rootNote.width();

        relativePositions.forEach(relPos => {
            this._addNewNote(
                rootX,
                rootY - relPos * this._conversionManager.rowHeight,
                rootWidth
            );
        });

        this._noteSelection.retrieveAll().forEach(id => this._addNoteToAudioEngine(id));

        this._serializeState();

    }

    _undo() {
        if (!this._historyStack.isAtStart) {
            const nextState = this._historyStack.goBackwards();
            this._forceToState(nextState);
        }
    }

    _redo() {
        if (!this._historyStack.isAtEnd) {
            const nextState = this._historyStack.goForwards();
            this._forceToState(nextState);
        }
    }

    _copy() {
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this._velocityMarkerCache.retrieve(selectedNoteIds);
        this._clipboard.add(selectedNoteElements, selectedVelocityMarkerElements);
    }

    _cut() {
        this._copy();
        this._deleteSelectedNotes();
    }

    _paste() {
        const currentQuantizeAsTicks = this._conversionManager.convertPxToTicks(
            this._conversionManager.colWidth
        );
        const roundedStartTime = this._conversionManager.round(
            Tone.Transport.ticks,
            currentQuantizeAsTicks
        );
        const newNoteData = this._clipboard.produceCopy(roundedStartTime);
        this._clearSelection();
        newNoteData.forEach(noteObject => {
            const noteElement = this._noteLayer._createNoteElement(
                this._conversionManager.convertTicksToPx(noteObject.time),
                this._conversionManager.deriveYFromPitch(noteObject.note),
                this._conversionManager.convertTicksToPx(noteObject.duration),
                noteObject.id,
                true
            );
            this._noteLayer.moveNoteToNotesContainer(noteElement);
            this._noteCache.add(noteElement);
            const velocityMarkerHeight = noteObject.velocity * (this._conversionManager.velocityAreaHeight - 10);
            const velocityMarkerElement = this._velocityLayer._createVelocityMarker(
                this._conversionManager.convertTicksToPx(noteObject.time),
                this._conversionManager.stageHeight - SCROLLBAR_WIDTH - velocityMarkerHeight,
                velocityMarkerHeight,
                noteObject.id,
                true,
                noteObject.velocity
            );
            this._velocityMarkerCache.add(velocityMarkerElement);
            this._audioReconciler.addNote(noteElement, velocityMarkerElement);
            this._noteSelection.add(noteElement);
        });
        //this._noteLayer.layer.batchDraw();
        this._velocityLayer.layer.batchDraw();
        this._serializeState();
    }

    _handleContextMenu(e) {
        const { rawX, rawY, target } = this._extractInfoFromEventObject(e);
        e.evt.preventDefault();
        const isVelocityAreaClick = this._conversionManager.stageHeight - rawY <= this._conversionManager.velocityAreaHeight + SCROLLBAR_WIDTH;
        const targetIsNote = target.name() === 'NOTE';
        if (isVelocityAreaClick) {
            this._addVelocityContextMenu(rawX, rawY);
        } else if (targetIsNote) {
            this._addNoteContextMenu(rawX, rawY);
        } else {
            this._addGridContextMenu(rawX, rawY);
        }
    }

    _addVelocityContextMenu(rawX, rawY) {
        const menuItems = [
            { 
                label: 'Humanize',
                callback: () => this._humanizeSelection() 
            },
            { 
                label: 'Transform - linear',
                callback: () => this._transformSelection('linear') 
            },
            { 
                label: 'Transform - ease in',
                callback: () => this._transformSelection('easeIn')
            },
            { 
                label: 'Transform - ease out',
                callback: () => this._transformSelection('easeOut') 
            },
            { 
                label: 'Transform - ease in out',
                callback: () => this._transformSelection('easeInOut') 
            }
        ];
        this._contextMenuLayer.addContextMenu({ rawX, rawY, menuItems });
    }

    _addGridContextMenu(rawX, rawY) {
        const menuItems = [
            {
                label: 'Zoom in',
                callback: () => this._handleZoomAdjustment(true)
            },
            {
                label: 'Zoom out',
                callback: () => this._handleZoomAdjustment(false)
            },
            {
                label: 'Paste',
                callback: () => this._paste()
            },
            {
                label: this._gridLayer._shouldDisplayScaleHighlighting ? 'Hide scale highlighting' : 'Show scale highlighting',
                callback: () => this._gridLayer._toggleScaleHighlights()
            }
        ];
        this._contextMenuLayer.addContextMenu({ rawX, rawY, menuItems });
    }

    _addNoteContextMenu(rawX, rawY) {
        const menuItems = [
            {
                label: 'Cut',
                callback: () => this._cut()
            },
            {
                label: 'Copy',
                callback: () => this._copy()
            },
            {
                label: 'Delete',
                callback: () => this._deleteSelectedNotes()
            },
            {
                label: 'Generate chord',
                callback: () => this._constructChordFromRoot()
            }
        ];
        this._contextMenuLayer.addContextMenu({ rawX, rawY, menuItems });
    }

    _extractInfoFromEventObject(e) {
        const { evt, target } = e;
        const isTouchEvent = Boolean(evt.touches);
        let rawX;
        let rawY;
        if (isTouchEvent) {
            const { clientX, clientY } = evt.touches[0];
            const { top, left } = this._stage.container().getBoundingClientRect();
            rawX = clientX - left;
            rawY = clientY - top;
        } else {
            rawX = evt.offsetX;
            rawY = evt.offsetY;
        }
        return {
            isTouchEvent,
            target,
            rawX, 
            rawY
        }
    }

    _handleInteractionStart(e) {
        this._contextMenuLayer.removeContextMenu();
        if (e.evt.button !== 0) {
            return;
        }
        const { rawX, rawY, isTouchEvent, target } = this._extractInfoFromEventObject(e);
        const xWithScroll = rawX - this._scrollManager.x;
        const yWithScroll = rawY - this._scrollManager.y;
        const roundedX = this._conversionManager.roundDownToGridCol(xWithScroll);
        const roundedY = this._conversionManager.roundDownToGridRow(yWithScroll);

        const isVelocityAreaClick = this._conversionManager.stageHeight - rawY <= this._conversionManager.velocityAreaHeight + SCROLLBAR_WIDTH;
        const isTransportAreaClick = rawY <= 30;
        this._mouseStateManager.addMouseDownEvent(xWithScroll, yWithScroll);

        if (isTransportAreaClick) {
            const positionAsTicks = this._conversionManager.convertPxToTicks(roundedX);
            const positionAsBBS = Tone.Ticks(positionAsTicks).toBarsBeatsSixteenths();
            Tone.Transport.position = positionAsBBS;
            this._seekerLineLayer.updateSeekerLinePosition();
            return;
        }

        if (this._activeTool === 'marquee') {
            if (isVelocityAreaClick) {
                this._mouseStateManager.addMouseDownEvent(xWithScroll, rawY);
                this._dragMode = DRAG_MODE_ADJUST_SELECTION_FROM_VELOCITY_AREA;
            } else {
                this._dragMode = DRAG_MODE_ADJUST_SELECTION;
            }
        } else if (this._activeTool === 'pencil') {
            if (isVelocityAreaClick) {
                this._handleVelocityAreaPencilInteraction(roundedX, rawY);
            } else {
                this._dragMode = DRAG_MODE_ADJUST_NOTE_SIZE;
                this._clearSelection();
                this._addNewNote(roundedX, roundedY); 
            }
        } else if (this._activeTool === 'cursor') {
            if (isVelocityAreaClick) {
                this._handleVelocityAreaCursorInteraction(roundedX, target);
            } else {
                const targetIsNote = Boolean(target.getAttr('isNoteRect'));
                if (targetIsNote) {
                    this._handleNoteInteractionStart(target, xWithScroll);
                }
            }  
        }

    }

    _handleNoteInteractionStart(noteElement, xWithScroll) {
        const { x: rectX, width: rectWidth } = noteElement.attrs;
        const isEdgeClick = rectWidth + rectX - xWithScroll < 10;
        const isSelected = this._noteSelection.has(noteElement);
        if (isEdgeClick) {
            if (!isSelected) {
                this._clearSelection();
                this._addNoteToSelection(noteElement);
            } 
            this._dragMode = DRAG_MODE_ADJUST_NOTE_SIZE;
        } else {
            this._dragMode = DRAG_MODE_ADJUST_NOTE_POSITION;
        }
    }

    _handleVelocityAreaCursorInteraction(roundedX, target) {
        // Test if the target is the border, and if so enter height change drag mode. 
        if (target.id() === 'VELOCITY_BORDER') {
            this._dragMode = DRAG_MODE_ADJUST_VELOCITY_AREA_HEIGHT;
            return;
        }
        // If not, select / deselect notes based on the current selection state, click location and
        // shift key state.
        const allNoteElements = this._noteCache.retrieveAll();
        const matchingNotes = allNoteElements.filter(el => el.x() === roundedX);
        const selectedMatchingNotes = matchingNotes.filter(el => {
            return this._noteSelection.has(el);
        });
        
        if (matchingNotes.length === 0 || !this._keyboardStateManager.shiftKey) {
            // clear selection
            this._clearSelection();
        }

        if (matchingNotes.length !== selectedMatchingNotes.length) {
            matchingNotes.forEach(noteElement => this._addNoteToSelection(noteElement));
        } else {
            matchingNotes.forEach(noteElement => this._removeNoteFromSelection(noteElement));
        }
    }

    _handleVelocityAreaPencilInteraction(roundedX, rawY) {
        // Calculate the new velocity
        const pxFromBottom = Math.min(
            this._conversionManager.stageHeight - rawY - SCROLLBAR_WIDTH,
            this._conversionManager.velocityAreaHeight - 10
        );
        const velocityValue = pxFromBottom / (this._conversionManager.velocityAreaHeight - 10);
        // Determine which notes should be updated based on the click location, the current selection
        // state and the shift key state.
        const allVelocityMarkers = this._velocityMarkerCache.retrieveAll();
        const matchingMarkers = allVelocityMarkers.filter(el => el.x() === roundedX);
        const selectedMarkers = allVelocityMarkers.filter(el => this._noteSelection.has(el));
        const selectedMatchingMarkers = matchingMarkers.filter(el => {
            return this._noteSelection.has(el);
        });
        const shiftKeyIsPressed = this._keyboardStateManager.shiftKey;
        let velocityMarkersToUpdate;
        if (matchingMarkers.length === 0) {
            return;
        } else if (selectedMatchingMarkers.length === 0) {
            velocityMarkersToUpdate = matchingMarkers;
        } else {
            velocityMarkersToUpdate = shiftKeyIsPressed ? selectedMarkers : selectedMatchingMarkers;
        }
        // Once the relevant notes have been found, iterate over them and update each of them. 
        this._velocityLayer.updateVelocityMarkersHeight(velocityMarkersToUpdate, velocityValue);
        velocityMarkersToUpdate.forEach(velocityRect => {
            const id = velocityRect.getAttr('id');
            this._addNoteToAudioEngine(id);
        });
        this._serializeState();
    }

    _humanizeNoteVelocities(velocityMarkerElements, range = 0.1) {
        velocityMarkerElements.forEach(velocityElement => {
            const { velocity, id } = velocityElement.attrs;
            // Ensure the the velocity value that we randomize is at least `range` distance
            // from the highest legal value (1) and the lowest legal value (0).
            const safeVelocityValue = clamp(
                velocity,
                range,
                1 - range
            );
            const newVelocityValue = safeVelocityValue + (Math.random() * range * 2) - range;
            this._velocityLayer.updateVelocityMarkersHeight([ velocityElement ], newVelocityValue);
            this._addNoteToAudioEngine(id);
        });
        this._serializeState();
    }

    _humanizeSelection() {
        const allVelocityMarkers = this._velocityMarkerCache.retrieveAll();
        const selectedMarkers = allVelocityMarkers.filter(el => this._noteSelection.has(el));
        this._humanizeNoteVelocities(selectedMarkers, 0.1);
    }

    _transformSelection(easing = 'linear') {
        const allVelocityMarkers = this._velocityMarkerCache.retrieveAll();
        const selectedMarkers = allVelocityMarkers.filter(el => this._noteSelection.has(el));
        this._transformNoteVelocities(selectedMarkers, easing);
    }

    _transformNoteVelocities(velocityMarkerElements, easingFnName) {
        
        let originX;
        let terminalX;
        let originVelocity;
        let terminalVelocity;

        velocityMarkerElements.forEach(el => {
            if (originX === undefined || el.attrs.x < originX) {
                originX = el.attrs.x;
                originVelocity = el.attrs.velocity;
            }
            if (terminalX === undefined || el.attrs.x > terminalX) {
                terminalX = el.attrs.x;
                terminalVelocity = el.attrs.velocity;
            }
        });
        const xDelta = Math.abs(originX - terminalX);
        const velocityDelta = terminalVelocity - originVelocity;

        const getPosInRange = x => (x - originX) / xDelta;
        const adjustForFnRange = x => x * velocityDelta + originVelocity;

        const easingFn = easingFns[easingFnName] || easingFns.linear;

        const transformFn = pipe(
            getPosInRange,
            easingFn,
            adjustForFnRange
        );

        velocityMarkerElements.forEach(velocityElement => {
            const { x, id } = velocityElement.attrs;
            const newVelocityValue = transformFn(x);
            this._velocityLayer.updateVelocityMarkersHeight([ velocityElement ], newVelocityValue);
            this._addNoteToAudioEngine(id);
        });
        this._serializeState();
    }

    _handleInteractionUpdate(e) {
        switch (this._dragMode) {
            case DRAG_MODE_ADJUST_NOTE_SIZE:
                this._handleAdjustNoteSizeInteractionUpdate(e);
                break;
            case DRAG_MODE_ADJUST_NOTE_POSITION:
                this._handleAdjustNotePositionInteractionUpdate(e);
                break;
            case DRAG_MODE_ADJUST_SELECTION:
                this._handleAdjustSelectionInteractionUpdate(e);
                break;
            case DRAG_MODE_ADJUST_SELECTION_FROM_VELOCITY_AREA:
                this._handleAdjustSelectionFromVelocityInteractionUpdate(e);
                break;
            case DRAG_MODE_ADJUST_VELOCITY_AREA_HEIGHT:
                this._handleAdjustVelocityAreaHeightInteractionUpdate(e);
                break;
            default:
                return;
        }
    }

    _handleAdjustNoteSizeInteractionUpdate(e) {
        const { rawX, rawY } = this._extractInfoFromEventObject(e);
        this._nudgeGridIfRequired(rawX, rawY, 'HORIZONTAL');
        const xWithScroll = rawX - this._scrollManager.x;
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        this._noteLayer.updateNoteDurations(
            this._mouseStateManager.x, 
            xWithScroll, 
            selectedNoteElements
        );
    }

    _handleAdjustNotePositionInteractionUpdate(e) {
        const { rawX, rawY } = this._extractInfoFromEventObject(e);
        this._nudgeGridIfRequired(rawX, rawY);
        const xWithScroll = rawX - this._scrollManager.x;
        const yWithScroll = rawY - this._scrollManager.y;
        this._mouseStateManager.updateHasTravelled(xWithScroll, yWithScroll);
        const xDelta = this._conversionManager.roundToGridCol(
            xWithScroll - this._mouseStateManager.x
        );
        const yDelta = this._conversionManager.roundToGridRow(
            yWithScroll - this._mouseStateManager.y
        );
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this._velocityMarkerCache.retrieve(selectedNoteIds);
        this._noteLayer.repositionNotes(xDelta, yDelta, selectedNoteElements);
        this._velocityLayer.repositionVelocityMarkers(xDelta, selectedVelocityMarkerElements);
    }

    _handleAdjustSelectionInteractionUpdate(e) {
        const { rawX, rawY } = this._extractInfoFromEventObject(e);
        this._nudgeGridIfRequired(rawX, rawY);
        const currentX = rawX - this._scrollManager.x;
        const currentY = rawY - this._scrollManager.y;
        const mouseDownX = this._mouseStateManager.x;
        const mouseDownY = this._mouseStateManager.y;
        const selectionX1 = Math.min(mouseDownX, currentX);
        const selectionX2 = Math.max(mouseDownX, currentX);
        const selectionY1 = Math.min(mouseDownY, currentY);
        const selectionY2 = Math.max(mouseDownY, currentY);
        this._noteLayer.updateSelectionMarquee(selectionX1, selectionY1, selectionX2, selectionY2);
        this._reconcileNoteSelectionWithSelectionArea(selectionX1, selectionY1, selectionX2, selectionY2);
    }

    _handleAdjustSelectionFromVelocityInteractionUpdate(e) {
        const { rawX, rawY } = this._extractInfoFromEventObject(e);
        this._nudgeGridIfRequired(rawX, rawY, 'HORIZONTAL');
        const xWithScroll = rawX - this._scrollManager.x;
        const mouseDownX = this._mouseStateManager.x;
        const mouseDownY = this._mouseStateManager.y;
        const topOfVelocityArea = this._conversionManager.stageHeight - this._conversionManager.velocityAreaHeight - SCROLLBAR_WIDTH;
        const bottomofVelocityArea = this._conversionManager.stageHeight - SCROLLBAR_WIDTH;
        const x1 = Math.min(mouseDownX, xWithScroll);
        const x2 = Math.max(mouseDownX, xWithScroll);
        const y1 = Math.max(topOfVelocityArea, Math.min(mouseDownY, rawY) );
        const y2 = Math.min(bottomofVelocityArea, Math.max(mouseDownY, rawY) );
        this._velocityLayer.updateSelectionMarquee(x1, y1, x2, y2);
        this._reconcileNoteSelectionWithSelectionArea(x1, 0, x2, this._conversionManager.gridHeight);
    }

    _handleAdjustVelocityAreaHeightInteractionUpdate(e) {
        const { rawY } = this._extractInfoFromEventObject(e);
        const newHeight = (this._conversionManager.stageHeight - SCROLLBAR_WIDTH) - rawY;
        this._velocityLayer.redrawOnHeightChange(newHeight);
        this._conversionManager.velocityAreaHeight = newHeight;
    }

    _handleInteractionEnd(e) {
        switch (this._dragMode) {
            case DRAG_MODE_ADJUST_NOTE_SIZE:
                this._handleAdjustNoteSizeInteractionEnd(e);
                break;
            case DRAG_MODE_ADJUST_NOTE_POSITION:
                this._handleAdjustNotePositionInteractionEnd(e);
                break;
            case DRAG_MODE_ADJUST_SELECTION:
                this._handleAdjustSelectionInteractionEnd(e);
                break;
            case DRAG_MODE_ADJUST_SELECTION_FROM_VELOCITY_AREA:
                this._handleAdjustSelectionFromVelocityInteractionEnd(e);
                break;
            case DRAG_MODE_ADJUST_VELOCITY_AREA_HEIGHT:
                this._handleAdjustVelocityAreaHeightInteractionEnd(e);
                break;
            default:
                return;
        }
    }

    _handleAdjustNoteSizeInteractionEnd(e) {
        this._dragMode = null;
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this._velocityMarkerCache.retrieve(selectedNoteIds);
        this._noteLayer.updateNotesAttributeCaches(selectedNoteElements);
        this._velocityLayer.updateVelocityMarkersAttributeCaches(selectedVelocityMarkerElements);
        selectedNoteIds.forEach(id => this._addNoteToAudioEngine(id));
        this._serializeState();
    }

    _handleAdjustNotePositionInteractionEnd(e) {
        if (!this._mouseStateManager.hasTravelled) {
            const { target } = e;
            const isCurrentlySelected = this._noteSelection.has(target);
            if (this._keyboardStateManager.shiftKey) {
                if (isCurrentlySelected) {
                    this._removeNoteFromSelection(target);
                } else {
                    this._addNoteToSelection(target);
                }
            } else {
                this._clearSelection();
                if (!isCurrentlySelected) {
                    this._addNoteToSelection(target);
                }
            }
        }
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this._velocityMarkerCache.retrieve(selectedNoteIds);
        this._noteLayer.updateNotesAttributeCaches(selectedNoteElements);
        this._velocityLayer.updateVelocityMarkersAttributeCaches(selectedVelocityMarkerElements);
        selectedNoteIds.forEach(id => this._addNoteToAudioEngine(id));
        this._serializeState();
        this._dragMode = null;
    }

    _handleAdjustSelectionInteractionEnd(e) {
        this._noteLayer.clearSelectionMarquee();
        this._dragMode = null;
    }

    _handleAdjustSelectionFromVelocityInteractionEnd(e) {
        this._velocityLayer.clearSelectionMarquee();
        this._dragMode = null;
    }

    _handleAdjustVelocityAreaHeightInteractionEnd(e) {
        this._dragMode = null;
    }

}
