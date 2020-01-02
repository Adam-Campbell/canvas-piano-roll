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

export default class PianoRoll {
    constructor(containerId, width = STAGE_WIDTH, height = STAGE_HEIGHT) {
        this._dragMode = null;
        this._activeTool = 'cursor';
        this._stage = new Stage({
            container: containerId,
            width,
            height
        });
        this._keyboardStateManager = new KeyboardStateManager(this._stage.container());
        this._mouseStateManager = new MouseStateManager();
        this._conversionManager = new ConversionManager();
        this._audioReconciler = new AudioReconciler(this._conversionManager);
        this._noteSelection = new NoteSelection();
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
            // this._noteLayer._shiftSelectionPitchUp(
            //     this._noteSelection.toArray()
            // );
            this._shiftSelectionUp();
        });
        this._keyboardStateManager.addKeyListener('ArrowDown', () => {
            // this._noteLayer._shiftSelectionPitchDown(
            //     this._noteSelection.toArray()
            // );
            this._shiftSelectionDown();
        });
        this._keyboardStateManager.addKeyListener('ArrowLeft', () => {
            // this._noteLayer._shiftSelectionTimeBackwards(
            //     this._noteSelection.toArray()
            // );
            this._shiftSelectionLeft();
        });
        this._keyboardStateManager.addKeyListener('ArrowRight', () => {
            // this._noteLayer._shiftSelectionTimeForwards(
            //     this._noteSelection.toArray()
            // );
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

    addLayer(layerClass) {
        this._stage.add(layerClass.layer);
    }

    _deleteSelectedNotes() {
        const notes = this._noteSelection.toArray();
        this._velocityLayer.deleteVelocityMarkers(notes);
        this._noteLayer.deleteNotes(notes);
        this._audioReconciler.removeNotes(notes);
        this._noteSelection.clear();
    }

    _shiftSelectionUp() {
        const noteRects = this._noteSelection.toArray();
        if (canShiftUp(noteRects)) {
            this._noteLayer.shiftNotesUp(noteRects);
        }
    }

    _shiftSelectionDown() {
        const noteRects = this._noteSelection.toArray();
        if (canShiftDown(noteRects, this._conversionManager.gridHeight)) {
            this._noteLayer.shiftNotesDown(noteRects);
        }
    }

    _shiftSelectionLeft() {
        const noteRects = this._noteSelection.toArray();
        if (canShiftLeft(noteRects)) {
            this._noteLayer.shiftNotesLeft(noteRects);
            this._velocityLayer.shiftVelocityMarkersLeft(noteRects);
        }
    }

    _shiftSelectionRight() {
        const noteRects = this._noteSelection.toArray();
        if (canShiftRight(noteRects, this._conversionManager.gridWidth)) {
            this._noteLayer.shiftNotesRight(noteRects);
            this._velocityLayer.shiftVelocityMarkersRight(noteRects);
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

        //console.log(target);
        // If marquee tool is active, a mousedown will always result in a transition to the
        // selection mode
        if (this._activeTool === 'marquee') {
            console.log('enter selection mode');
            this._dragMode = DRAG_MODE_ADJUST_SELECTION;

            // else if pencil tool is active, a mousedown will always result in a transition to the
            // adjust note size drag mode
        } else if (this._activeTool === 'pencil') {
            console.log('enter adjust note size mode');
            this._dragMode = DRAG_MODE_ADJUST_NOTE_SIZE;
            const cleared = this._noteSelection.clear();
            cleared.forEach(noteRect => {
                this._noteLayer._removeSelectedAppearance(noteRect);
                this._velocityLayer.removeSelectedAppearance(noteRect);
            });
            const newNote = this._noteLayer.addNewNote(roundedX, roundedY);
            this._velocityLayer.addNewVelocityMarker(newNote);
            this._noteSelection.add(newNote);
            // else if cursor tool is active, a mousedown can result in transitioning to the adjust
            // note size state, adjust note position state, or no transtition at all, depending on the
            // events target and location.
        } else if (this._activeTool === 'cursor') {
            console.log('cursor active, logic missing');
            const isVelocityLayerClick = STAGE_HEIGHT - offsetY <= VELOCITY_LAYER_HEIGHT + SCROLLBAR_WIDTH;
            if (isVelocityLayerClick) {
                console.log('is velocity layer click, no further action required');
                const pxFromBottom = Math.min(
                    STAGE_HEIGHT - offsetY - SCROLLBAR_WIDTH,
                    50
                );
                const velocityValue = pxFromBottom / 50;
                const {
                    matchingRects,
                    selectedMatchingRects
                } = this._velocityLayer.TEMP_HACK_GET_VELOCITY_RECTS(roundedX);
                let velocityMarkersToUpdate;
                if (matchingRects.length === 0) {
                    console.log('nothing to update');
                } else if (selectedMatchingRects.length === 0) {
                    velocityMarkersToUpdate = matchingRects;
                    console.log('update all of the matching rects');
                } else {
                    velocityMarkersToUpdate = selectedMatchingRects;
                    console.log('update only the selected matching rects');
                }
                this._velocityLayer.updateVelocityMarkersHeight(velocityMarkersToUpdate, pxFromBottom);

            }
            const targetIsNote = Boolean(target.getAttr('isNoteRect'));
            if (!targetIsNote) {
                return;
            }
            const { x: rectX, width: rectWidth } = target.attrs;
            const isEdgeClick = rectWidth + rectX - evtX < 10;
            const isSelected = this._noteSelection.has(target);
            if (isEdgeClick) {
                if (!isSelected) {
                    const cleared = this._noteSelection.clear();
                    cleared.forEach(noteRect => {
                        this._noteLayer._removeSelectedAppearance(noteRect);
                        this._velocityLayer.removeSelectedAppearance(noteRect);
                    });
                    this._noteSelection.add(target);
                    this._noteLayer._addSelectedAppearance(target);
                    this._velocityLayer.addSelectedAppearance(target);
                } 
                this._dragMode = DRAG_MODE_ADJUST_NOTE_SIZE;
            } else {
                this._dragMode = DRAG_MODE_ADJUST_NOTE_POSITION;
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
        //console.log('handleAdjustNoteSizeMouseMove was called')
        const { offsetX } = e.evt;
        const x = offsetX - this._gridLayer.layer.x();
        const selectedNotes = this._noteSelection.toArray();
        this._noteLayer.updateNoteDurations(x, selectedNotes);
    }

    handleAdjustNotePositionMouseMove(e) {
        //console.log('handle adjust note position mouse move called');
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
        const notes = this._noteSelection.toArray();
        this._noteLayer.repositionNotes(xDelta, yDelta, notes);
        this._velocityLayer.repositionVelocityMarkers(xDelta, notes);
    }

    handleAdjustSelectionMouseMove(e) {
        console.log('handle adjust selection mouse move called');
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

        const allNotes = this._noteLayer.TEMP_HACK_GET_ALL_NOTES();

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
                this._noteSelection.add(noteRect);
                this._noteLayer._addSelectedAppearance(noteRect);
                this._velocityLayer.addSelectedAppearance(noteRect);
            } else {
                this._noteSelection.remove(noteRect);
                this._noteLayer._removeSelectedAppearance(noteRect);
                this._velocityLayer.removeSelectedAppearance(noteRect);
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
        const notes = this._noteSelection.toArray();
        this._noteLayer.updateNotesAttributeCaches(notes);
        this._velocityLayer.updateVelocityMarkersAttributeCaches(notes);
    }

    handleAdjustNotePositionMouseUp(e) {
        //console.log('handle adjust note position mouse up called');
        if (!this._mouseStateManager.hasTravelled) {
            const { target } = e;
            // this._noteSelection.update(
            //     target,
            //     this._keyboardStateManager.shiftKey
            // );
            // this._noteLayer.layer.batchDraw();
            const isCurrentlySelected = this._noteSelection.has(target);
            if (this._keyboardStateManager.shiftKey) {
                if (isCurrentlySelected) {
                    this._noteSelection.remove(target);
                    this._noteLayer._removeSelectedAppearance(target);
                    this._velocityLayer.removeSelectedAppearance(target);
                } else {
                    this._noteSelection.add(target);
                    this._noteLayer._addSelectedAppearance(target);
                    this._velocityLayer.addSelectedAppearance(target)
                }
            } else {
                const cleared = this._noteSelection.clear();
                cleared.forEach(noteRect => {
                    this._noteLayer._removeSelectedAppearance(noteRect);
                    this._velocityLayer.removeSelectedAppearance(noteRect);
                });
                if (!isCurrentlySelected) {
                    this._noteSelection.add(target);
                    this._noteLayer._addSelectedAppearance(target);
                    this._velocityLayer.addSelectedAppearance(target);
                }
            }
            //console.log('has travelled');
        }
        const notes = this._noteSelection.toArray();
        this._noteLayer.updateNotesAttributeCaches(notes);
        this._velocityLayer.updateVelocityMarkersAttributeCaches(notes);
        this._dragMode = null;
    }

    handleAdjustSelectionMouseUp(e) {
        console.log('handle adjust selection mouse up called');
        this._noteLayer.clearSelectionMarquee();
        this._dragMode = null;
    }

}
