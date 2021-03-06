import { genId } from '../../genId';
import Konva from 'konva';
import ArrangerConversionManager from '../ArrangerConversionManager';
import AudioEngine from '../../AudioEngine';
import { SerializedSectionState } from '../../AudioEngine/AudioEngineConstants';
import { getBarNumFromBBSString } from '../arrangerUtils';
import { Clipboard } from '../../Constants';


export default class ArrangerClipboard implements Clipboard<SerializedSectionState> {

    private conversionManager: ArrangerConversionManager;
    private audioEngine: AudioEngine;
    private serializedEntities: SerializedSectionState[] = [];

    constructor(conversionManager: ArrangerConversionManager, audioEngine: AudioEngine) {
        this.conversionManager = conversionManager;
        this.audioEngine = audioEngine;
    }

    /**
     * Adds data to the clipboard derived from the given sectionElements. This is destructive and 
     * will replace whatever was there previously. 
     */
    add(sectionElements: Konva.Rect[]) {
        // iterate through the section elements
        // for each, find the corresponding section in audioEngine, and grab its serialized state
        // store this serialized data in sectionsData along with the channelIdx for each section, 
        // derived from the y() value of sectionElement
        this.serializedEntities = sectionElements.map(sectionElement => {
            const channelIdx = sectionElement.y() / this.conversionManager.rowHeight;
            const sectionId = sectionElement.id();
            const sectionData = this.audioEngine.channels[channelIdx].getDataForSection(sectionId);
            return {
                ...sectionData,
                channelIdx
            };
        });
    }

    /**
     * Produce and return new section data based on the previously copied data and the currentBar 
     * (the new sections will maintain the same positions relative to each other, but as a group
     * they will be positioned relative to currentBar).
     */
    produceCopy(currentBar: number) : SerializedSectionState[] {
        // Iterate over the sections data to get the earliest time value found in any of the sections. The delta
        // between this earliest time value and the time value for a given section will be combined with the
        // currentBar to calculate the new time value for the copy being produced. 
        let earliestStartBar = null;
        this.serializedEntities.forEach(sectionObject => {
            const startBar = getBarNumFromBBSString(sectionObject.start);
            if (earliestStartBar === null || startBar < earliestStartBar) {
                earliestStartBar = startBar;
            }
        });
        // Then map over the sections data and produce a copy with a new id and start value. 

        return this.serializedEntities.map(sectionObject => {
            let newNotes = {};
            Object.values(sectionObject.notes).forEach(noteObject => {
                const newId = genId();
                newNotes[newId] = {
                    ...noteObject,
                    id: newId
                };
            });
            const startBar = getBarNumFromBBSString(sectionObject.start);
            const newStartBarNum = currentBar + (startBar - earliestStartBar);
            const newStartBBS = `${newStartBarNum}:0:0`;
            
            return {
                ...sectionObject,
                id: genId(),
                start: newStartBBS,
                notes: newNotes
            };
        }); 
    }

}

