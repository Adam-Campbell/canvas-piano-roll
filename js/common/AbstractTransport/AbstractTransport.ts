import Konva from 'konva';
import { 
    Colours,
    ConversionManager
} from '../../Constants';


export default abstract class AbstractTransport {

    protected conversionManager: ConversionManager;
    protected layer: Konva.Layer;
    protected layerGroup: Konva.Group;
    protected background: Konva.Rect;
    protected border: Konva.Rect;
    protected numberMarkersArray: Konva.Text[];
    protected playbackMarker: Konva.RegularPolygon;

    constructor(conversionManager: ConversionManager, layerRef: Konva.Layer, leftPanelOffset: number) {
        this.conversionManager = conversionManager;
        this.layer = layerRef;
        this.layerGroup = new Konva.Group({
            x: leftPanelOffset
        });
        this.background = this.constructBackground();
        this.border = this.constructBorder();
        this.numberMarkersArray = this.constructNumberMarkersArray();
        this.playbackMarker = this.constructPlaybackMarker();
    }

    /**
     * Adds the necessary elements to the layer and then redraws it. 
     */
    init() : void {
        this.background.moveTo(this.layerGroup);
        this.border.moveTo(this.layerGroup);
        this.numberMarkersArray.forEach(marker => marker.moveTo(this.layerGroup));
        this.playbackMarker.moveTo(this.layerGroup);
        this.layer.add(this.layerGroup);
        this.layer.batchDraw();
    }

    /**
     * Updates the position of the transport area along the x axis. 
     */
    updateX(x) : void {
        this.layerGroup.x(x);
        this.layer.batchDraw();
    }

    /**
     * The implementation of this method should calculate and return the distance, in px, that should
     * separate each of the numeric labels in the transport area.
     */
    abstract get numberMarkerSpacing() : number;

    /**
     * Constructs and returns the background for the transport area.
     */
    private constructBackground() : Konva.Rect {
        const background = new Konva.Rect({
            x: 0,
            y: 0,
            height: 30,
            width: this.conversionManager.gridWidth,
            fill: Colours.grayscale[2]
        });
        return background;
    }

    /**
     * Constructs and returns the border for the transport area.
     */
    private constructBorder() : Konva.Rect {
        const border = new Konva.Rect({
            x: 0,
            y: 27,
            width: this.conversionManager.gridWidth,
            height: 3,
            fill: Colours.grayscale[7]
        });
        return border;
    }

    /**
     * Constructs and returns an array containing the numeric labels for the transport area.
     */
    private constructNumberMarkersArray() : Konva.Text[] {
        let numberMarkersArray = [];
        for (let i = 0; i < this.conversionManager.numBars; i++) {
            const numberMarker = new Konva.Text({
                text: `${i+1}`,
                fill: Colours.grayscale[7],
                x: i * this.numberMarkerSpacing,
                y: 12
            });
            if (i < 0) {
                numberMarker.x(
                    numberMarker.x() - numberMarker.width() / 2
                );
            }
            numberMarkersArray.push(numberMarker);
        }
        return numberMarkersArray;
    }

    /**
     * Constructs and returns the playback marker for the transport area. 
     */
    private constructPlaybackMarker() : Konva.RegularPolygon {
        const marker = new Konva.RegularPolygon({
            sides: 3,
            fill: '#fff',
            x: 0,
            y: 3,
            radius: 6,
            rotation: 180
        });
        return marker;
    }

    /**
     * Performs the necessary recalculations when the zoom level of the parent stage updates, and then
     * redraws the layer. 
     */
    redrawOnZoomAdjustment(isZoomingIn: boolean) : void {
        this.background.width(this.conversionManager.gridWidth);
        this.border.width(this.conversionManager.gridWidth);
        this.numberMarkersArray.forEach((numberMarker, idx) => {
            numberMarker.x(idx * this.numberMarkerSpacing);
        });
        const multiplier = isZoomingIn ? 2 : 0.5;
        this.playbackMarker.x(
            this.playbackMarker.x() * multiplier
        );
        this.layer.batchDraw();
    }

    /**
     * Repositions the playback marker along the x axis according to the tick value supplied.  
     */
    repositionPlaybackMarker(ticks: number) : void {
        this.playbackMarker.x(
            this.conversionManager.convertTicksToPx(ticks)
        );
        this.layer.batchDraw();
    }

}
