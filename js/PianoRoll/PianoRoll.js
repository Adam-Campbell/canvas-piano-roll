import { Stage } from 'konva';
import { 
    STAGE_WIDTH, 
    STAGE_HEIGHT,
    DRAG_MODE_ADJUST_NOTE_SIZE,
    DRAG_MODE_ADJUST_NOTE_POSITION,
    DRAG_MODE_ADJUST_SELECTION,
    VELOCITY_LAYER_HEIGHT,
    SCROLLBAR_WIDTH
} from '../constants';
import {
    ACTIVE_TOOL_UPDATE
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
        this._conversionManager = new ConversionManager();
        this._audioReconciler = new AudioReconciler(this._conversionManager);
        this._noteSelection = new NoteSelection();
        this._historyStack = new HistoryStack();
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
            this._scrollManager
        );
        this._stage.on('mousedown', e => {
            this._handleMouseDown(e);
        })
        this._stage.on('mousemove', e => {
            this.handleMouseMove(e);
        });
        this._stage.on('mouseup', e => {
            this.handleMouseUp(e);
        });
        this._keyboardStateManager.addKeyListener('Delete', () => {
            this._deleteSelectedNotes();
        });
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
            this._shiftSelectionUp();
        });
        this._keyboardStateManager.addKeyListener('ArrowDown', () => {
            this._shiftSelectionDown();
        });
        this._keyboardStateManager.addKeyListener('ArrowLeft', () => {
            this._shiftSelectionLeft();
        });
        this._keyboardStateManager.addKeyListener('ArrowRight', () => {
            this._shiftSelectionRight();
        });
        emitter.subscribe(ACTIVE_TOOL_UPDATE, tool => {
            this._activeTool = tool;
            console.log(this._activeTool);
        });
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
        const selectedNoteIds = this._noteSelection.retreiveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this._velocityMarkerCache.retrieve(selectedNoteIds);
        this._noteLayer.deleteNotes(selectedNoteElements);
        this._velocityLayer.deleteVelocityMarkers(selectedVelocityMarkerElements);
        this._noteSelection.clear();
        this._audioReconciler.removeNotes(selectedNoteIds);
        this._serializeState();
    }

    _clearSelection() {
        const selectedNoteIds = this._noteSelection.retreiveAll();
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

    _addNewNote(x, y) {
        const id = genId();
        const newNote = this._noteLayer.addNewNote(x, y, id);
        const newVelocityMarker = this._velocityLayer.addNewVelocityMarker(x, id);
        this._noteCache.add(newNote);
        this._velocityMarkerCache.add(newVelocityMarker);
        this._noteSelection.add(newNote);
    }

    _shiftSelectionUp() {
        const selectedNoteIds = this._noteSelection.retreiveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        if (canShiftUp(selectedNoteElements)) {
            this._noteLayer.shiftNotesUp(selectedNoteElements);
            selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
            this._serializeState();
        }
    }

    _shiftSelectionDown() {
        const selectedNoteIds = this._noteSelection.retreiveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        if (canShiftDown(selectedNoteElements, this._conversionManager.gridHeight)) {
            this._noteLayer.shiftNotesDown(selectedNoteElements);
            selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
            this._serializeState();
        }
    }

    _shiftSelectionLeft() {
        const selectedNoteIds = this._noteSelection.retreiveAll();
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
        const selectedNoteIds = this._noteSelection.retreiveAll();
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
            STAGE_HEIGHT - offsetY - SCROLLBAR_WIDTH,
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
        const selectedNoteIds = this._noteSelection.retreiveAll();
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
        const timestamp = Date.now();
        this._mouseStateManager.addMouseDownEvent(evtX, evtY, timestamp);
        const isVelocityLayerClick = STAGE_HEIGHT - offsetY <= VELOCITY_LAYER_HEIGHT + SCROLLBAR_WIDTH;
        // If marquee tool is active, a mousedown will always result in a transition to the
        // selection mode
        if (this._activeTool === 'marquee') {
            // As a future enhancement, I would like a velocity layer interaction whilst the marquee tool
            // is active to result in selecting all of the notes that fit within the horizontal space
            // covered by the interaction, regardless of vertical space (so as if the top vertical edge
            // was the top of the note grid and the bottom vertical edge was the bottom of note grid).
            if (!isVelocityLayerClick) {
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
            default:
                return;
        }
    }

    handleAdjustNoteSizeMouseMove(e) {
        const { offsetX } = e.evt;
        const x = offsetX - this._gridLayer.layer.x();
        const selectedNoteIds = this._noteSelection.retreiveAll();
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
        const selectedNoteIds = this._noteSelection.retreiveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this._velocityMarkerCache.retrieve(selectedNoteIds);
        this._noteLayer.repositionNotes(xDelta, yDelta, selectedNoteElements);
        this._velocityLayer.repositionVelocityMarkers(xDelta, selectedVelocityMarkerElements);
    }

    handleAdjustSelectionMouseMove(e) {
        const { offsetX, offsetY } = e.evt;
        const currentX = this._conversionManager.roundToGridCol(
            offsetX - this._scrollManager.x
        );
        const currentY = this._conversionManager.roundDownToGridRow(
            offsetY - this._scrollManager.y
        );
        const mouseDownX = this._conversionManager.roundToGridCol(
            this._mouseStateManager.x
        );
        const mouseDownY = this._conversionManager.roundToGridRow(
            this._mouseStateManager.y
        );
        const selectionX1 = Math.min(mouseDownX, currentX);
        const selectionX2 = Math.max(mouseDownX, currentX);
        const selectionY1 = Math.min(mouseDownY, currentY);
        const selectionY2 = Math.max(mouseDownY, currentY);
        
        this._noteLayer.updateSelectionMarquee(selectionX1, selectionY1, selectionX2, selectionY2);

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
            default:
                return;
        }
    }

    handleAdjustNoteSizeMouseUp(e) {
        this._dragMode = null;
        const selectedNoteIds = this._noteSelection.retreiveAll();
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
        const selectedNoteIds = this._noteSelection.retreiveAll();
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

}
