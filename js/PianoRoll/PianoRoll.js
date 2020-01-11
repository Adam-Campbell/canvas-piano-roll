import Tone from 'tone';
import { Stage } from 'konva';
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
    canShiftRight
} from './utils';
import CanvasElementCache from '../CanvasElementCache';
import { genId } from '../genId';
import HistoryStack from '../HistoryStack';
import Clipboard from '../Clipboard';
import { clamp } from '../utils';
import SeekerLayer from '../SeekerLayer';
import NoteGridLayer from '../NoteGridLayer';

export default class PianoRoll {

    constructor(containerId, width = STAGE_WIDTH, height = STAGE_HEIGHT, initialQuantize = '16n', initialNoteDuration = '16n', numBars = 8) {
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
            height,
            initialQuantize,
            initialNoteDuration,
            numBars
        );
        this._audioReconciler = new AudioReconciler(this._conversionManager);
        this._noteSelection = new NoteSelection();
        this._historyStack = new HistoryStack({ notes: [], selectedNoteIds: [] });
        this._clipboard = new Clipboard(this._conversionManager);
        window.historyStack = this._historyStack;
        window.noteCache = this._noteCache;
        window.velocityCache = this._velocityMarkerCache;
        window.noteSelection = this._noteSelection;
        this._noteGridLayer = new NoteGridLayer(this._conversionManager);
        this._velocityLayer = new VelocityLayer(this._conversionManager);
        this._pianoKeyLayer = new PianoKeyLayer();
        this._seekerLayer = new SeekerLayer(this._conversionManager);
        this._scrollManager = new ScrollManager(
            this._noteGridLayer,
            this._velocityLayer,
            this._pianoKeyLayer,
            this._seekerLayer
        );
        this._scrollbarLayer = new ScrollbarLayer(
            this._scrollManager,
            this._conversionManager
        );
        this._stage.on('mousedown', e => this._handleInteractionStart(e));
        this._stage.on('mousemove', e => this._handleInteractionUpdate(e));
        this._stage.on('mouseup', e => this._handleInteractionEnd(e));
        this._stage.on('touchstart', e => this._handleInteractionStart(e));
        this._stage.on('touchmove', e => this._handleInteractionUpdate(e));
        this._stage.on('touchend', e => this._handleInteractionEnd(e));
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
        this._keyboardStateManager.addKeyListener('i', () => {
            this._keyboardStateManager.altKey && this._handleZoomAdjustment(true);
        });
        this._keyboardStateManager.addKeyListener('o', () => {
            this._keyboardStateManager.altKey && this._handleZoomAdjustment(false);
        });
        this._keyboardStateManager.addKeyListener('m', () => {
            this._scrollManager.x = this._scrollManager.x - 100;
        })
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

