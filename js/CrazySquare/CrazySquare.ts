import Konva from 'konva';
import EventEmitter from '../EventEmitter';
import { Events } from '../Constants';


export default class CrazySquare {

    private colours = [
        'red',
        'green',
        'orange',
        'yellow',
        'pink',
        'purple',
    ];

    private colourIdx = 0;

    private stage: Konva.Stage;
    private layer: Konva.Layer;
    private backgroundRect: Konva.Rect;
    private foregroundRect: Konva.Rect;
    private resizeEventEmitter: EventEmitter;

    private stageWidth: number;
    private stageHeight: number;

    constructor(resizeEventEmitter: EventEmitter) {
        this.resizeEventEmitter = resizeEventEmitter;
        this.resizeEventEmitter.subscribe(Events.resizeWindow, this.redrawOnResize);
    }

    init = (stageContainer, initialWidth, initialHeight) => {
        this.stage = new Konva.Stage({
            container: stageContainer, 
            width: initialWidth,
            height: initialHeight
        });
        this.layer = new Konva.Layer();
        this.backgroundRect = this.constructBackgroundRect(initialWidth, initialHeight);
        this.foregroundRect = this.constructForegroundRect(initialWidth, initialHeight);
        this.stage.add(this.layer);
        this.layer.add(this.backgroundRect);
        this.layer.add(this.foregroundRect);
        this.layer.batchDraw();
        this.stage.on('click', this.handleStageClick);
    }

    cleanup = () => {
        this.stage.destroy();
        this.stage = null;
        this.layer = null;
        this.backgroundRect = null;
        this.foregroundRect = null;
    }

    constructBackgroundRect = (stageWidth, stageHeight) => {
        const backgroundRect = new Konva.Rect({
            x: 0,
            y: 0,
            width: stageWidth,
            height: stageHeight,
            fill: 'blue',
        });
        return backgroundRect;
    }

    constructForegroundRect = (stageWidth, stageHeight) => {
        const foregroundRect = new Konva.Rect({
            x: stageWidth * 0.25,
            y: stageHeight * 0.25,
            width: stageWidth * 0.5,
            height: stageHeight * 0.5,
            fill: this.currentColour
        });
        return foregroundRect;
    }

    redrawOnResize = (newWidth: number, newHeight: number) => {
        this.stageWidth = newWidth;
        this.stageHeight = newHeight;
        this.stage.width(newWidth);
        this.stage.height(newHeight);
        this.backgroundRect.width(newWidth);
        this.backgroundRect.height(newHeight);
        this.foregroundRect.width(newWidth * 0.5);
        this.foregroundRect.height(newHeight * 0.5);
        this.foregroundRect.x(newWidth * 0.25);
        this.foregroundRect.y(newHeight * 0.25);
        this.layer.batchDraw();
    }

    get currentColour() {
        return this.colours[
            this.colourIdx % this.colours.length
        ];
    }

    handleStageClick = () => {
        this.colourIdx++;
        this.foregroundRect.fill(this.currentColour);
        this.layer.batchDraw();
    }

}