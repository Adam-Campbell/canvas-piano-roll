import Konva from 'konva';
import { Colours } from '../../Constants';

export default abstract class AbstractGridEntities {

    protected conversionManager: any;
    protected layer: Konva.Layer;
    protected entitiesContainer: Konva.Group;

    constructor(conversionManager: any, layerRef: Konva.Layer, leftPanelWidth: number) {
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

    updateX(x: number) : void {
        this.entitiesContainer.x(x);
        this.layer.batchDraw();
    }

    updateY(y: number) : void {
        this.entitiesContainer.y(y);
        this.layer.batchDraw();
    }

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

    abstract addNew(x: number, y: number, id: string, width?: number) : Konva.Rect;

    protected updateSingleEntityLength(entity: Konva.Rect, xDelta: number) : void {
        const newWidth = Math.max(
            entity.attrs.cachedWidth + xDelta,
            this.conversionManager.colWidth
        );
        entity.width(newWidth);
    }

    updateLengths(originX: number, terminalX: number, entitiesArray: Konva.Rect[]) : void {
        const xDelta = this.conversionManager.roundToGridCol(
            terminalX - originX
        );
        entitiesArray.forEach(entity => {
            this.updateSingleEntityLength(entity, xDelta);
        });
        this.layer.batchDraw();
    }

    updateAttributeCaches(entitiesArray: Konva.Rect[]) : void {
        entitiesArray.forEach(entity => {
            entity.setAttr('cachedWidth', entity.attrs.width);
            entity.setAttr('cachedX', entity.attrs.x);
            entity.setAttr('cachedY', entity.attrs.y);
        });
    }



    delete(entitiesArray: Konva.Rect[]) : void {
        entitiesArray.forEach(entity => entity.destroy());
        this.layer.batchDraw();
    }

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

    clearSelectionMarquee() : void {
        const marquee = this.layer.findOne('#MARQUEE');
        if (marquee) {
            marquee.destroy();
            this.layer.batchDraw();
        }
    }

    addSelectedAppearance(entity: Konva.Rect) : void {
        entity.fill(Colours.grayscale[6]);
        this.layer.batchDraw();
    }

    removeSelectedAppearance(entity: Konva.Rect) : void {
        entity.fill(Colours.primary.main);
        this.layer.batchDraw();
    } 

    abstract forceToState(state: any) : Konva.Rect[];

}