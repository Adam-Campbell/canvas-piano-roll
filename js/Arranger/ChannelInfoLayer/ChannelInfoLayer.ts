import Konva from 'konva';
import ArrangerConversionManager from '../ArrangerConversionManager';
import Channel from '../../AudioEngine/Channel';
import { 
    Colours,
    StaticMeasurements 
} from '../../Constants';
import { 
    SerializedAudioEngineState,
    SerializedChannelState 
} from '../../AudioEngine/AudioEngineConstants';

export default class ChannelInfoLayer {

    private conversionManager: ArrangerConversionManager;
    private background: Konva.Rect;
    private layer: Konva.Layer;
    private layerGroup: Konva.Group;
    private channelInfoPodsGroup: Konva.Group;

    constructor(conversionManager: ArrangerConversionManager, layerRef: Konva.Layer) {
        this.conversionManager = conversionManager;
        this.layer = layerRef;
        this.background = this.constructBackground();
        this.layerGroup = new Konva.Group();
        this.channelInfoPodsGroup = new Konva.Group({ y: this.conversionManager.seekerAreaHeight });
    }

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

    updateY(y: number) {
        this.channelInfoPodsGroup.y(y);
        this.layer.batchDraw();
    }

    private constructBackground() : Konva.Rect  {
        return new Konva.Rect({
            x: 0,
            y: 0,
            width: StaticMeasurements.channelInfoColWidth,
            height: this.conversionManager.stageHeight,
            fill: Colours.grayscale[4]
        });
    }

    private drawChannelInfoPods(channels: SerializedChannelState[]) {
        this.channelInfoPodsGroup.destroyChildren();
        const heightOfPod = this.conversionManager.rowHeight;
        channels.forEach((channel: SerializedChannelState, idx: number) => {
            const topOfPod = idx * heightOfPod;
            const topOfText = topOfPod + (heightOfPod / 2) - 5;
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
            pod.moveTo(this.channelInfoPodsGroup);
            text.moveTo(this.channelInfoPodsGroup);
        });
    }

    redrawOnResize() {
        this.background.height(
            this.conversionManager.stageHeight
        );
    }

    forceToState(state: SerializedAudioEngineState) : void {
        this.drawChannelInfoPods(state.channels);
        this.layer.batchDraw();
    }
}
