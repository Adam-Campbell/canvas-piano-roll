import Konva from 'konva';
import { 
    Colours,
    StaticMeasurements
} from '../../Constants';
import { clamp } from '../../utils';
import ConversionManager from '../ConversionManager';
import ScrollManager from '../ScrollManager';

export default class ScrollbarLayer {

    private conversionManager: ConversionManager;
    private scrollManager: ScrollManager;
    private layer: Konva.Layer;
    private layerGroup: Konva.Group;
    private verticalTrack: Konva.Rect;
    private verticalThumb: Konva.Rect;
    private horizontalTrack: Konva.Rect;
    private horizontalThumb: Konva.Rect;

    constructor(scrollManager: ScrollManager, conversionManager: ConversionManager, layerRef: Konva.Layer) {
        this.conversionManager = conversionManager;
        this.scrollManager = scrollManager;
        this.layer = layerRef;
        this.layerGroup = new Konva.Group();
        this.verticalTrack = this.constructVerticalTrack();
        this.verticalThumb = this.constructVerticalThumb();
        this.horizontalTrack = this.constructHorizontalTrack();
        this.horizontalThumb = this.constructHorizontalThumb();  
    }

    init() : void {
        this.layerGroup.removeChildren();
        this.verticalTrack.moveTo(this.layerGroup);
        this.verticalThumb.moveTo(this.layerGroup);
        this.horizontalTrack.moveTo(this.layerGroup);
        this.horizontalThumb.moveTo(this.layerGroup);
        this.layer.add(this.layerGroup);
        this.layer.batchDraw();
        this.registerGroupEventSubscriptions();
    }

    private registerGroupEventSubscriptions() : void {
        this.layerGroup.on('mousedown', e => {
            e.cancelBubble = true;
        });
        this.layerGroup.on('touchstart', e => {
            e.cancelBubble = true;
        });
    }

    get verticalScrollRange() : number {
        return this.conversionManager.gridHeight - this.conversionManager.stageHeight + StaticMeasurements.scrollbarWidth + this.conversionManager.velocityAreaHeight + this.conversionManager.seekerAreaHeight;
    }

    get verticalThumbMovementRange() : number {
        return this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth - StaticMeasurements.scrollbarThumbLength - (StaticMeasurements.scrollbarGutter * 2);
    }

    get horizontalScrollRange() : number {
        return this.conversionManager.gridWidth - this.conversionManager.stageWidth + StaticMeasurements.scrollbarWidth + StaticMeasurements.pianoKeyWidth;
    }

    get horizontalThumbMovementRange() : number {
        return this.conversionManager.stageWidth - StaticMeasurements.scrollbarWidth - StaticMeasurements.scrollbarThumbLength - (StaticMeasurements.scrollbarGutter * 2)
    }

    private constructVerticalTrack() : Konva.Rect {
        return new Konva.Rect({
            x: this.conversionManager.stageWidth - StaticMeasurements.scrollbarWidth,
            y: 0,
            width: StaticMeasurements.scrollbarWidth,
            height: this.conversionManager.stageHeight,
            fill: Colours.grayscale[6]
        });
    }

    private constructVerticalThumb() : Konva.Rect {
        const verticalThumb = new Konva.Rect({
            x: this.conversionManager.stageWidth - 20,
            y: StaticMeasurements.scrollbarGutter,
            width: 16,
            height: StaticMeasurements.scrollbarThumbLength,
            fill: Colours.grayscale[3],
            cornerRadius: 3,
            draggable: true,
            dragBoundFunc: pos => {
                pos.x = this.conversionManager.stageWidth - 20,
                pos.y = clamp(
                    pos.y, 
                    StaticMeasurements.scrollbarGutter,
                    this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth - StaticMeasurements.scrollbarThumbLength - StaticMeasurements.scrollbarGutter 
                );
                return pos;
            }
        });
        verticalThumb.on('dragmove', e => {
            const yPos = e.target.attrs.y - StaticMeasurements.scrollbarGutter;
            const yDecimal = yPos / this.verticalThumbMovementRange;
            const newLayerY = (-1 * yDecimal * this.verticalScrollRange) + this.conversionManager.seekerAreaHeight;
            this.scrollManager.y = newLayerY;
        });
        return verticalThumb
    }

