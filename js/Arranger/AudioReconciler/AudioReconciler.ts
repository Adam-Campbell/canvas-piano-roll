import Konva from 'konva';
import ArrangerConversionManager from '../ArrangerConversionManager';
import AudioEngine from '../../AudioEngine';
import { SerializedSectionState, NoteCache } from '../../AudioEngine/AudioEngineConstants';


export default class AudioReconciler {

    private conversionManager: ArrangerConversionManager;
    private audioEngine: AudioEngine;

    constructor(conversionManager: ArrangerConversionManager, audioEngine: AudioEngine) {
        this.conversionManager = conversionManager;
        this.audioEngine = audioEngine; 
    }

    /**
     * Adds a section to the audio engine derived from the supplied section element. Checks the audio
     * engine to determine if a section with a matching id already exists and if so, it copies that
     * sections notes before deleting the older section.
     */
    addSection(sectionElement: Konva.Rect) : void {
        // From the sectionElement, derive the start, numBars, channelIdx and id for the new
        // section. 
        const start = `${sectionElement.x() / this.conversionManager.colWidth}:0:0`;
        const numBars = sectionElement.width() / this.conversionManager.colWidth;
        const channelIdx = sectionElement.y() / this.conversionManager.rowHeight;
        const id = sectionElement.id();

        const existingNotesData = this.getNotesDataAndCleanup(id);

        this.audioEngine.channels[channelIdx].addSection(start, numBars, id, existingNotesData);
    }

    /**
     * If a section matching the given id exists in the audio engine this method will copy its notes
     * data and then delete it. 
     */
    private getNotesDataAndCleanup(id: string) : NoteCache {
        for (const channel of this.audioEngine.channels) {
            const sectionData = channel.getDataForSection(id);
            if (sectionData !== null) {
                channel.removeSection(id);
                return sectionData.notes;
            }
        }
        return {};
    }

    /**
     * Adds a section to the audio engine based on serialized section state rather than deriving
     * it from a section element. 
     */
    addSectionFromSerializedState(serializedState: SerializedSectionState) {
        this.audioEngine.channels[serializedState.channelIdx].addSection(
            serializedState.start,
            serializedState.numBars,
            serializedState.id,
            serializedState.notes
        );
    }

    /**
     * Takes the id from the supplied section element and removes the section with the same id from
     * the audio engine, if it exists. 
     */
    removeSection(sectionElement: Konva.Rect) : void {
        const id = sectionElement.id();
        const channel = this.audioEngine.channels.find(c => Boolean(c.sectionCache[id]));
        if (channel) {
            channel.removeSection(id);
        }
    }

}
