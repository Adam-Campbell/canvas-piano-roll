import Tone from 'tone';
import { Stage } from 'konva';
import { 
    STAGE_WIDTH, 
    STAGE_HEIGHT,
    DRAG_MODE_ADJUST_NOTE_SIZE,
    DRAG_MODE_ADJUST_NOTE_POSITION,
    DRAG_MODE_ADJUST_SELECTION,
    DRAG_MODE_ADJUST_SELECTION_FROM_VELOCITY_AREA,
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
import GridLayer from '../GridLayer';
import NoteLayer from '../NoteLayer';
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
    canShiftRight
} from './utils';
import CanvasElementCache from '../CanvasElementCache';
import { genId } from '../genId';
import HistoryStack from '../HistoryStack';
import Clipboard from '../Clipboard';

export default class PianoRoll {

    constructor(containerId, width = STAGE_WIDTH, height = STAGE_HEIGHT) {
        window.pianoRoll = this;
        this._dragMode = null;
        this._activeTool = 'cursor';
        this._stage = new Stage({
            container: containerId,
            width,
            height
        });
        this._noteCache = new CanvasElementCache();
        this._velocityMarkerCache = new CanvasElementCache();
        this._keyboardStateManager = new KeyboardStateManager(this._stage.container());
        this._mouseStateManager = new MouseStateManager();
        this._conversionManager = new ConversionManager(
            width, 
            height
        );
        this._audioReconciler = new AudioReconciler(this._conversionManager);
        this._noteSelection = new NoteSelection();
        this._historyStack = new HistoryStack({ notes: [], selectedNoteIds: [] });
        this._clipboard = new Clipboard(this._conversionManager);
        window.historyStack = this._historyStack;
        window.noteCache = this._noteCache;
        window.velocityCache = this._velocityMarkerCache;
        window.noteSelection = this._noteSelection;
        this._gridLayer = new GridLayer(4, '16n');
        this._noteLayer = new NoteLayer(
            this._conversionManager, 
            this._audioReconciler,
            this._mouseStateManager
        );
        this._velocityLayer = new VelocityLayer(this._conversionManager);
        this._pianoKeyLayer = new PianoKeyLayer();
        this._scrollManager = new ScrollManager(
            this._gridLayer,
            this._noteLayer,
            this._velocityLayer,
            this._pianoKeyLayer
        );
        this._scrollbarLayer = new ScrollbarLayer(
            this._scrollManager,
            this._conversionManager
        );
        this._stage.on('mousedown', e => this._handleMouseDown(e));
        this._stage.on('mousemove', e => this.handleMouseMove(e));
        this._stage.on('mouseup', e => this.handleMouseUp(e));
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
        this._keyboardStateManager.addKeyListener('ArrowUp', () => this._shiftSelectionUp());
        this._keyboardStateManager.addKeyListener('ArrowDown', () => this._shiftSelectionDown());
        this._keyboardStateManager.addKeyListener('ArrowLeft', () => this._shiftSelectionLeft());
        this._keyboardStateManager.addKeyListener('ArrowRight', () => this._shiftSelectionRight());
        this._keyboardStateManager.addKeyListener('z', () => this._keyboardStateManager.ctrlKey && this._undo());
        this._keyboardStateManager.addKeyListener('y', () => this._keyboardStateManager.ctrlKey && this._redo());
        this._keyboardStateManager.addKeyListener('x', () => this._keyboardStateManager.ctrlKey && this._cut());
        this._keyboardStateManager.addKeyListener('c', () => this._keyboardStateManager.ctrlKey && this._copy());
        this._keyboardStateManager.addKeyListener('v', () => this._keyboardStateManager.ctrlKey && this._paste());

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
                const newYScroll = -1 * (this._scrollbarLayer.verticalScrollRange);
                this._scrollManager.y = newYScroll;
            }
        }
        this._velocityLayer.redrawOnVerticalResize();
        this._scrollbarLayer.redrawOnHorizontalResize();
        this._scrollbarLayer.redrawOnVerticalResize();
    }

    init() {
        this.addLayer(this._gridLayer);
        this.addLayer(this._noteLayer);
        this.addLayer(this._velocityLayer);
        this.addLayer(this._pianoKeyLayer);
        this.addLayer(this._scrollbarLayer);
        this._gridLayer.draw();
        this._noteLayer.draw();
        this._velocityLayer.draw();
        this._pianoKeyLayer.draw();
        this._scrollbarLayer.draw();
    }

    addNoteToAudioEngine(noteId) {
        const noteElement = this._noteCache.retrieveOne(noteId);
        const velocityMarkerElement = this._velocityMarkerCache.retrieveOne(noteId);
        console.log(noteElement, velocityMarkerElement);
        this._audioReconciler.addNote(noteElement, velocityMarkerElement);
    }

    addLayer(layerClass) {
        this._stage.add(layerClass.layer);
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
            if (overlapsWithSelection) {
                this._addNoteToSelection(noteRect);
            } else {
                this._removeNoteFromSelection(noteRect);
            }
        });
    }

    _addNewNote(x, y) {
        const id = genId();
        const newNote = this._noteLayer.addNewNote(x, y, id);
        const newVelocityMarker = this._velocityLayer.addNewVelocityMarker(x, id);
        this._noteCache.add(newNote);
        this._velocityMarkerCache.add(newVelocityMarker);
        this._noteSelection.add(newNote);
    }

    _shiftSelectionUp() {
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        if (canShiftUp(selectedNoteElements)) {
            this._noteLayer.shiftNotesUp(selectedNoteElements);
            selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
            this._serializeState();
        }
    }

    _shiftSelectionDown() {
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        if (canShiftDown(selectedNoteElements, this._conversionManager.gridHeight)) {
            this._noteLayer.shiftNotesDown(selectedNoteElements);
            selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
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
            selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
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
            selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
            this._serializeState();
        }
    }

    _handleVelocityMarkerAreaMouseDown(offsetY, roundedX) {
        const pxFromBottom = Math.min(
            this._conversionManager.stageHeight - offsetY - SCROLLBAR_WIDTH,
            50
        );
        const velocityValue = pxFromBottom / 50;
        const allVelocityMarkers = this._velocityMarkerCache.retrieveAll();
        const matchingMarkers = allVelocityMarkers.filter(el => el.x() === roundedX);
        const selectedMatchingMarkers = matchingMarkers.filter(el => {
            return this._noteSelection.has(el);
        });
        let velocityMarkersToUpdate;
        if (matchingMarkers.length === 0) {
            return;
        } else if (selectedMatchingMarkers.length === 0) {
            velocityMarkersToUpdate = matchingMarkers;
        } else {
            velocityMarkersToUpdate = selectedMatchingMarkers;
        }
        this._velocityLayer.updateVelocityMarkersHeight(velocityMarkersToUpdate, pxFromBottom);
        velocityMarkersToUpdate.forEach(velocityRect => {
            const id = velocityRect.getAttr('id');
            //this._audioReconciler.updateNoteVelocity(id, velocityValue);
            this.addNoteToAudioEngine(id);
            this._serializeState();
        });
    }

    _handleNoteMouseDown(noteElement, evtX) {
        const { x: rectX, width: rectWidth } = noteElement.attrs;
        const isEdgeClick = rectWidth + rectX - evtX < 10;
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
                velocity: velocityMarkerElement.attrs.height / 50,
                id: noteElement.attrs.id
            }
        });
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const serializedState = {
            notes: serializedNotes,
            selectedNoteIds
        };
        //console.log(serializedState);
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
            this._noteLayer.layer.add(noteElement);
            this._noteCache.add(noteElement);
            const velocityMarkerElement = this._velocityLayer._createVelocityMarker(
                this._conversionManager.convertTicksToPx(noteObject.time),
                this._conversionManager.stageHeight - SCROLLBAR_WIDTH - (noteObject.velocity * 50),
                noteObject.velocity * 50,
                noteObject.id,
                true
            );
            this._velocityMarkerCache.add(velocityMarkerElement);
            this._audioReconciler.addNote(noteElement, velocityMarkerElement);
            this._noteSelection.add(noteElement);
        });
        this._noteLayer.layer.batchDraw();
        this._velocityLayer.layer.batchDraw();
        this._serializeState();
    }


    /******************
     Mouse down logic
    *******************/
    _handleMouseDown(e) {
        const { evt, target } = e;
        const { offsetX, offsetY } = evt;
        const evtX = offsetX - this._scrollManager.x;
        const evtY = offsetY - this._scrollManager.y;
        const roundedX = this._conversionManager.roundDownToGridCol(evtX);
        const roundedY = this._conversionManager.roundDownToGridRow(evtY);

        const isVelocityLayerClick = this._conversionManager.stageHeight - offsetY <= VELOCITY_LAYER_HEIGHT + SCROLLBAR_WIDTH;
        this._mouseStateManager.addMouseDownEvent(evtX, evtY);
        //this._mouseStateManager.addMouseDownEvent(evtX, evtY);
        
        // If marquee tool is active, a mousedown will always result in a transition to the
        // selection mode
        if (this._activeTool === 'marquee') {
            // As a future enhancement, I would like a velocity layer interaction whilst the marquee tool
            // is active to result in selecting all of the notes that fit within the horizontal space
            // covered by the interaction, regardless of vertical space (so as if the top vertical edge
            // was the top of the note grid and the bottom vertical edge was the bottom of note grid).
            if (isVelocityLayerClick) {
                //const topOfVelocityLayer = this._conversionManager.stageHeight - VELOCITY_LAYER_HEIGHT - SCROLLBAR_WIDTH;
                //const yRelativeToVelocityLayer = offsetY - topOfVelocityLayer;
                this._mouseStateManager.addMouseDownEvent(evtX, offsetY);
                this._dragMode = DRAG_MODE_ADJUST_SELECTION_FROM_VELOCITY_AREA;
            } else {
                this._dragMode = DRAG_MODE_ADJUST_SELECTION;
            }
            // else if pencil tool is active, a mousedown will always result in a transition to the
            // adjust note size drag mode
        } else if (this._activeTool === 'pencil') {
            if (isVelocityLayerClick) {
                this._handleVelocityMarkerAreaMouseDown(offsetY, roundedX);
            } else {
                this._dragMode = DRAG_MODE_ADJUST_NOTE_SIZE;
                this._clearSelection();
                this._addNewNote(roundedX, roundedY);
            }
            // else if cursor tool is active, a mousedown can result in transitioning to the adjust
            // note size state, adjust note position state, or no transtition at all, depending on the
            // events target and location.
        } else if (this._activeTool === 'cursor') {
            if (isVelocityLayerClick) {
                this._handleVelocityMarkerAreaMouseDown(offsetY, roundedX);
                return;
            } else {
                const targetIsNote = Boolean(target.getAttr('isNoteRect'));
                if (targetIsNote) {
                    this._handleNoteMouseDown(target, evtX);
                }
            }   
        }
    }






    /*****************
     Mouse move logic
    ******************/
    handleMouseMove(e) {
        switch (this._dragMode) {
            case DRAG_MODE_ADJUST_NOTE_SIZE:
                this.handleAdjustNoteSizeMouseMove(e);
                break;
            case DRAG_MODE_ADJUST_NOTE_POSITION:
                this.handleAdjustNotePositionMouseMove(e);
                break;
            case DRAG_MODE_ADJUST_SELECTION:
                this.handleAdjustSelectionMouseMove(e);
                break;
            case DRAG_MODE_ADJUST_SELECTION_FROM_VELOCITY_AREA:
                this.handleAdjustSelectionFromVelocityMouseMove(e);
                break;
            default:
                return;
        }
    }

    handleAdjustNoteSizeMouseMove(e) {
        const { offsetX } = e.evt;
        const x = offsetX - this._gridLayer.layer.x();
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        this._noteLayer.updateNoteDurations(x, selectedNoteElements);
    }

    handleAdjustNotePositionMouseMove(e) {
        const { offsetX, offsetY } = e.evt;
        const x = offsetX - this._gridLayer.layer.x();
        const y = offsetY - this._gridLayer.layer.y();
        this._mouseStateManager.updateHasTravelled(x, y);
        const xDelta = this._conversionManager.roundToGridCol(
            x - this._mouseStateManager.x
        );
        const yDelta = this._conversionManager.roundToGridRow(
            y - this._mouseStateManager.y
        );
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this._velocityMarkerCache.retrieve(selectedNoteIds);
        this._noteLayer.repositionNotes(xDelta, yDelta, selectedNoteElements);
        this._velocityLayer.repositionVelocityMarkers(xDelta, selectedVelocityMarkerElements);
    }

    handleAdjustSelectionMouseMove(e) {
        const { offsetX, offsetY } = e.evt;
        const currentX = offsetX - this._scrollManager.x;
        const currentY = offsetY - this._scrollManager.y;
        const mouseDownX = this._mouseStateManager.x;
        const mouseDownY = this._mouseStateManager.y;
        const selectionX1 = Math.min(mouseDownX, currentX);
        const selectionX2 = Math.max(mouseDownX, currentX);
        const selectionY1 = Math.min(mouseDownY, currentY);
        const selectionY2 = Math.max(mouseDownY, currentY);
        
        this._noteLayer.updateSelectionMarquee(selectionX1, selectionY1, selectionX2, selectionY2);
        this._reconcileNoteSelectionWithSelectionArea(selectionX1, selectionY1, selectionX2, selectionY2);
    }

    handleAdjustSelectionFromVelocityMouseMove(e) {
        const evtX = e.evt.offsetX - this._scrollManager.x;
        const evtY = e.evt.offsetY;
        const mouseDownX = this._mouseStateManager.x;
        const mouseDownY = this._mouseStateManager.y;
        const topOfVelocityArea = this._conversionManager.stageHeight - VELOCITY_LAYER_HEIGHT - SCROLLBAR_WIDTH;
        const bottomofVelocityArea = this._conversionManager.stageHeight - SCROLLBAR_WIDTH;
        const x1 = Math.min(mouseDownX, evtX);
        const x2 = Math.max(mouseDownX, evtX);
        const y1 = Math.max(topOfVelocityArea, Math.min(mouseDownY, evtY) );
        const y2 = Math.min(bottomofVelocityArea, Math.max(mouseDownY, evtY) );
        this._velocityLayer.updateSelectionMarquee(x1, y1, x2, y2);
        this._reconcileNoteSelectionWithSelectionArea(x1, 0, x2, this._conversionManager.gridHeight);
    }





    /***************
     Mouse up logic
    ****************/
    handleMouseUp(e) {
        switch (this._dragMode) {
            case DRAG_MODE_ADJUST_NOTE_SIZE:
                this.handleAdjustNoteSizeMouseUp(e);
                break;
            case DRAG_MODE_ADJUST_NOTE_POSITION:
                this.handleAdjustNotePositionMouseUp(e);
                break;
            case DRAG_MODE_ADJUST_SELECTION:
                this.handleAdjustSelectionMouseUp(e);
                break;
            case DRAG_MODE_ADJUST_SELECTION_FROM_VELOCITY_AREA:
                this.handleAdjustSelectionFromVelocityMouseUp(e);
                break;
            default:
                return;
        }
    }

    handleAdjustNoteSizeMouseUp(e) {
        this._dragMode = null;
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this._velocityMarkerCache.retrieve(selectedNoteIds);
        this._noteLayer.updateNotesAttributeCaches(selectedNoteElements);
        this._velocityLayer.updateVelocityMarkersAttributeCaches(selectedVelocityMarkerElements);
        selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
        this._serializeState();
    }

    handleAdjustNotePositionMouseUp(e) {
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
        selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
        this._serializeState();
        this._dragMode = null;
    }

    handleAdjustSelectionMouseUp(e) {
        this._noteLayer.clearSelectionMarquee();
        this._dragMode = null;
    }

    handleAdjustSelectionFromVelocityMouseUp(e) {
        this._velocityLayer.clearSelectionMarquee();
        this._dragMode = null;
    }

}