    private constructHorizontalTrack() : Konva.Rect {
        return new Konva.Rect({
            x: 0,
            y: this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth,
            width: this.conversionManager.stageWidth,
            height: StaticMeasurements.scrollbarWidth,
            fill: Colours.grayscale[6]
        });
    }

    private constructHorizontalThumb() : Konva.Rect {
        const horizontalThumb = new Konva.Rect({
            x: StaticMeasurements.scrollbarGutter,
            y: this.conversionManager.stageHeight - 20,
            width: StaticMeasurements.scrollbarThumbLength,
            height: 16,
            fill: Colours.grayscale[3],
            cornerRadius: 3,
            draggable: true,
            dragBoundFunc: pos => {
                pos.y = this.conversionManager.stageHeight - 20;
                pos.x = clamp(
                    pos.x,
                    StaticMeasurements.scrollbarGutter,
                    this.conversionManager.stageWidth - StaticMeasurements.scrollbarWidth - StaticMeasurements.scrollbarThumbLength - StaticMeasurements.scrollbarGutter
                );
                return pos;
            }
        });
        horizontalThumb.on('dragmove', e => {
            const xPos = e.target.attrs.x - StaticMeasurements.scrollbarGutter;
            const xDecimal = xPos / this.horizontalThumbMovementRange;
            const newLayerX = (-1 * xDecimal * this.horizontalScrollRange) + StaticMeasurements.pianoKeyWidth;
            this.scrollManager.x = newLayerX;
        });
        return horizontalThumb;
    }

    redrawOnVerticalResize() : void {
        // calculate scroll position as decimal and multiply by the total movement range of the 
        // thumb to get its new position.
        const scrollPositionAsDecimal = Math.abs(this.scrollManager.y / this.verticalScrollRange);
        const newThumbY = this.verticalThumbMovementRange * scrollPositionAsDecimal + StaticMeasurements.scrollbarGutter;
        // Update the thumb with the newly calculate position, and update various other elements
        // according to the new stage height
        this.verticalThumb.y(newThumbY);
        this.horizontalTrack.y(this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth);
        this.horizontalThumb.y(this.conversionManager.stageHeight - 20);
        this.verticalTrack.height(this.conversionManager.stageHeight);
        this.layer.batchDraw();
        
    }

    redrawOnHorizontalResize() : void {
        // calculate scroll position as decimal and multiply by the total movement range of the 
        // thumb to get its new position.
        const scrollPositionAsDecimal = Math.abs((this.scrollManager.x - StaticMeasurements.pianoKeyWidth) / this.horizontalScrollRange);
        const newThumbX = this.horizontalThumbMovementRange * scrollPositionAsDecimal + StaticMeasurements.scrollbarGutter;
        // Update the thumb with the newly calculate position, and update various other elements
        // according to the new stage height
        this.horizontalThumb.x(newThumbX);
        this.horizontalTrack.width(this.conversionManager.stageWidth);
        this.verticalTrack.x(this.conversionManager.stageWidth - StaticMeasurements.scrollbarWidth);
        this.verticalThumb.x(this.conversionManager.stageWidth - 20);
        this.layer.batchDraw();
    }

    syncHorizontalThumbToScrollPosition() : void {
        const scrollPositionAsDecimal = Math.abs((this.scrollManager.x - StaticMeasurements.pianoKeyWidth) / this.horizontalScrollRange);
        const newThumbX = this.horizontalThumbMovementRange * scrollPositionAsDecimal + StaticMeasurements.scrollbarGutter;
        this.horizontalThumb.x(newThumbX);
        this.layer.batchDraw();
    }

    syncVerticalThumbToScrollPosition() : void {
        const scrollPositionAsDecimal = Math.abs(this.scrollManager.y / this.verticalScrollRange);
        const newThumbY = this.verticalThumbMovementRange * scrollPositionAsDecimal + StaticMeasurements.scrollbarGutter;
        this.verticalThumb.y(newThumbY);
        this.layer.batchDraw();
    }
    
}