        this._previousBumpTimestamp = null;
    }

    init() {
        this._addLayer(this._noteGridLayer);
        this._addLayer(this._velocityLayer);
        this._addLayer(this._seekerLayer);
        this._addLayer(this._pianoKeyLayer);
        this._addLayer(this._scrollbarLayer);
        this._noteGridLayer.draw();
        this._velocityLayer.draw();
        this._seekerLayer.draw();
        this._pianoKeyLayer.draw();
        this._scrollbarLayer.draw();
    }

    _addLayer(layerClass) {
        this._stage.add(layerClass.layer);
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
            this._noteGridLayer.redrawOnZoomAdjustment(isZoomingIn);
            this._velocityLayer.redrawOnZoomAdjustment(isZoomingIn);
            this._seekerLayer.redrawOnZoomAdjustment();
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
        const noteElements = this._noteGridLayer.forceToState(state);
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

    _addNewNote(x, y) {
        const id = genId();
        const newNote = this._noteGridLayer.addNewNote(x, y, id);
        const newVelocityMarker = this._velocityLayer.addNewVelocityMarker(x, id);
        this._noteCache.add(newNote);
        this._velocityMarkerCache.add(newVelocityMarker);
        this._noteSelection.add(newNote);
    }    

    _deleteSelectedNotes() {
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this._velocityMarkerCache.retrieve(selectedNoteIds);
        this._noteGridLayer.deleteNotes(selectedNoteElements);
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
        selectedNoteElements.forEach(el => this._noteGridLayer.removeSelectedAppearance(el));
        selectedVelocityMarkerElements.forEach(el => this._velocityLayer.removeSelectedAppearance(el));
        this._noteSelection.clear();
    }

    _addNoteToSelection(noteElement) {
        this._noteSelection.add(noteElement);
        const velocityMarkerElement = this._velocityMarkerCache.retrieveOne(noteElement.attrs.id);
        this._noteGridLayer.addSelectedAppearance(noteElement);
        this._velocityLayer.addSelectedAppearance(velocityMarkerElement);
    }

    _removeNoteFromSelection(noteElement) {
        this._noteSelection.remove(noteElement);
        const velocityMarkerElement = this._velocityMarkerCache.retrieveOne(noteElement.attrs.id);
        this._noteGridLayer.removeSelectedAppearance(noteElement);
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

    _shiftSelectionUp() {
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        if (canShiftUp(selectedNoteElements)) {
            this._noteGridLayer.shiftNotesUp(selectedNoteElements);
            selectedNoteIds.forEach(id => this._addNoteToAudioEngine(id));
            this._serializeState();
        }
    }

    _shiftSelectionDown() {
        const selectedNoteIds = this._noteSelection.retrieveAll();
        const selectedNoteElements = this._noteCache.retrieve(selectedNoteIds);
        if (canShiftDown(selectedNoteElements, this._conversionManager.gridHeight)) {
            this._noteGridLayer.shiftNotesDown(selectedNoteElements);
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
            this._noteGridLayer.shiftNotesLeft(selectedNoteElements);
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
            this._noteGridLayer.shiftNotesRight(selectedNoteElements);
            this._velocityLayer.shiftVelocityMarkersRight(selectedVelocityMarkerElements);
            selectedNoteIds.forEach(id => this._addNoteToAudioEngine(id));
            this._serializeState();
        }
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
            const noteElement = this._noteGridLayer._createNoteElement(
                this._conversionManager.convertTicksToPx(noteObject.time),
                this._conversionManager.deriveYFromPitch(noteObject.note),
                this._conversionManager.convertTicksToPx(noteObject.duration),
                noteObject.id,
                true
            );
            //this._noteGridLayer.layer.add(noteElement);
            this._noteGridLayer.moveNoteToNotesContainer(noteElement);
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
            this._seekerLayer.updateSeekerLinePosition();
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
                this._handleVelocityAreaInteractionStart(rawY, roundedX);
            } else {
                this._dragMode = DRAG_MODE_ADJUST_NOTE_SIZE;
                this._clearSelection();
                this._addNewNote(roundedX, roundedY); 
            }
        } else if (this._activeTool === 'cursor') {
            if (isVelocityAreaClick) {
                if (target.id() === 'VELOCITY_BORDER') {
                    this._dragMode = DRAG_MODE_ADJUST_VELOCITY_AREA_HEIGHT;
                } else {
                    this._handleVelocityAreaInteractionStart(rawY, roundedX);
                }
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

    _handleVelocityAreaInteractionStart(rawY, roundedX) {
        const pxFromBottom = Math.min(
            this._conversionManager.stageHeight - rawY - SCROLLBAR_WIDTH,
            this._conversionManager.velocityAreaHeight - 10
        );
        const velocityValue = pxFromBottom / (this._conversionManager.velocityAreaHeight - 10);
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
        this._velocityLayer.updateVelocityMarkersHeight(velocityMarkersToUpdate, velocityValue);
        velocityMarkersToUpdate.forEach(velocityRect => {
            const id = velocityRect.getAttr('id');
            //this._audioReconciler.updateNoteVelocity(id, velocityValue);
            this._addNoteToAudioEngine(id);
            this._serializeState();
        });
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
        this._noteGridLayer.updateNoteDurations(
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
        this._noteGridLayer.repositionNotes(xDelta, yDelta, selectedNoteElements);
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
        this._noteGridLayer.updateSelectionMarquee(selectionX1, selectionY1, selectionX2, selectionY2);
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
        this._noteGridLayer.updateNotesAttributeCaches(selectedNoteElements);
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
        this._noteGridLayer.updateNotesAttributeCaches(selectedNoteElements);
        this._velocityLayer.updateVelocityMarkersAttributeCaches(selectedVelocityMarkerElements);
        selectedNoteIds.forEach(id => this._addNoteToAudioEngine(id));
        this._serializeState();
        this._dragMode = null;
    }

    _handleAdjustSelectionInteractionEnd(e) {
        this._noteGridLayer.clearSelectionMarquee();
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
