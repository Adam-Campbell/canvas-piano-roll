import Konva from 'konva';
import ArrangerConversionManager from '../ArrangerConversionManager';
import Channel from '../../AudioEngine/Channel';
import EventEmitter from '../../EventEmitter';
import { 
    Colours,
    StaticMeasurements,
    Events
} from '../../Constants';
import { 
    SerializedAudioEngineState,
    SerializedChannelState 
} from '../../AudioEngine/AudioEngineConstants';

export default class ChannelInfoColumn {

    private conversionManager: ArrangerConversionManager;
    private eventEmitter: EventEmitter;
    private background: Konva.Rect;
    private layer: Konva.Layer;
    private layerGroup: Konva.Group;
    private channelInfoPodsGroup: Konva.Group;

    constructor(
        conversionManager: ArrangerConversionManager, 
        eventEmitter: EventEmitter, 
        layerRef: Konva.Layer
    ) {
        this.conversionManager = conversionManager;
        this.eventEmitter = eventEmitter;
        this.layer = layerRef;
        this.background = this.constructBackground();
        this.layerGroup = new Konva.Group();
        this.channelInfoPodsGroup = new Konva.Group({ y: this.conversionManager.seekerAreaHeight });
    }

    /**
     * Adds everything to the layer and updates the channel info pods to match the initial
     * state given.
     */
    init(initialState: SerializedAudioEngineState) {
        // add the layerGroup to the backing layer provided
        this.layer.add(this.layerGroup);
        // call any drawing methods
        this.background.moveTo(this.layerGroup);
        //this.drawChannelInfoPods(initialState.channels);
        this.channelInfoPodsGroup.moveTo(this.layerGroup);
        // draw the layer
        this.forceToState(initialState);
    }

    /**
     * Adjusts the position of the channel info pods along the y axis based on the y value given.
     */
    updateY(y: number) {
        this.channelInfoPodsGroup.y(y);
        this.layer.batchDraw();
    }

    /**
     * Constructs and returns the background that sits behind the channel info pods. 
     */
    private constructBackground() : Konva.Rect  {
        return new Konva.Rect({
            x: 0,
            y: 0,
            width: StaticMeasurements.channelInfoColWidth,
            height: this.conversionManager.stageHeight,
            fill: Colours.grayscale[4]
        });
    }

    /**
     * Clears any existing channel info pods and then constructs new ones using the given state.
     */
    private drawChannelInfoPods(channels: SerializedChannelState[]) {
        this.channelInfoPodsGroup.destroyChildren();
        const heightOfPod = this.conversionManager.rowHeight;
        channels.forEach((channel: SerializedChannelState, idx: number) => {
            const topOfPod = idx * heightOfPod;
            const oneThirdPoint = topOfPod + (heightOfPod / 3);
            const twoThirdsPoint = topOfPod + (heightOfPod / 3 * 2);
            const topOfText = oneThirdPoint - 7;
            const pod = new Konva.Rect({
                fill: Colours.grayscale[4],
                width: StaticMeasurements.channelInfoColWidth,
                height: heightOfPod,
                x: 0,
                y: topOfPod,
                stroke: Colours.grayscale[7],
                strokeWidth: 1
            });
            const text = new Konva.Text({
                text: channel.name,
                fill: 'white',
                x: 8,
                y: topOfText
            });
            const button = new Konva.Rect({
                width: 32,
                height: 16,
                cornerRadius: 2,
                x: 8,
                y: twoThirdsPoint - 8,
                fill: 'tomato'
            });
            const buttonText = new Konva.Text({
                text: 'Edit',
                fill: 'white',
                x: 10,
                y: twoThirdsPoint - 5,
                listening: false
            });
            button.on('mousedown', () => {
                this.eventEmitter.emit(Events.openChannelSettingsWindow, channel.id);
            });
            pod.moveTo(this.channelInfoPodsGroup);
            text.moveTo(this.channelInfoPodsGroup);
            button.moveTo(this.channelInfoPodsGroup);
            buttonText.moveTo(this.channelInfoPodsGroup);
        });
    }

    /**
     * Redraws the layer. This method is called by the parent stage whenever its size updates. 
     */
    redrawOnResize() {
        this.background.height(
            this.conversionManager.stageHeight
        );
    }

    /**
     * Clears the existing channel info pods, constructs new ones based on the given state and then
     * redraws the layer.
     */
    forceToState(state: SerializedAudioEngineState) : void {
        this.drawChannelInfoPods(state.channels);
        this.layer.batchDraw();
    }
}
