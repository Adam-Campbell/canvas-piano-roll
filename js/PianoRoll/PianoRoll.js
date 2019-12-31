import { Stage } from 'konva';
import { 
    STAGE_WIDTH, 
    STAGE_HEIGHT,
    DRAG_MODE_ADJUST_NOTE_SIZE,
    DRAG_MODE_ADJUST_NOTE_POSITION,
    DRAG_MODE_ADJUST_SELECTION
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
            this._noteSelection,
            this._mouseStateManager
        );
        this._pianoKeyLayer = new PianoKeyLayer();
        this._scrollManager = new ScrollManager(
            this._gridLayer,
            this._noteLayer,
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
            this._noteLayer._shiftSelectionPitchUp();
        });
        this._keyboardStateManager.addKeyListener('ArrowDown', () => {
            this._noteLayer._shiftSelectionPitchDown();
        });
        this._keyboardStateManager.addKeyListener('ArrowLeft', () => {
            this._noteLayer._shiftSelectionTimeBackwards();
        });
        this._keyboardStateManager.addKeyListener('ArrowRight', () => {
            this._noteLayer._shiftSelectionTimeForwards();
        });
        emitter.subscribe(ACTIVE_TOOL_UPDATE, tool => {
            this._activeTool = tool;
            console.log(this._activeTool);
        });
    }

    init() {
        this.addLayer(this._gridLayer);
        this.addLayer(this._noteLayer);
        this.addLayer(this._pianoKeyLayer);
        this.addLayer(this._scrollbarLayer);
        this._gridLayer.draw();
        this._noteLayer.draw();
        this._pianoKeyLayer.draw();
        this._scrollbarLayer.draw();
    }

    addLayer(layerClass) {
        this._stage.add(layerClass.layer);
    }

    _deleteSelectedNotes() {
        const notes = this._noteSelection.toArray();
        notes.forEach(note => {
            note.destroy();
        });
        this._noteLayer.layer.batchDraw();
        this._audioReconciler.removeNotes(notes);
    }

    _handleMouseDown(e) {
        const { evt, target } = e;
        const evtX = evt.offsetX - this._scrollManager.x;
        const evtY = evt.offsetY - this._scrollManager.y;

        const roundedX = this._conversionManager.roundDownToGridCol(evtX);
        const roundedY = this._conversionManager.roundDownToGridRow(evtY);
        const timestamp = Date.now();
        this._mouseStateManager.addMouseDownEvent(evtX, evtY, timestamp);

        console.log(target);
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
            this._noteSelection.clear();
            this._noteLayer.addNewNote(roundedX, roundedY);
            // else if cursor tool is active, a mousedown can result in transitioning to the adjust
            // note size state, adjust note position state, or no transtition at all, depending on the
            // events target and location.
        } else if (this._activeTool === 'cursor') {
            console.log('cursor active, logic missing');
            const targetIsNote = Boolean(target.getAttr('isNoteRect'));
            if (!targetIsNote) {
                return;
            }
            const { x: rectX, width: rectWidth } = target.attrs;
            const isEdgeClick = rectWidth + rectX - evtX < 10;
            const isSelected = this._noteSelection.has(target);
            if (isEdgeClick) {
                if (!isSelected) {
                    this._noteSelection.clear();
                    this._noteSelection.add(target);
                } 
                this._dragMode = DRAG_MODE_ADJUST_NOTE_SIZE;
            } else {
                this._dragMode = DRAG_MODE_ADJUST_NOTE_POSITION;
                // if (isSelected) {
                //     this._setDragMode(DRAG_MODE_ADJUST_NOTE_POSITION);
                // } else {
                    // if (!this._keyboardStateManager.shiftKey) {
                    //     this._noteSelection.clear();
                    // }
                    // this._noteSelection.add(target);
                    // this._noteLayer.layer.batchDraw();
                // }
            }
        }
    }

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
        this._noteLayer.updateNoteDurations(x);
    }

    handleAdjustNotePositionMouseMove(e) {
        //console.log('handle adjust note position mouse move called');
        const { offsetX, offsetY } = e.evt;
        const x = offsetX - this._gridLayer.layer.x();
        const y = offsetY - this._gridLayer.layer.y();
        this._mouseStateManager.updateHasTravelled(x, y);
        this._noteLayer.repositionSelectedNotes(x, y);
    }

    handleAdjustSelectionMouseMove(e) {
        console.log('handle adjust selection mouse move called');
        const { offsetX, offsetY } = e.evt;
        const x = offsetX - this._gridLayer.layer.x();
        const y = offsetY - this._gridLayer.layer.y();
        this._noteLayer.updateSelectionMarquee(x, y);
    }

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
        this._noteLayer.confirmNotes();
    }

    handleAdjustNotePositionMouseUp(e) {
        //console.log('handle adjust note position mouse up called');
        if (!this._mouseStateManager.hasTravelled) {
            const { target } = e;
            this._noteSelection.update(
                target,
                this._keyboardStateManager.shiftKey
            );
            this._noteLayer.layer.batchDraw();
            console.log('has travelled');
        }
        this._noteLayer.confirmNotes();
        this._dragMode = null;
    }

    handleAdjustSelectionMouseUp(e) {
        console.log('handle adjust selection mouse up called');
        this._noteLayer.clearSelectionMarquee();
        this._dragMode = null;
    }

}
