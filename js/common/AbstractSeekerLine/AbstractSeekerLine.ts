import Konva from 'konva';
import Tone from 'tone';
import { 
    Colours,
    StaticMeasurements,
    ConversionManager
} from '../../Constants';

export default abstract class AbstractSeekerLine {
    
    protected conversionManager: ConversionManager;
    layer: Konva.Layer;
    protected seekerLine: Konva.Line;
    protected isPlaying: boolean;
    protected animationFrameId: number;

    constructor(conversionManager: ConversionManager, leftPanelWidth: number) {
        this.conversionManager = conversionManager;
        this.layer = new Konva.Layer({
            x: leftPanelWidth
        });
        this.isPlaying = Tone.Transport.state === 'started';
        this.animationFrameId = null;
    }

    /**
     * Adds the seeker line to the layer, registers event subscriptions and begins animating the seeker
     * line if the Transport is in the 'started' state.
     */
    init() {
        this.seekerLine = this.constructSeekerLine();
        this.layer.add(this.seekerLine);
        this.layer.batchDraw();
        if (this.isPlaying) {
            this.beginSyncing();
        }
        this.registerGlobalEventSubscriptions();
    }

    /**
     * Registers the necessary event subscriptions which in this case are with Tone rather than the
     * regular EventEmitter used elsewhere.
     */
    protected registerGlobalEventSubscriptions() : void {
        Tone.Transport.on('start', () => {
            console.log('transport was started');
            this.beginSyncing();
        });
        Tone.Transport.on('stop', () => {
            console.log('transport was stopped');
            this.stopSyncing();
            this.updateSeekerLinePosition();
        });
        Tone.Transport.on('pause', () => {
            console.log('transport was paused');
            this.stopSyncing();
        });
    }

    /**
     * Adjusts the position of the seeker line along the x axis.
     */
    updateX(x) : void {
        this.layer.x(x);
        this.layer.batchDraw();
    }

    /**
     * Performs the necessary recalculations when the zoom level of the parent stage changes, and then
     * redraws the layer. 
     */
    redrawOnZoomAdjustment() : void {
        this.updateSeekerLinePosition();
        this.layer.batchDraw();
    }

    /**
     * The implementation of this method should calculate where along the x axis of the current stage the
     * seeker line should be positioned, if it should appear at all. 
     */
    abstract calculateSeekerLineXPos() : number;

    /**
     * Creates and returns the seeker line, setting an appropriate intial x position for it based on the 
     * current track progress.
     */
    protected constructSeekerLine() : Konva.Line {
        const currentPositionPx = this.calculateSeekerLineXPos();
        const seekerLine = new Konva.Line({
            points: [currentPositionPx, 0, currentPositionPx, this.conversionManager.stageHeight],
            stroke: Colours.grayscale[7],
            strokeWidth: 2
        });
        return seekerLine;
    }

    /**
     * Updates the position of the existing seeker line based upon the current track progress, and then
     * redraws the layer. 
     */
    updateSeekerLinePosition() : void {
        const currentPositionPx = this.calculateSeekerLineXPos();
        this.seekerLine.points([
            currentPositionPx, 
            0, 
            currentPositionPx, 
            this.conversionManager.stageHeight
        ]);
        this.layer.batchDraw();
    }

    /**
     * Updates the seeker line position and then schedules itself to be called again at the next paint
     * using requestAnimationFrame. This means that this method will continuously run on every frame
     * until cancelAnimationFrame is called.
     */
    protected syncSeekerLineWithTransport = () : void => {
        this.updateSeekerLinePosition();
        this.animationFrameId = window.requestAnimationFrame(this.syncSeekerLineWithTransport);
    }

    /**
     * Makes the initial call to syncSeekerLineWithTransport that begins the process of it being called
     * on every frame. 
     */
    protected beginSyncing() : void {
        this.isPlaying = true;
        this.syncSeekerLineWithTransport();
    }

    /**
     * Uses cancelAnimationFrame to stop the process of syncSeekerLineWithTransport being called on every
     * frame. It won't be called again until the next time beginSyncing is called.
     */
    protected stopSyncing() : void {
        this.isPlaying = false;
        if (this.animationFrameId) {
            window.cancelAnimationFrame(this.animationFrameId);
        }
    }

    /**
     * Redraws the layer. This method is called by the parent stage whenever its size updates. 
     */
    redrawOnResize() : void {
        this.updateSeekerLinePosition();
    }

}
