import Konva from 'konva';
import Tone from 'tone';
import AbstractGridEntities from '../../common/AbstractGridEntities';
import { StaticMeasurements, NoteBBS } from '../../Constants';
import { SerializedSectionState } from '../../AudioEngine/AudioEngineConstants';

export default class PianoRollNotes extends AbstractGridEntities {

    constructor(conversionManager: any, layerRef: Konva.Layer) {
        super(conversionManager, layerRef, StaticMeasurements.pianoKeyWidth);
    }

    addNew(x: number, y: number, id: string, width?: number) : Konva.Rect {
        const newEntity = this.produce(
            x,
            y,
            width || this.conversionManager.noteWidth,
            id,
            true
        );
        newEntity.moveTo(this.entitiesContainer);
        this.layer.batchDraw();
        return newEntity;
    }

    moveToContainer(entity: Konva.Rect) : void {
        entity.moveTo(this.entitiesContainer);
        this.layer.batchDraw();
    }

    shiftUp(entitiesArray: Konva.Rect[], shiftAmount: number) : void {
        entitiesArray.forEach(entity => {
            entity.y(
                entity.y() - shiftAmount
            );
        });
        this.layer.batchDraw();
        this.updateAttributeCaches(entitiesArray);
    }

    shiftDown(entitiesArray: Konva.Rect[], shiftAmount: number) : void {
        entitiesArray.forEach(entity => {
            entity.y(
                entity.y() + shiftAmount
            );
        });
        this.layer.batchDraw();
        this.updateAttributeCaches(entitiesArray);
    }

    shiftLeft(entitiesArray: Konva.Rect[]) : void {
        entitiesArray.forEach(entity => {
            entity.x(
                entity.x() - this.conversionManager.colWidth
            );
        });
        this.layer.batchDraw();
        this.updateAttributeCaches(entitiesArray);
    }

    shiftRight(entitiesArray: Konva.Rect[]) : void {
        entitiesArray.forEach(entity => {
            entity.x(
                entity.x() + this.conversionManager.colWidth
            );
        });
        this.layer.batchDraw();
        this.updateAttributeCaches(entitiesArray);
    }

    forceToState(state: SerializedSectionState) : Konva.Rect[] {
        // delete all note elements currently on the layer
        this.entitiesContainer.destroyChildren();
        // delete marquee element if exists
        const marqueeElement = this.layer.findOne('#MARQUEE');
        if (marqueeElement) {
            marqueeElement.destroy();
        }

        // Create Konva.Rect instances from the notes data and add them to canvas, draw
        // layer and then return the newly created Konva.Rects.
        const entities = Object.values(state.notes).map((note: NoteBBS) => {
            const entityX = this.conversionManager.convertTicksToPx(
                Tone.Ticks(note.time).toTicks()
            );
            const entityWidth = this.conversionManager.convertTicksToPx(
                Tone.Ticks(note.duration).toTicks()
            );
            const entityY = this.conversionManager.deriveYFromPitch(note.note);
            const entityId = note.id;
            const entity = this.produce(
                entityX,
                entityY,
                entityWidth,
                entityId,
                false
            );
            entity.moveTo(this.entitiesContainer);
            return entity;
        });
        this.layer.batchDraw();
        return entities;
    }



}