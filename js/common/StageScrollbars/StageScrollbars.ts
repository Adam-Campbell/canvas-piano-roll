import Konva from 'konva';
import { 
    Colours,
    StaticMeasurements,
    ConversionManager
} from '../../Constants';
import { clamp } from '../../utils';
import StageScrollManager from '../StageScrollManager';

export default class StageScrollbars {

    protected conversionManager: ConversionManager;
    private scrollManager: StageScrollManager;
    private leftPanelWidth: number;
    private layer: Konva.Layer;
    private layerGroup: Konva.Group;
    private verticalTrack: Konva.Rect;
    private verticalThumb: Konva.Rect;
    private horizontalTrack: Konva.Rect;
    private horizontalThumb: Konva.Rect;

    constructor(
        scrollManager: StageScrollManager,
        conversionManager: ConversionManager,
        layerRef: Konva.Layer,
        leftPanelWidth: number
    ) {
        this.conversionManager = conversionManager;
        this.scrollManager = scrollManager;
        this.leftPanelWidth = leftPanelWidth;
        this.layer = layerRef;
        this.layerGroup = new Konva.Group();
        this.verticalTrack = this.constructVerticalTrack();
        this.verticalThumb = this.constructVerticalThumb();
        this.horizontalTrack = this.constructHorizontalTrack();
        this.horizontalThumb = this.constructHorizontalThumb(); 
    }

    /**
     * Adds the necessary elements to the layer, redraws it and registers event subscriptions. 
     */
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

    /**
     * Registers internal event subscriptions - events raised by layerGroup.
     */
    private registerGroupEventSubscriptions() : void {
        this.layerGroup.on('mousedown', e => {
            e.cancelBubble = true;
        });
        this.layerGroup.on('touchstart', e => {
            e.cancelBubble = true;
        });
    }

    /**
     * Calculates and returns the current vertical scroll range, which is equal to the combined heights of 
     * all stage elements that participate in vertical scrolling minus the height of the stage.
     */
    get verticalScrollRange() : number {
        return Math.max(
            this.conversionManager.gridHeight + StaticMeasurements.scrollbarWidth + this.conversionManager.seekerAreaHeight - this.conversionManager.stageHeight,
            0
        );
    }

    /**
     * Calculates and returns the current vertical thumb movement range, which is the distance between the
     * top-most point of the thumb when it is at the start of its movement range, and the same point of
     * the thumb when it is at the end of its movement range.
     */
    get verticalThumbMovementRange() : number {
        return this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth - StaticMeasurements.scrollbarThumbLength - (StaticMeasurements.scrollbarGutter * 2);
    }

    /**
     * Returns a boolean indicating whether vertical scrolling should be permitted at the current time.
     */
    get shouldAllowVerticalScrolling() : boolean {
        return this.verticalScrollRange > 0;
    }

    /**
     * Calculates and returns the current horizontal scroll range, which is equal to the combined widths of 
     * all stage elements that participate in horizontal scrolling minus the width of the stage.
     */
    get horizontalScrollRange() : number {
        return Math.max(
            this.conversionManager.gridWidth + StaticMeasurements.scrollbarWidth + this.leftPanelWidth - this.conversionManager.stageWidth,
            0
        );
    }

    /**
     * Calculates and returns the current horizontal thumb movement range, which is the distance between the
     * left-most point of the thumb when it is at the start of its movement range, and the same point of
     * the thumb when it is at the end of its movement range.
     */
    get horizontalThumbMovementRange() : number {
        return this.conversionManager.stageWidth - StaticMeasurements.scrollbarWidth - StaticMeasurements.scrollbarThumbLength - (StaticMeasurements.scrollbarGutter * 2)
    }

    /**
     * Returns a boolean indicating whether horizontal scrolling should be permitted at the current time.
     */
    get shouldAllowHorizontalScrolling() : boolean {
        return this.horizontalScrollRange > 0;
    }

    /**
     * Constructs and returns the track for the vertical scrollbar.
     */
    private constructVerticalTrack() : Konva.Rect {
        return new Konva.Rect({
            x: this.conversionManager.stageWidth - StaticMeasurements.scrollbarWidth,
            y: 0,
            width: StaticMeasurements.scrollbarWidth,
            height: this.conversionManager.stageHeight,
            fill: Colours.grayscale[6]
        });
    }

    /**
     * Constructrs and returns the thumb for the vertical scrollbar
     */
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

    /**
     * Constructs and returns the track for the horizontal scrollbar.
     */
    private constructHorizontalTrack() : Konva.Rect {
        return new Konva.Rect({
            x: 0,
            y: this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth,
            width: this.conversionManager.stageWidth,
            height: StaticMeasurements.scrollbarWidth,
            fill: Colours.grayscale[6]
        });
    }

    /**
     * Constructs and returns the thumb for the horiztonal scrollbar.
     */
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
            const newLayerX = (-1 * xDecimal * this.horizontalScrollRange) + this.leftPanelWidth;
            this.scrollManager.x = newLayerX;
        });
        return horizontalThumb;
    }

    /**
     * Makes the necessary adjustments when the height of the stage has changed. 
     */
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

    /**
     * Makes the necessary adjustments when the width of the stage has changed.
     */
    redrawOnHorizontalResize() : void {
        if (this.shouldAllowHorizontalScrolling) {
            // The main method that calls this one already ensures that the scroll position is a legal value
            // within the scroll range, so here we can simply map the position in the scroll range to a position
            // in the thumb movement range to get the new thumb position.
            const scrollPositionAsDecimal = (this.scrollManager.x - this.leftPanelWidth) * -1 / this.horizontalScrollRange;
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

    /**
     * Uses redrawOnVerticalResize and redrawOnHorizontalResize to make the necessary adjustments
     * whenever the size of the stage has changed. 
     */
    redrawOnResize() {
        this.redrawOnHorizontalResize();
        this.redrawOnVerticalResize();
    }

    /**
     * Ensures that the horizontal thumb is positioned correctly to match the current scroll of the stage.
     */
    syncHorizontalThumb() : void {
        if (this.shouldAllowHorizontalScrolling) {
            const scrollPositionAsDecimal = (this.scrollManager.x - this.leftPanelWidth) * -1 / this.horizontalScrollRange;
            const newThumbPosition = (scrollPositionAsDecimal * this.horizontalThumbMovementRange) + StaticMeasurements.scrollbarGutter;
            this.horizontalThumb.x(newThumbPosition);
            this.horizontalThumb.show();
        } else {
            this.horizontalThumb.hide();
        }
        this.layer.batchDraw();
    }

    /**
     * Ensures that the vertical thumb is positioned correctly to match the current scroll of the stage.
     */
    syncVerticalThumb() : void {
        if (this.shouldAllowVerticalScrolling) {
            const scrollPositionAsDecimal = (this.scrollManager.y - this.conversionManager.seekerAreaHeight) * -1 / this.verticalScrollRange;
            const newThumbPosition = (scrollPositionAsDecimal * this.verticalThumbMovementRange) + StaticMeasurements.scrollbarGutter;
            this.verticalThumb.y(newThumbPosition);
            this.verticalThumb.show();
        } else {
            this.verticalThumb.hide();
        }
        this.layer.batchDraw();
    }

}