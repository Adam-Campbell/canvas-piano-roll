import { genId } from '../../genId';
import Konva from 'konva';
import ConversionManager from '../ConversionManager';
//import { Note } from '../../Constants';
import AudioEngine from '../../AudioEngine';
import { SerializedSectionState } from '../../AudioEngine/AudioEngineConstants';
import { getBarNumFromBBSString } from '../arrangerUtils';


export default class Clipboard {

    private conversionManager: ConversionManager;
    private audioEngine: AudioEngine;
    //private notesData: Note[] = [];
    private sectionsData: SerializedSectionState[] = [];

    constructor(conversionManager: ConversionManager, audioEngine: AudioEngine) {
        this.conversionManager = conversionManager;
        this.audioEngine = audioEngine;
    }

    add(sectionElements) {
        // iterate through the section elements
        // for each, find the corresponding section in audioEngine, and grab its serialized state
        // store this serialized data in sectionsData along with the channelIdx for each section, 
        // derived from the y() value of sectionElement
        this.sectionsData = sectionElements.map(sectionElement => {
            const channelIdx = sectionElement.y() / this.conversionManager.rowHeight;
            const sectionId = sectionElement.id();
            const sectionData = this.audioEngine.channels[channelIdx].getDataForSection(sectionId);
            return {
                ...sectionData,
                channelIdx
            };
        });
    }

    // add(noteElements: Konva.Rect[], velocityMarkerElements: Konva.Rect[]) : void {
    //     // use noteElements in conjunction with velocityMarkerElements to produce plain data
    //     // describing the copied notes, in the same vein as the note objects used by the audio
    //     // reconciler. So the shape:

    //     // { note, time, duration, velocity, id }

    //     // Store this data in this._noteData
    //     const newNotesData = noteElements.map(noteElement => {
    //         const velocityMarkerElement = velocityMarkerElements.find(el => { 
    //             return el.getAttr('id') === noteElement.getAttr('id');
    //         });
    //         const velocity = velocityMarkerElement.attrs.height / (this.conversionManager.velocityAreaHeight - 10);
    //         const { x, y, width, id } = noteElement.attrs;
    //         const note = this.conversionManager.derivePitchFromY(y);
    //         const time = this.conversionManager.convertPxToTicks(x);
    //         const duration = this.conversionManager.convertPxToTicks(width);
    //         return {
    //             note,
    //             time, 
    //             duration,
    //             velocity,
    //             id
    //         };
    //     });

    //     this.notesData = newNotesData;
    // }

    produceCopy(currentBar: number) : SerializedSectionState[] {
        // Iterate over the sections data to get the earliest time value found in any of the sections. The delta
        // between this earliest time value and the time value for a given section will be combined with the
        // currentBar to calculate the new time value for the copy being produced. 
        let earliestStartBar = null;
        this.sectionsData.forEach(sectionObject => {
            const startBar = getBarNumFromBBSString(sectionObject.start);
            if (earliestStartBar === null || startBar < earliestStartBar) {
                earliestStartBar = startBar;
            }
        });
        // Then map over the sections data and produce a copy with a new id and start value. 

        // ATTENTION - need to also iterate over the notes (keep in mind they are keys on an object)
        // and give each note a new id so that no two notes anywhere in the application have the same
        // id. 
        return this.sectionsData.map(sectionObject => {
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

