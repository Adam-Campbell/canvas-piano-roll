import Konva from 'konva';
import { Colours, ConversionManager } from '../../Constants';

/**
 * This class deals with the management of rectangles on a grid and handles the logic for adding,
 * removing, repositioning and otherwise manipulating these rectangles. Exactly what these rectangles
 * represent is dependent on context, for example in the PianoRoll the rectangles will represent notes,
 * in the Arranger the rectangles will represent sections of the track.
 */
export default abstract class AbstractGridEntities {

    protected conversionManager: ConversionManager;
    protected layer: Konva.Layer;
    protected entitiesContainer: Konva.Group;

    constructor(conversionManager: ConversionManager, layerRef: Konva.Layer, leftPanelWidth: number) {
        this.conversionManager = conversionManager;
        this.layer = layerRef;
        this.entitiesContainer = new Konva.Group({ 
            y: this.conversionManager.seekerAreaHeight,
            x: leftPanelWidth
        });
    }
    
    init() : void {
        this.layer.add(this.entitiesContainer);
    }

    /**
     * Adjusts the position of all entities along the x axis.
     */
    updateX(x: number) : void {
        this.entitiesContainer.x(x);
        this.layer.batchDraw();
    }

    /**
     * Adjusts the position of all entities along the y axis.
     */
    updateY(y: number) : void {
        this.entitiesContainer.y(y);
        this.layer.batchDraw();
    }

    /**
     * Performs the necessary recalculations when the zoom level of the parent stage changes, and 
     * then redraws the layer.
     */
    redrawOnZoomAdjustment(isZoomingIn: boolean) : void {
        const entities = this.entitiesContainer.find('.STAGE_ENTITY');
        const multiplier = isZoomingIn ? 2 : 0.5;
        entities.forEach(entity => {
            entity.x(
                entity.x() * multiplier
            );
            entity.width(
                entity.width() * multiplier
            );
            entity.setAttr(
                'cachedX', 
                entity.attrs.cachedX * multiplier
            );
            entity.setAttr(
                'cachedWidth',
                entity.attrs.cachedWidth * multiplier
            );
        });
        this.layer.batchDraw();
    }

    /**
     * Produces and returns a new grid entity but does not add it to the layer. 
     */
    produce(x: number, y: number, width: number, id: string, isSelected: boolean) : Konva.Rect {
        return new Konva.Rect({
            x,
            y,
            width,
            height: this.conversionManager.rowHeight,
            fill: isSelected ? Colours.grayscale[6] : Colours.primary.main,
            stroke: Colours.grayscale[7],
            strokeWidth: 1,
            cornerRadius: 2,
            id,
            cachedWidth: width,
            cachedX: x, 
            cachedY: y,
            name: 'STAGE_ENTITY'
        });
    }

    /**
     * The implementation of this method should create a new grid entity using the produce method
     * configured with specific arguments. It should then add the newly produced grid entity to the
     * layer and return it. 
     */
    abstract addNew(x: number, y: number, id: string, width?: number) : Konva.Rect;

    /**
     * Updates the width of a single entity.
     */
    protected updateSingleEntityWidth(entity: Konva.Rect, xDelta: number) : void {
        const newWidth = Math.max(
            entity.attrs.cachedWidth + xDelta,
            this.conversionManager.colWidth
        );
        entity.width(newWidth);
    }

    /**
     * Updates the width of multiple entities based on a delta calculated from the x
     * coords supplied.
     */
    updateWidths(originX: number, terminalX: number, entitiesArray: Konva.Rect[]) : void {
        const xDelta = this.conversionManager.roundToGridCol(
            terminalX - originX
        );
        entitiesArray.forEach(entity => {
            this.updateSingleEntityWidth(entity, xDelta);
        });
        this.layer.batchDraw();
    }

    /**
     * Updates the `cached` namespaced attributes for the given entities to match their 
     * counterparts. The `cached` attributes are used to keep a reference to the last stable size and
     * position of an entity that can be referenced during resize/reposition operations when the 
     * actual size and position is repeatedly changing. This method is called at the end of such
     * operations to match up the `cached` attributes to the new stable size and position.
     */
    updateAttributeCaches(entitiesArray: Konva.Rect[]) : void {
        entitiesArray.forEach(entity => {
            entity.setAttr('cachedWidth', entity.attrs.width);
            entity.setAttr('cachedX', entity.attrs.x);
            entity.setAttr('cachedY', entity.attrs.y);
        });
    }

    /**
     * Deletes the given entities from the layer and then redraws it.
     */
    delete(entitiesArray: Konva.Rect[]) : void {
        entitiesArray.forEach(entity => entity.destroy());
        this.layer.batchDraw();
    }

    /**
     * Updates the position of the given entities based on the x and y deltas provided. 
     */
    updatePositions(xDelta: number, yDelta: number, entitiesArray: Konva.Rect[]) : void {
        entitiesArray.forEach(entity => {
            const { cachedX, cachedY } = entity.attrs;
            const newX = Math.max(
                cachedX + xDelta,
                0
            );
            const newY = Math.max(
                cachedY + yDelta,
                0
            );
            entity.x(newX);
            entity.y(newY);
        });
        this.layer.batchDraw();
    }

    /**
     * Updates the selection marquee with the x and y coordinates supplied. If there was no selection
     * marquee present on the layer when called, then this method creates one. 
     */
    updateSelectionMarquee(originX: number, originY: number, terminalX: number, terminalY: number) : void {
        const marquee = this.layer.findOne('#MARQUEE');
        if (!marquee) {
            const newMarquee = new Konva.Rect({
                x: originX,
                y: originY,
                width: terminalX - originX,
                height: terminalY - originY,
                fill: Colours.tertiary.main,
                opacity: 0.4,
                id: 'MARQUEE'
            });
            newMarquee.moveTo(this.entitiesContainer);
        } else {
            marquee.x(originX);
            marquee.y(originY);
            marquee.width(terminalX - originX);
            marquee.height(terminalY - originY);
        }
        this.layer.batchDraw();
    }

    /**
     * Clears the selection marquee from the layer if one is present.
     */
    clearSelectionMarquee() : void {
        const marquee = this.layer.findOne('#MARQUEE');
        if (marquee) {
            marquee.destroy();
            this.layer.batchDraw();
        }
    }

    /**
     * Adds a distinct appearance to an entity indicating that it is currently selected, then redraws 
     * the layer.
     */
    addSelectedAppearance(entity: Konva.Rect) : void {
        entity.fill(Colours.grayscale[6]);
        this.layer.batchDraw();
    }

    /**
     * Removes the selected appearance from an entity and then redraws the layer.
     */
    removeSelectedAppearance(entity: Konva.Rect) : void {
        entity.fill(Colours.primary.main);
        this.layer.batchDraw();
    } 

    /**
     * The implementation of this method should take a serialized state and update the entities to match
     * that state.
     */
    abstract forceToState(state: any) : Konva.Rect[];

}
