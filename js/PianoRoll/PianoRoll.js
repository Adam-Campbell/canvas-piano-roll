import { Stage } from 'konva';
import { 
    STAGE_WIDTH, 
    STAGE_HEIGHT,
    DRAG_MODE_ADJUST_NOTE_SIZE,
    DRAG_MODE_ADJUST_NOTE_POSITION,
    DRAG_MODE_ADJUST_SELECTION
} from '../constants';
import GridLayer from '../GridLayer';
import NoteLayer from '../NoteLayer';
import PianoKeyLayer from '../PianoKeyLayer';
import ScrollbarLayer from '../ScrollbarLayer';
import ConversionManager from '../ConversionManager';
import AudioReconciler from '../AudioReconciler';
import NoteSelection from '../NoteSelection';
import KeyboardStateManager from '../KeyboardStateManager';
import MouseStateManager from '../MouseStateManager';

export default class PianoRoll {
    constructor(containerId, width = STAGE_WIDTH, height = STAGE_HEIGHT) {
        this._dragMode = null;
        this.setDragMode = this._setDragMode.bind(this);
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
        this._gridLayer = new GridLayer(
            4, 
            '16n', 
            this.setDragMode, 
            this._conversionManager,
            this._noteSelection,
            this._mouseStateManager,
            this._keyboardStateManager
        );
        this._noteLayer = new NoteLayer(
            this._conversionManager, 
            this.setDragMode, 
            this._audioReconciler,
            this._noteSelection,
            this._keyboardStateManager,
            this._mouseStateManager
        );
        this._pianoKeyLayer = new PianoKeyLayer();
        this._scrollbarLayer = new ScrollbarLayer(
            this._gridLayer,
            this._noteLayer, 
            this._pianoKeyLayer
        );
        this._stage.on('mousemove', e => {
            this.handleMouseMove(e);
        });
        this._stage.on('mouseup', e => {
            this.handleMouseUp(e);
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

    _setDragMode(newMode) {
        this._dragMode = newMode;
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
        this.setDragMode(null);
        this._noteLayer.confirmNotes();
    }

    handleAdjustNotePositionMouseUp(e) {
        //console.log('handle adjust note position mouse up called');
        this._noteLayer.deselectIfNeeded(e);
        this._noteLayer.confirmNotes();
        this.setDragMode(null);
    }

    handleAdjustSelectionMouseUp(e) {
        console.log('handle adjust selection mouse up called');
        this._noteLayer.clearSelectionMarquee();
        this.setDragMode(null);
    }

}
