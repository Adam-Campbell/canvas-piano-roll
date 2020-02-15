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

    constructor(
        scrollManager: ScrollManager,
        conversionManager: ConversionManager, 
        layerRef: Konva.Layer, 
    ) {
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
        if (!this.shouldAllowVerticalScrolling) {
            this.verticalThumb.hide();
        }
        if (!this.shouldAllowHorizontalScrolling) {
            this.horizontalThumb.hide();
        }
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
        return Math.max(
            this.conversionManager.gridHeight + StaticMeasurements.scrollbarWidth + this.conversionManager.seekerAreaHeight - this.conversionManager.stageHeight,
            0
        );
    }

    get verticalThumbMovementRange() : number {
        return this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth - StaticMeasurements.scrollbarThumbLength - (StaticMeasurements.scrollbarGutter * 2);
    }

    get shouldAllowVerticalScrolling() : boolean {
        //return this.conversionManager.stageHeight < this.verticalScrollRange;
        return this.verticalScrollRange > 0;
    }

    get horizontalScrollRange() : number {
        return Math.max(
            this.conversionManager.gridWidth - this.conversionManager.stageWidth + StaticMeasurements.scrollbarWidth + StaticMeasurements.channelInfoColWidth,
            0
        );
    }

    get horizontalThumbMovementRange() : number {
        return this.conversionManager.stageWidth - StaticMeasurements.scrollbarWidth - StaticMeasurements.scrollbarThumbLength - (StaticMeasurements.scrollbarGutter * 2)
    }

    get shouldAllowHorizontalScrolling() : boolean {
        //return this.conversionManager.stageWidth < this.horizontalScrollRange;
        return this.horizontalScrollRange > 0;
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
            //const newLayerX = (-1 * xDecimal * this.horizontalScrollRange) + StaticMeasurements.pianoKeyWidth;
            const newLayerX = (-1 * xDecimal * this.horizontalScrollRange) + StaticMeasurements.channelInfoColWidth;
            this.scrollManager.x = newLayerX;
        });
        return horizontalThumb;
    }

    redrawOnVerticalResize() : void {
        if (this.shouldAllowVerticalScrolling) {
            // The main method that calls this one already ensures that the scroll position is a legal value
            // within the scroll range, so here we can simply map the position in the scroll range to a position
            // in the thumb movement range to get the new thumb position.
            const scrollPositionAsDecimal = (this.scrollManager.y - this.conversionManager.seekerAreaHeight) * -1 / this.verticalScrollRange;
            const newThumbPosition = (scrollPositionAsDecimal * this.verticalThumbMovementRange) + StaticMeasurements.scrollbarGutter;
            this.verticalThumb.y(newThumbPosition);
            this.verticalThumb.show();
        } else {
            this.verticalThumb.hide();
        }
        // In addition to the vertical thumb, we must also update the position of the horizontal track and
        //  thumb, and the length of the vertical track. 
        this.horizontalTrack.y(this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth);
        this.horizontalThumb.y(this.conversionManager.stageHeight - 20);
        this.verticalTrack.height(this.conversionManager.stageHeight); 
    }

    redrawOnHorizontalResize() : void {
        if (this.shouldAllowHorizontalScrolling) {
            // The main method that calls this one already ensures that the scroll position is a legal value
            // within the scroll range, so here we can simply map the position in the scroll range to a position
            // in the thumb movement range to get the new thumb position.
            const scrollPositionAsDecimal = (this.scrollManager.x - StaticMeasurements.channelInfoColWidth) * -1 / this.horizontalScrollRange;
            const newThumbPosition = (scrollPositionAsDecimal * this.horizontalThumbMovementRange) + StaticMeasurements.scrollbarGutter;
            this.horizontalThumb.x(newThumbPosition);
            this.horizontalThumb.show();
        } else {
            this.horizontalThumb.hide();
        }
        // In addition to the horizontal thumb, we must also update the position of the vertical track and 
        // thumb, and the length of the horizontal track. 
        this.horizontalTrack.width(this.conversionManager.stageWidth);
        this.verticalTrack.x(this.conversionManager.stageWidth - StaticMeasurements.scrollbarWidth);
        this.verticalThumb.x(this.conversionManager.stageWidth - 20);
        
    }

    redrawOnResize() {
        this.redrawOnHorizontalResize();
        this.redrawOnVerticalResize();
    }

    syncHorizontalThumbToScrollPosition() : void {
        //const scrollPositionAsDecimal = Math.abs((this.scrollManager.x - StaticMeasurements.pianoKeyWidth) / this.horizontalScrollRange);
        const scrollPositionAsDecimal = Math.abs((this.scrollManager.x - StaticMeasurements.channelInfoColWidth) / this.horizontalScrollRange);
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
