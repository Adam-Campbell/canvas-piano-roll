import Konva from 'konva';
import AbstractGridEntities from '../../common/AbstractGridEntities';
import ArrangerConversionManager from '../ArrangerConversionManager';
import { StaticMeasurements } from '../../Constants';
import { 
    SerializedAudioEngineState,
    SerializedChannelState,
    SerializedSectionState
} from '../../AudioEngine/AudioEngineConstants';
import { getBarNumFromBBSString } from '../arrangerUtils';

export default class ArrangerSections extends AbstractGridEntities {

    constructor(conversionManager: ArrangerConversionManager, layerRef: Konva.Layer) {
        super(conversionManager, layerRef, StaticMeasurements.channelInfoColWidth);
    }

    addNew(x: number, y: number, id: string, width?: number) : Konva.Rect {
        const newEntity = this.produce(
            x,
            y,
            width || this.conversionManager.colWidth,
            id,
            true
        );
        newEntity.moveTo(this.entitiesContainer);
        this.layer.batchDraw();
        return newEntity;
    }

    shiftVertically(entitiesArray: Konva.Rect[], shouldShiftUp: boolean) : void {
        const shiftDelta = shouldShiftUp ? 
            this.conversionManager.rowHeight * -1 :
            this.conversionManager.rowHeight;
        entitiesArray.forEach(entity => {
            entity.y(
                entity.y() + shiftDelta
            );
        });
        this.layer.batchDraw();
        this.updateAttributeCaches(entitiesArray);
    }

    shiftHorizontally(entitiesArray: Konva.Rect[], shouldShiftLeft: boolean) : void {
        const shiftDelta = shouldShiftLeft ? 
            this.conversionManager.colWidth * -1 :
            this.conversionManager.colWidth;
        entitiesArray.forEach(entity => {
            entity.x(
                entity.x() + shiftDelta
            );
        });
        this.layer.batchDraw();
        this.updateAttributeCaches(entitiesArray);
    }

    forceToState(state: SerializedAudioEngineState) : Konva.Rect[] {
        // remove all current section rects from layer
        // iterate over each channel
        // for each channel...
            // iterate over every section for that channel and create a rect on
            // this layer, the x being derived from the sections start, the width being
            // derived from the sections numBars, and the y being derived from the idx
            // of the outer loop.
        const entities = [];
        this.entitiesContainer.destroyChildren();
        state.channels.forEach((channel: SerializedChannelState, idx) => {
            const entityY = idx * this.conversionManager.rowHeight;
            Object.values(channel.sections)
            .forEach((section: SerializedSectionState) => {
                const entityX = getBarNumFromBBSString(section.start) * this.conversionManager.colWidth;
                const entityWidth = section.numBars * this.conversionManager.colWidth;
                const entityId = section.id;
                const entity = this.produce(
                    entityX,
                    entityY,
                    entityWidth,
                    entityId,
                    false
                );
                entity.moveTo(this.entitiesContainer);
                entities.push(entity);
            });
        });
        this.layer.batchDraw();
        return entities;
    }

}