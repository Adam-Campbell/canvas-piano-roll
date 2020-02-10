import Konva from 'konva';
import ConversionManager from '../ConversionManager';
import Channel from '../../AudioEngine/Channel';
import { Colours } from '../../Constants';

export default class ChannelInfoLayer {

    private conversionManager: ConversionManager;
    private layer: Konva.Layer;
    private layerGroup: Konva.Group;
    private channels: Channel[]

    constructor(conversionManager: ConversionManager, layerRef: Konva.Layer, channels) {
        this.conversionManager = conversionManager;
        this.layer = layerRef;
        this.channels = channels;
        this.layerGroup = new Konva.Group({ y: this.conversionManager.seekerAreaHeight });
    }

    init() {
        // add the layerGroup to the backing layer provided
        this.layer.add(this.layerGroup);
        // call any drawing methods
        this.draw();
        // draw the layer
        this.layer.batchDraw();
    }

    draw() {
        this.layerGroup.destroyChildren();
        const heightOfPod = this.conversionManager.rowHeight;
        this.channels.forEach((channel, idx) => {
            const topOfPod = idx * heightOfPod;
            const topOfText = topOfPod + (heightOfPod / 2) - 8;
            const pod = new Konva.Rect({
                fill: 'tomato',
                width: 120,
                height: heightOfPod,
                x: 0,
                y: topOfPod,
                stroke: 'green',
                strokeWidth: 1
            });
            const text = new Konva.Text({
                text: channel.name,
                fill: 'pink',
                x: 8,
                y: topOfText
            });
            pod.moveTo(this.layerGroup);
            text.moveTo(this.layerGroup);
        });
    }
}
