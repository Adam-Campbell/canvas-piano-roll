import { Stage } from 'konva';
import { 
    STAGE_WIDTH, 
    STAGE_HEIGHT,
    DRAG_MODE_ADJUST_NEW_NOTE_SIZE,
    DRAG_MODE_ADJUST_NOTE_SIZE
} from '../constants';
import GridLayer from '../GridLayer';
import NoteLayer from '../NoteLayer';
import PianoKeyLayer from '../PianoKeyLayer';
import ScrollbarLayer from '../ScrollbarLayer';
import ConversionManager from '../ConversionManager';


export default class PianoRoll {
    constructor(containerId, width = STAGE_WIDTH, height = STAGE_HEIGHT) {
        this._dragMode = null;
        this.setDragMode = this._setDragMode.bind(this);
        this._stage = new Stage({
            container: containerId,
            width,
            height
        });
        this._conversionManager = new ConversionManager();
        this._gridLayer = new GridLayer(4, '16n', this.setDragMode, this._conversionManager);
        this._noteLayer = new NoteLayer(this._conversionManager, this.setDragMode);
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
            case DRAG_MODE_ADJUST_NEW_NOTE_SIZE:
                this.handleAdjustNoteSizeMouseMove(e);
                break;
            case DRAG_MODE_ADJUST_NOTE_SIZE:
                this.handleAdjustNoteSizeMouseMove(e);
                break;
            default:
                return;
        }
    }

    handleAdjustNoteSizeMouseMove(e) {
        //console.log('handleAdjustNoteSizeMouseMove was called')
        const { offsetX } = e.evt;
        const x = offsetX - this._gridLayer.layer.x();
        this._noteLayer.updateNoteDuration(x);
    }

    handleMouseUp(e) {
        switch (this._dragMode) {
            case DRAG_MODE_ADJUST_NEW_NOTE_SIZE:
                this.handleAdjustNewNoteSizeMouseUp(e);
                break;
            case DRAG_MODE_ADJUST_NOTE_SIZE:
                this.handleAdjustNoteSizeMouseUp(e);
                break;
            default:
                return;
        }
    }

    handleAdjustNewNoteSizeMouseUp(e) {
        this.setDragMode(null);
        this._noteLayer.confirmNote();
    }

    handleAdjustNoteSizeMouseUp(e) {
        this.setDragMode(null);
    }

}
