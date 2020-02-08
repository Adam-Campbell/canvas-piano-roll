import Tone from 'tone';
import Konva from 'konva';
import EventEmitter from '../EventEmitter';
import ConversionManager from './ConversionManager';
import AudioReconciler from './AudioReconciler';
import NoteSelection from './NoteSelection';
import KeyboardStateManager from './KeyboardStateManager';
import MouseStateManager from './MouseStateManager';
import CanvasElementCache from './CanvasElementCache';
import HistoryStack from './HistoryStack';
import Clipboard from './Clipboard';
import ScrollManager from './ScrollManager';

import GridLayer from './GridLayer';
import NoteLayer from './NoteLayer';
import VelocityLayer from './VelocityLayer';
import TransportLayer from './TransportLayer';
import SeekerLineLayer from './SeekerLineLayer';
import PianoKeyLayer from './PianoKeyLayer';
import ScrollbarLayer from './ScrollbarLayer';
import ContextMenuLayer from './ContextMenuLayer';
import { 
    DragModes,
    Tools,
    Events,
    StaticMeasurements,
    SerializedState,
    KonvaEvent,
    PianoRollOptions
} from '../Constants';
import { 
    // canShiftUp,
    // canShiftDown,
    // canShiftLeft,
    // canShiftRight,
    easingFns
} from './pianoRollUtils';
import { genId } from '../genId';
import { 
    clamp, 
    pipe, 
    doesOverlap,
    canShiftUp,
    canShiftDown,
    canShiftLeft,
    canShiftRight, 
} from '../utils';
import { pitchesArray } from '../pitches';
import { chordType } from '@tonaljs/chord-dictionary';

enum NudgeDirections {
    horizontal = 'horizontal',
    vertical = 'vertical',
    both = 'both'
}

enum EasingModes {
    linear = 'linear',
    easeIn = 'easeIn',
    easeOut = 'easeOut',
    easeInOut = 'easeInOut'
}

export default class PianoRoll {

    private dragMode: DragModes;
    private activeTool: Tools;
    private previousBumpTimestamp: number;
    private chordType: string;
    private playbackFromTicks: number;
    private stage: Konva.Stage;
    private noteCache: CanvasElementCache;
    private velocityMarkerCache: CanvasElementCache;
    private keyboardStateManager: KeyboardStateManager;
    private mouseStateManager: MouseStateManager;
    private conversionManager: ConversionManager;
    private audioReconciler: AudioReconciler;
    private noteSelection: NoteSelection;
    private historyStack: HistoryStack;
    private clipboard: Clipboard;
    private primaryBackingLayer: Konva.Layer;
    private secondaryBackingLayer: Konva.Layer;
    private gridLayer: GridLayer;
    private noteLayer: NoteLayer;
    private velocityLayer: VelocityLayer;
    private transportLayer: TransportLayer;
    private seekerLineLayer: SeekerLineLayer;
    private pianoKeyLayer: PianoKeyLayer;
    private contextMenuLayer: ContextMenuLayer;
    private scrollManager: ScrollManager;
    private scrollbarLayer: ScrollbarLayer;
    private emitter: EventEmitter;
    private unsubscribeFns: Function[] = [];

    constructor(eventEmitter: EventEmitter) {
        // Initialize class properties
        window.pianoRoll = this;
        this.dragMode = null;
        this.activeTool = Tools.cursor;
        this.previousBumpTimestamp = null;
        this.chordType = 'major';
        this.playbackFromTicks = 0;
        this.emitter = eventEmitter;
        this.historyStack = new HistoryStack({ notes: [], selectedNoteIds: [] });
    }

    init(pianoRollOptions: PianoRollOptions) : void {
        this.instantiateChildClasses(pianoRollOptions);
        this.stage.add(this.primaryBackingLayer);
        this.stage.add(this.seekerLineLayer.layer);
        this.stage.add(this.secondaryBackingLayer);
        this.gridLayer.init();
        this.noteLayer.init();
        this.velocityLayer.init();
        this.transportLayer.init();
        this.pianoKeyLayer.init();
        this.scrollbarLayer.init();
        this.seekerLineLayer.init();
        this.registerStageSubscriptions();
        this.registerKeyboardSubscriptions();
        this.registerGlobalEventSubscriptions();
        // const initialNotes = pianoRollOptions.section.serializeState().notes.map(note => {
        //     // return {
        //     //     ...note,
        //     //     time: Tone.Ticks(note.time).toTicks(),
        //     //     duration: Tone.Ticks(note.duration).toTicks()
        //     // }
        // })
        // const notes = pianoRollOptions.section.serializeState().notes;
        //console.log(notes);
        const notes = Object.values(pianoRollOptions.section.serializeState().notes)
        .map(note => ({
            ...note,
            time: Tone.Ticks(note.time).toTicks(),
            duration: Tone.Ticks(note.duration).toTicks()
        }));
        //console.log(notes);
        this.forceToState({ notes, selectedNoteIds: [] });
    }

    private instantiateChildClasses({
        container, 
        initialWidth, 
        initialHeight, 
        initialQuantize, 
        initialNoteDuration, 
        numBars,
        section,
        livePlayInstrument
    }: PianoRollOptions) : void {
        // Instantiate canvas stage
        this.stage = new Konva.Stage({
            container,
            width: initialWidth,
            height: initialHeight
        });
        // Instantiate non canvas layer related classes
        this.noteCache = new CanvasElementCache();
        this.velocityMarkerCache = new CanvasElementCache();
        this.keyboardStateManager = new KeyboardStateManager(this.stage.container());
        this.mouseStateManager = new MouseStateManager();
        this.conversionManager = new ConversionManager(
            initialWidth, 
            initialHeight,
            this.emitter,
            initialQuantize,
            initialNoteDuration,
            numBars
        );
        this.audioReconciler = new AudioReconciler(this.conversionManager, section);
        this.noteSelection = new NoteSelection();
        this.clipboard = new Clipboard(this.conversionManager);
        // Instantiate canvas layer related classes
        this.primaryBackingLayer = new Konva.Layer();
        this.secondaryBackingLayer = new Konva.Layer();
        this.gridLayer = new GridLayer(this.conversionManager, this.primaryBackingLayer, this.emitter);
        this.noteLayer = new NoteLayer(this.conversionManager, this.primaryBackingLayer);
        this.velocityLayer = new VelocityLayer(this.conversionManager, this.primaryBackingLayer);
        this.transportLayer = new TransportLayer(this.conversionManager, this.primaryBackingLayer);
        this.seekerLineLayer = new SeekerLineLayer(this.conversionManager);
        this.pianoKeyLayer = new PianoKeyLayer(
            this.conversionManager, 
            this.secondaryBackingLayer,
            livePlayInstrument
        );
        this.contextMenuLayer = new ContextMenuLayer(this.conversionManager, this.secondaryBackingLayer);
        this.scrollManager = new ScrollManager(
            this.gridLayer,
            this.noteLayer,
            this.velocityLayer,
            this.pianoKeyLayer,
            this.transportLayer,
            this.seekerLineLayer
        );
        this.scrollbarLayer = new ScrollbarLayer(
            this.scrollManager,
            this.conversionManager,
            this.secondaryBackingLayer
        );
    }

    private registerStageSubscriptions() : void {
        this.stage.on('mousedown', e => this.handleInteractionStart(e));
        this.stage.on('mousemove', e => this.handleInteractionUpdate(e));
        this.stage.on('mouseup', e => this.handleInteractionEnd(e));
        this.stage.on('touchstart', e => this.handleInteractionStart(e));
        this.stage.on('touchmove', e => this.handleInteractionUpdate(e));
        this.stage.on('touchend', e => this.handleInteractionEnd(e));
        this.stage.on('contextmenu', e => this.handleContextMenu(e));
        this.stage.on('dblclick', e => this.handleDoubleClick(e));
    }

    private registerKeyboardSubscriptions() : void {
        this.keyboardStateManager.addKeyListener('Delete', () => this.deleteSelectedNotes());
        this.keyboardStateManager.addKeyListener('1', () => {
            if (this.keyboardStateManager.altKey) {
                this.emitter.emit(Events.activeToolUpdate, 'cursor');
            }
        });
        this.keyboardStateManager.addKeyListener('2', () => {
            if (this.keyboardStateManager.altKey) {
                this.emitter.emit(Events.activeToolUpdate, 'pencil');
            }
        });
        this.keyboardStateManager.addKeyListener('3', () => {
            if (this.keyboardStateManager.altKey) {
                this.emitter.emit(Events.activeToolUpdate, 'marquee');
            }
        });
        this.keyboardStateManager.addKeyListener('ArrowUp', () => {
            if (this.keyboardStateManager.altKey) {
                this.moveUpwardsThroughInversions();
            } else {
                this.shiftSelectionUp(
                    this.keyboardStateManager.shiftKey
                );
            }
        });
        this.keyboardStateManager.addKeyListener('ArrowDown', () => {
            if (this.keyboardStateManager.altKey) {
                this.moveDownwardsThroughInversions();
            } else {
                this.shiftSelectionDown(
                    this.keyboardStateManager.shiftKey
                );
            }
        });
        this.keyboardStateManager.addKeyListener('ArrowLeft', () => this.shiftSelectionLeft());
        this.keyboardStateManager.addKeyListener('ArrowRight', () => this.shiftSelectionRight());
        this.keyboardStateManager.addKeyListener('z', () => this.keyboardStateManager.ctrlKey && this.undo());
        this.keyboardStateManager.addKeyListener('y', () => this.keyboardStateManager.ctrlKey && this.redo());
        this.keyboardStateManager.addKeyListener('x', () => this.keyboardStateManager.ctrlKey && this.cut());
        this.keyboardStateManager.addKeyListener('c', () => this.keyboardStateManager.ctrlKey && this.copy());
        this.keyboardStateManager.addKeyListener('v', () => this.keyboardStateManager.ctrlKey && this.paste());
        this.keyboardStateManager.addKeyListener('c', () => {
            this.keyboardStateManager.altKey && this.constructChordsFromSelectedRootNotes();
        });
        this.keyboardStateManager.addKeyListener('i', () => {
            this.keyboardStateManager.altKey && this.handleZoomAdjustment(true);
        });
        this.keyboardStateManager.addKeyListener('o', () => {
            this.keyboardStateManager.altKey && this.handleZoomAdjustment(false);
        });
        this.keyboardStateManager.addKeyListener('m', () => {
            this.scrollManager.x = this.scrollManager.x - 100;
        });
        this.keyboardStateManager.addKeyListener(' ', () => this.handleTogglePlayback());
    }

    private registerGlobalEventSubscriptions() : void {
        this.emitter.subscribe(Events.activeToolUpdate, tool => {
            this.activeTool = tool;
            console.log(this.activeTool);
        });
        this.emitter.subscribe(Events.chordTypeUpdate, chordType => {
            this.chordType = chordType;
        });
        this.emitter.subscribe(Events.undoAction, () => this.undo());
        this.emitter.subscribe(Events.redoAction, () => this.redo());
        this.emitter.subscribe(Events.copyToClipboard, () => this.copy());
        this.emitter.subscribe(Events.cutToClipboard, () => this.cut());
        this.emitter.subscribe(Events.pasteFromClipboard, () => this.paste());
        
        //window.addEventListener('resize', e => this.handleResize(e));
    }

    cleanup() {
        this.stage.destroy();
    }

    private handleZoomAdjustment(isZoomingIn: boolean) : void {
        const zoomLevels = [0.125, 0.25, 0.5, 1];
        const currentZoomIdx = zoomLevels.indexOf(this.conversionManager.tickToPxRatio);
        const newZoomIdx = clamp(
            isZoomingIn ? currentZoomIdx + 1 : currentZoomIdx - 1,
            0,
            zoomLevels.length - 1
        );
        if (currentZoomIdx !== newZoomIdx) {
            const newZoomLevel = zoomLevels[newZoomIdx];
            this.conversionManager.tickToPxRatio = newZoomLevel;
            this.gridLayer.redrawOnZoomAdjustment();
            this.noteLayer.redrawOnZoomAdjustment(isZoomingIn);
            this.velocityLayer.redrawOnZoomAdjustment(isZoomingIn);
            this.transportLayer.redrawOnZoomAdjustment(isZoomingIn);
            this.seekerLineLayer.redrawOnZoomAdjustment();
        }
    }

    handleResize(containerWidth: number, containerHeight: number) : void {
        // grab clientWidth and clientHeight from event

        // if clientWidth not equals stageWidth
            // update stage width
            // if new clientWidth would expose stage OOB
                // adjust x scroll accordingly
            // call method to update scrollbar layer horizontally
        // if clientHeight not equals stageHeight
            // update stage height
            // if new clientHeight would expose stage OOB
                // adjust y scroll accordingly
            // call method to update scrollbar layer vertically
        //const window = e.target;
        //const { clientWidth, clientHeight } = window.document.documentElement;

        if (containerWidth !== this.conversionManager.stageWidth) {
            this.conversionManager.stageWidth = containerWidth;
            this.stage.width(containerWidth);
            const willExposeOutOfBounds = this.scrollManager.x * -1 > this.conversionManager.gridWidth + StaticMeasurements.scrollbarWidth - containerWidth;
            if (willExposeOutOfBounds) {
                const newXScroll = (-1 * (this.scrollbarLayer.horizontalScrollRange)) + StaticMeasurements.pianoKeyWidth;
                this.scrollManager.x = newXScroll;
            }
            
        }
        // if (clientHeight - 50 !== this.conversionManager.stageHeight) {
        //     this.conversionManager.stageHeight = clientHeight - 50;
        //     this.stage.height(clientHeight - 50);
        //     const willExposeOutOfBounds = this.scrollManager.y * -1 >= this.scrollbarLayer.verticalScrollRange;
        //     if (willExposeOutOfBounds) {
        //         const newYScroll = (-1 * this.scrollbarLayer.verticalScrollRange) + this.conversionManager.seekerAreaHeight;
        //         this.scrollManager.y = newYScroll;
        //     }
        // }
        if (containerHeight !== this.conversionManager.stageHeight) {
            this.conversionManager.stageHeight = containerHeight;
            this.stage.height(containerHeight);
            const willExposeOutOfBounds = this.scrollManager.y * -1 >= this.scrollbarLayer.verticalScrollRange;
            if (willExposeOutOfBounds) {
                const newYScroll = (-1 * this.scrollbarLayer.verticalScrollRange) + this.conversionManager.seekerAreaHeight;
                this.scrollManager.y = newYScroll;
            }
        }
        this.velocityLayer.redrawOnVerticalResize();
        this.scrollbarLayer.redrawOnHorizontalResize();
        this.scrollbarLayer.redrawOnVerticalResize();
        this.pianoKeyLayer.redrawOnVerticalResize();
    }

    private handleTogglePlayback() : void {
        if (Tone.Transport.state === 'started') {
            if (this.keyboardStateManager.shiftKey) {
                Tone.Transport.pause();
            } else {
                Tone.Transport.stop();
                Tone.Transport.ticks = this.playbackFromTicks;
            }
        } else {
            Tone.Transport.start();
        }
    }

    // Valid values for nudgeDirection are 'BOTH', 'VERTICAL' and 'HORIZONTAL'
    private nudgeGridIfRequired(
        x: number, 
        y: number, 
        nudgeDirection: NudgeDirections = NudgeDirections.both
    ) : void {
        const now = Date.now();
        if (now - this.previousBumpTimestamp <= 67) {
            return;
        }
        this.previousBumpTimestamp = now;
        const triggerThreshold = 24;
        
        if (nudgeDirection === NudgeDirections.both || nudgeDirection === NudgeDirections.horizontal) {
            const isAtLeftEdge = x < StaticMeasurements.pianoKeyWidth + triggerThreshold;
            const isAtRightEdge = this.conversionManager.stageWidth - StaticMeasurements.scrollbarWidth - x < triggerThreshold;
            if (isAtLeftEdge) {
                const scrollLimit = StaticMeasurements.pianoKeyWidth;
                this.scrollManager.x = Math.min(scrollLimit, this.scrollManager.x + 100);
                this.scrollbarLayer.syncHorizontalThumbToScrollPosition();
            } else if (isAtRightEdge) {
                const scrollLimit = -1 * (this.conversionManager.gridWidth - this.conversionManager.stageWidth + StaticMeasurements.scrollbarWidth);
                this.scrollManager.x = Math.max(scrollLimit, this.scrollManager.x - 100);
                this.scrollbarLayer.syncHorizontalThumbToScrollPosition();
            }
        }

        if (nudgeDirection === NudgeDirections.both || nudgeDirection === NudgeDirections.vertical) {
            const isAtTopEdge = y < this.conversionManager.seekerAreaHeight + triggerThreshold;
            const isAtBottomEdge = this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth - this.conversionManager.velocityAreaHeight - y < triggerThreshold;
            if (isAtTopEdge) {
                const scrollLimit = this.conversionManager.seekerAreaHeight;
                this.scrollManager.y = Math.min(scrollLimit, this.scrollManager.y + 100);
                this.scrollbarLayer.syncVerticalThumbToScrollPosition();
            } else if (isAtBottomEdge) {
                const scrollLimit = -1 * (
                    this.conversionManager.gridHeight - this.conversionManager.stageHeight + 
                    StaticMeasurements.scrollbarWidth + this.conversionManager.velocityAreaHeight
                );
                this.scrollManager.y = Math.max(scrollLimit, this.scrollManager.y - 100);
                this.scrollbarLayer.syncVerticalThumbToScrollPosition();
            }
        }
    }

    private serializeState() : void {
        // grab all of the noteElements
        // grab all of the velocityMarkerElements
        // for each pair of noteElement & velocityMarkerElement, produce a plain object
        // representing that note. 
        // grab the ids of all selected notes. 
        // use all of this information to produce the complete serialized state. Return it. 

        const serializedNotes = this.noteCache.retrieveAll().map(noteElement => {
            const velocityMarkerElement = this.velocityMarkerCache.retrieveOne(
                noteElement.attrs.id
            );
            return {
                note: this.conversionManager.derivePitchFromY(noteElement.attrs.y),
                time: this.conversionManager.convertPxToTicks(noteElement.attrs.x),
                duration: this.conversionManager.convertPxToTicks(noteElement.attrs.width),
                velocity: velocityMarkerElement.attrs.velocity,
                id: noteElement.attrs.id
            }
        });
        
        const selectedNoteIds = this.noteSelection.retrieveAll();
        const serializedState = {
            notes: serializedNotes,
            selectedNoteIds
        };
        
        this.historyStack.addEntry(serializedState);
    }

    private forceToState(state: SerializedState) : void {
        const noteElements = this.noteLayer.forceToState(state);
        const velocityMarkerElements = this.velocityLayer.forceToState(state);
        this.noteCache.forceToState(noteElements);
        this.velocityMarkerCache.forceToState(velocityMarkerElements);
        this.noteSelection.forceToState(state.selectedNoteIds);
        this.audioReconciler.forceToState(state.notes);
    }

    private addNoteToAudioEngine(noteId: string) : void {
        const noteElement = this.noteCache.retrieveOne(noteId);
        const velocityMarkerElement = this.velocityMarkerCache.retrieveOne(noteId);
        console.log(noteElement, velocityMarkerElement);
        this.audioReconciler.addNote(noteElement, velocityMarkerElement);
    }

    private addNewNote(x: number, y: number, width?: number) : Konva.Rect {
        const id = genId();
        const newNote = this.noteLayer.addNewNote(x, y, id, width);
        const newVelocityMarker = this.velocityLayer.addNewVelocityMarker(x, id);
        this.noteCache.add(newNote);
        this.velocityMarkerCache.add(newVelocityMarker);
        this.noteSelection.add(newNote);
        return newNote;
    }    

    private deleteSelectedNotes() : void {
        const selectedNoteIds = this.noteSelection.retrieveAll();
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this.velocityMarkerCache.retrieve(selectedNoteIds);
        this.noteLayer.deleteNotes(selectedNoteElements);
        this.velocityLayer.deleteVelocityMarkers(selectedVelocityMarkerElements);
        this.noteSelection.clear();
        selectedNoteElements.forEach(el => this.noteCache.remove(el));
        selectedVelocityMarkerElements.forEach(el => this.velocityMarkerCache.remove(el));
        this.audioReconciler.removeNotes(selectedNoteIds);
        this.serializeState();
    }

    private clearSelection() : void {
        const selectedNoteIds = this.noteSelection.retrieveAll();
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this.velocityMarkerCache.retrieve(selectedNoteIds);
        selectedNoteElements.forEach(el => this.noteLayer.removeSelectedAppearance(el));
        selectedVelocityMarkerElements.forEach(el => this.velocityLayer.removeSelectedAppearance(el));
        this.noteSelection.clear();
    }

    private addNoteToSelection(noteElement: Konva.Rect) : void {
        this.noteSelection.add(noteElement);
        const velocityMarkerElement = this.velocityMarkerCache.retrieveOne(noteElement.attrs.id);
        this.noteLayer.addSelectedAppearance(noteElement);
        this.velocityLayer.addSelectedAppearance(velocityMarkerElement);
    }

    private removeNoteFromSelection(noteElement: Konva.Rect) : void {
        this.noteSelection.remove(noteElement);
        const velocityMarkerElement = this.velocityMarkerCache.retrieveOne(noteElement.attrs.id);
        this.noteLayer.removeSelectedAppearance(noteElement);
        this.velocityLayer.removeSelectedAppearance(velocityMarkerElement);
    }

    private reconcileNoteSelectionWithSelectionArea(
        selectionX1: number, 
        selectionY1: number, 
        selectionX2: number, 
        selectionY2: number
    ) : void {
        const allNotes = this.noteCache.retrieveAll();

        allNotes.forEach(noteRect => {
            const { x, y, width, height } = noteRect.attrs;
            const noteX1 = x;
            const noteX2 = x + width;
            const noteY1 = y;
            const noteY2 = y + height;
            const overlapsWithSelection = doesOverlap(
                noteX1,
                noteX2,
                noteY1,
                noteY2,
                selectionX1,
                selectionX2,
                selectionY1,
                selectionY2
            );
            const isSelected = this.noteSelection.has(noteRect);
            if (overlapsWithSelection && !isSelected) {
                    this.addNoteToSelection(noteRect);
            } else if (!overlapsWithSelection && isSelected) {
                this.removeNoteFromSelection(noteRect);
            }
        });
    }

    private shiftSelectionUp(shiftByOctave: boolean) : void {
        const shiftAmount = shiftByOctave ? 
            this.conversionManager.rowHeight * 12 : 
            this.conversionManager.rowHeight;
        const selectedNoteIds = this.noteSelection.retrieveAll();
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        if (canShiftUp(selectedNoteElements, shiftAmount)) {
            this.noteLayer.shiftNotesUp(selectedNoteElements, shiftAmount);
            selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
            this.serializeState();
        }
    }

    private shiftSelectionDown(shiftByOctave: boolean) : void {
        const shiftAmount = shiftByOctave ?
            this.conversionManager.rowHeight * 12 :
            this.conversionManager.rowHeight;
        const selectedNoteIds = this.noteSelection.retrieveAll();
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        if (canShiftDown(selectedNoteElements, this.conversionManager.gridHeight, shiftAmount)) {
            this.noteLayer.shiftNotesDown(selectedNoteElements, shiftAmount);
            selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
            this.serializeState();
        }
    }

    private shiftSelectionLeft() : void {
        const selectedNoteIds = this.noteSelection.retrieveAll();
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this.velocityMarkerCache.retrieve(
            selectedNoteIds
        );
        if (canShiftLeft(selectedNoteElements)) {
            this.noteLayer.shiftNotesLeft(selectedNoteElements);
            this.velocityLayer.shiftVelocityMarkersLeft(selectedVelocityMarkerElements);
            selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
            this.serializeState();
        }
    }

    private shiftSelectionRight() : void {
        const selectedNoteIds = this.noteSelection.retrieveAll();
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this.velocityMarkerCache.retrieve(
            selectedNoteIds
        );
        if (canShiftRight(selectedNoteElements, this.conversionManager.gridWidth, this.conversionManager.colWidth)) {
            this.noteLayer.shiftNotesRight(selectedNoteElements);
            this.velocityLayer.shiftVelocityMarkersRight(selectedVelocityMarkerElements);
            selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
            this.serializeState();
        }
    }

    private moveUpwardsThroughInversions() : void {
        const noteElements = this.noteCache.retrieve(
            this.noteSelection.retrieveAll()
        );

        const sortedNotesAndRowIndexes = noteElements.map(noteElement => {
            return {
                noteElement,
                rowIndex: Math.floor(noteElement.y() / this.conversionManager.rowHeight)
            }
        })
        .sort((a,b) => {
            if (a.rowIndex < b.rowIndex) {
                return 1;
            } else if (a.rowIndex > b.rowIndex) {
                return -1;
            } else {
                return 0;
            }
        });

        const noteElementToUpdate = sortedNotesAndRowIndexes[0].noteElement;
        let newY = null;

        for (let currNote of sortedNotesAndRowIndexes) {
            const isTaken = sortedNotesAndRowIndexes.find(el => el.rowIndex === currNote.rowIndex - 12);
            if (currNote.rowIndex >= 12 && !isTaken) {
                newY = (currNote.rowIndex - 12) * this.conversionManager.rowHeight;
                break;
            }
        }
        
        if (newY === null) {
            return;
        }

        noteElementToUpdate.y(newY);
        this.primaryBackingLayer.batchDraw();
        this.noteLayer.updateNotesAttributeCaches([ noteElementToUpdate ]);
        this.addNoteToAudioEngine(noteElementToUpdate.id());
        this.serializeState();
    }

    private moveDownwardsThroughInversions() : void {
        const noteElements = this.noteCache.retrieve(
            this.noteSelection.retrieveAll()
        );

        const sortedNotesAndRowIndexes = noteElements.map(noteElement => {
            return {
                noteElement,
                rowIndex: Math.floor(noteElement.y() / this.conversionManager.rowHeight)
            }
        })
        .sort((a,b) => {
            if (a.rowIndex < b.rowIndex) {
                return -1;
            } else if (a.rowIndex > b.rowIndex) {
                return 1;
            } else {
                return 0;
            }
        });

        const noteElementToUpdate = sortedNotesAndRowIndexes[0].noteElement;
        let newY = null;

        for (let currNote of sortedNotesAndRowIndexes) {
            const isTaken = sortedNotesAndRowIndexes.find(el => el.rowIndex === currNote.rowIndex + 12);
            if (currNote.rowIndex + 12 < pitchesArray.length && !isTaken) {
                newY = (currNote.rowIndex + 12) * this.conversionManager.rowHeight;
                break;
            }
        }
        
        if (newY === null) {
            return;
        }

        noteElementToUpdate.y(newY);
        this.primaryBackingLayer.batchDraw();
        this.noteLayer.updateNotesAttributeCaches([ noteElementToUpdate ]);
        this.addNoteToAudioEngine(noteElementToUpdate.id());
        this.serializeState();
    }

    private constructChordFromRootNote(rootNote: Konva.Rect, relativePositions: number[]) : void {
        const rootX = rootNote.x();
        const rootY = rootNote.y();
        const rootWidth = rootNote.width();

        relativePositions.forEach(relPos => {
            const note = this.addNewNote(
                rootX,
                rootY - relPos * this.conversionManager.rowHeight,
                rootWidth
            );
            this.addNoteToAudioEngine(note.id());
        });
    }

    private constructChordsFromSelectedRootNotes() : void {
        const { chroma } = chordType(this.chordType);
        let relativePositions = [];
        chroma.split('').forEach((binary, idx) => {
            if (parseInt(binary) && idx > 0) {
                relativePositions.push(idx);
            }
        });
        const selectedNotes = this.noteCache.retrieve(
            this.noteSelection.retrieveAll()
        );
        selectedNotes.forEach(note => this.constructChordFromRootNote(note, relativePositions));
        this.serializeState();
    }

    private undo() : void {
        if (!this.historyStack.isAtStart) {
            const nextState = this.historyStack.goBackwards();
            this.forceToState(nextState);
        }
    }

    private redo() : void {
        if (!this.historyStack.isAtEnd) {
            const nextState = this.historyStack.goForwards();
            this.forceToState(nextState);
        }
    }

    private copy() : void {
        const selectedNoteIds = this.noteSelection.retrieveAll();
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this.velocityMarkerCache.retrieve(selectedNoteIds);
        this.clipboard.add(selectedNoteElements, selectedVelocityMarkerElements);
    }

    private cut() : void {
        this.copy();
        this.deleteSelectedNotes();
    }

    private paste() : void {
        const currentQuantizeAsTicks = this.conversionManager.convertPxToTicks(
            this.conversionManager.colWidth
        );
        const roundedStartTime = this.conversionManager.round(
            Tone.Transport.ticks,
            currentQuantizeAsTicks
        );
        const newNoteData = this.clipboard.produceCopy(roundedStartTime);
        this.clearSelection();
        newNoteData.forEach(noteObject => {
            const noteElement = this.noteLayer.createNoteElement(
                this.conversionManager.convertTicksToPx(noteObject.time),
                this.conversionManager.deriveYFromPitch(noteObject.note),
                this.conversionManager.convertTicksToPx(noteObject.duration),
                noteObject.id,
                true
            );
            this.noteLayer.moveNoteToNotesContainer(noteElement);
            this.noteCache.add(noteElement);
            const velocityMarkerHeight = noteObject.velocity * (this.conversionManager.velocityAreaHeight - 10);
            const velocityMarkerElement = this.velocityLayer.createVelocityMarker(
                this.conversionManager.convertTicksToPx(noteObject.time),
                this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth - velocityMarkerHeight,
                velocityMarkerHeight,
                noteObject.id,
                true,
                noteObject.velocity
            );
            this.velocityMarkerCache.add(velocityMarkerElement);
            this.audioReconciler.addNote(noteElement, velocityMarkerElement);
            this.noteSelection.add(noteElement);
        });
        //this._noteLayer.layer.batchDraw();
        this.primaryBackingLayer.batchDraw();
        this.serializeState();
    }

    private handleContextMenu(e: KonvaEvent) : void {
        const { rawX, rawY, target } = this.extractInfoFromEventObject(e);
        e.evt.preventDefault();
        const isVelocityAreaClick = this.conversionManager.stageHeight - rawY <= this.conversionManager.velocityAreaHeight + StaticMeasurements.scrollbarWidth;
        const targetIsNote = target.name() === 'NOTE';
        if (isVelocityAreaClick) {
            this.addVelocityContextMenu(rawX, rawY);
        } else if (targetIsNote) {
            this.addNoteContextMenu(rawX, rawY);
        } else {
            this.addGridContextMenu(rawX, rawY);
        }
    }

    private addVelocityContextMenu(rawX: number, rawY: number) : void {
        const menuItems = [
            { 
                label: 'Humanize',
                callback: () => this.humanizeSelection() 
            },
            { 
                label: 'Transform - linear',
                callback: () => this.transformSelection(EasingModes.linear) 
            },
            { 
                label: 'Transform - ease in',
                callback: () => this.transformSelection(EasingModes.easeIn)
            },
            { 
                label: 'Transform - ease out',
                callback: () => this.transformSelection(EasingModes.easeOut) 
            },
            { 
                label: 'Transform - ease in out',
                callback: () => this.transformSelection(EasingModes.easeInOut) 
            }
        ];
        this.contextMenuLayer.addContextMenu({ rawX, rawY, menuItems });
    }

    private addGridContextMenu(rawX: number, rawY: number) : void {
        const menuItems = [
            {
                label: 'Zoom in',
                callback: () => this.handleZoomAdjustment(true)
            },
            {
                label: 'Zoom out',
                callback: () => this.handleZoomAdjustment(false)
            },
            {
                label: 'Paste',
                callback: () => this.paste()
            },
            {
                label: this.gridLayer.shouldDisplayScaleHighlighting ? 'Hide scale highlighting' : 'Show scale highlighting',
                callback: () => this.gridLayer.toggleScaleHighlights()
            }
        ];
        this.contextMenuLayer.addContextMenu({ rawX, rawY, menuItems });
    }

    private addNoteContextMenu(rawX: number, rawY: number) : void {
        const menuItems = [
            {
                label: 'Cut',
                callback: () => this.cut()
            },
            {
                label: 'Copy',
                callback: () => this.copy()
            },
            {
                label: 'Delete',
                callback: () => this.deleteSelectedNotes()
            },
            {
                label: 'Generate chord',
                callback: () => this.constructChordsFromSelectedRootNotes()
            }
        ];
        this.contextMenuLayer.addContextMenu({ rawX, rawY, menuItems });
    }

    private extractInfoFromEventObject(e: KonvaEvent) : {
        isTouchEvent : boolean,
        target: any,
        rawX: number,
        rawY: number
    } {
        const { evt, target } = e;
        const isTouchEvent = Boolean(evt.touches);
        let rawX;
        let rawY;
        if (isTouchEvent) {
            const { clientX, clientY } = evt.touches[0];
            const { top, left } = this.stage.container().getBoundingClientRect();
            rawX = clientX - left;
            rawY = clientY - top;
        } else {
            rawX = evt.offsetX;
            rawY = evt.offsetY;
        }
        return {
            isTouchEvent,
            target,
            rawX, 
            rawY
        }
    }

    private handleDoubleClick(e: KonvaEvent) : void {
        const { rawX, rawY } = this.extractInfoFromEventObject(e);
        const isTransportAreaClick = rawY <= 30;
        if (isTransportAreaClick) {
            const roundedX = this.conversionManager.roundDownToGridCol(
                rawX - this.scrollManager.x
            );
            const positionAsTicks = this.conversionManager.convertPxToTicks(roundedX);
            this.playbackFromTicks = positionAsTicks;
            this.transportLayer.repositionPlaybackMarker(positionAsTicks);
        }
    }

    private handleInteractionStart(e: KonvaEvent) : void {
        this.contextMenuLayer.removeContextMenu();
        if (e.evt.button !== 0) {
            return;
        }
        const { rawX, rawY, isTouchEvent, target } = this.extractInfoFromEventObject(e);
        const xWithScroll = rawX - this.scrollManager.x;
        const yWithScroll = rawY - this.scrollManager.y;
        const roundedX = this.conversionManager.roundDownToGridCol(xWithScroll);
        const roundedY = this.conversionManager.roundDownToGridRow(yWithScroll);

        const isVelocityAreaClick = this.conversionManager.stageHeight - rawY <= this.conversionManager.velocityAreaHeight + StaticMeasurements.scrollbarWidth;
        const isTransportAreaClick = rawY <= 30;
        this.mouseStateManager.addMouseDownEvent(xWithScroll, yWithScroll);

        if (isTransportAreaClick) {
            const positionAsTicks = this.conversionManager.convertPxToTicks(roundedX);
            const positionAsBBS = Tone.Ticks(positionAsTicks).toBarsBeatsSixteenths();
            Tone.Transport.position = positionAsBBS;
            this.seekerLineLayer.updateSeekerLinePosition();
            return;
        }

        if (this.activeTool === Tools.marquee) {
            if (isVelocityAreaClick) {
                this.mouseStateManager.addMouseDownEvent(xWithScroll, rawY);
                this.dragMode = DragModes.adjustSelectionFromVelocityArea;
            } else {
                this.dragMode = DragModes.adjustSelection;
            }
        } else if (this.activeTool === Tools.pencil) {
            if (isVelocityAreaClick) {
                this.handleVelocityAreaPencilInteraction(roundedX, rawY);
            } else {
                this.dragMode = DragModes.adjustNoteSize;
                this.clearSelection();
                this.addNewNote(roundedX, roundedY); 
            }
        } else if (this.activeTool === Tools.cursor) {
            if (isVelocityAreaClick) {
                this.handleVelocityAreaCursorInteraction(roundedX, target);
            } else {
                const targetIsNote = Boolean(target.getAttr('isNoteRect'));
                if (targetIsNote) {
                    this.handleNoteInteractionStart(target, xWithScroll);
                }
            }  
        }

    }

    private handleNoteInteractionStart(noteElement: Konva.Rect, xWithScroll: number) : void {
        const { x: rectX, width: rectWidth } = noteElement.attrs;
        const isEdgeClick = rectWidth + rectX - xWithScroll < 10;
        const isSelected = this.noteSelection.has(noteElement);
        if (isEdgeClick) {
            if (!isSelected) {
                this.clearSelection();
                this.addNoteToSelection(noteElement);
            } 
            this.dragMode = DragModes.adjustNoteSize
        } else {
            this.dragMode = DragModes.adjustNotePosition;
        }
    }

    private handleVelocityAreaCursorInteraction(roundedX: number, target: Konva.Rect) : void {
        // Test if the target is the border, and if so enter height change drag mode. 
        if (target.id() === 'VELOCITY_BORDER') {
            this.dragMode = DragModes.adjustVelocityAreaHeight
            return;
        }
        // If not, select / deselect notes based on the current selection state, click location and
        // shift key state.
        const allNoteElements = this.noteCache.retrieveAll();
        const matchingNotes = allNoteElements.filter(el => el.x() === roundedX);
        const selectedMatchingNotes = matchingNotes.filter(el => {
            return this.noteSelection.has(el);
        });
        
        if (matchingNotes.length === 0 || !this.keyboardStateManager.shiftKey) {
            this.clearSelection();
        }

        if (matchingNotes.length !== selectedMatchingNotes.length) {
            matchingNotes.forEach(noteElement => this.addNoteToSelection(noteElement));
        } else {
            matchingNotes.forEach(noteElement => this.removeNoteFromSelection(noteElement));
        }
    }

    private handleVelocityAreaPencilInteraction(roundedX: number, rawY: number) : void {
        // Calculate the new velocity
        const pxFromBottom = Math.min(
            this.conversionManager.stageHeight - rawY - StaticMeasurements.scrollbarWidth,
            this.conversionManager.velocityAreaHeight - 10
        );
        const velocityValue = pxFromBottom / (this.conversionManager.velocityAreaHeight - 10);
        // Determine which notes should be updated based on the click location, the current selection
        // state and the shift key state.
        const allVelocityMarkers = this.velocityMarkerCache.retrieveAll();
        const matchingMarkers = allVelocityMarkers.filter(el => el.x() === roundedX);
        const selectedMarkers = allVelocityMarkers.filter(el => this.noteSelection.has(el));
        const selectedMatchingMarkers = matchingMarkers.filter(el => {
            return this.noteSelection.has(el);
        });

        let velocityMarkersToUpdate;
        if (matchingMarkers.length === 0) {
            return;
        } else if (selectedMatchingMarkers.length === 0) {
            velocityMarkersToUpdate = matchingMarkers;
        } else {
            velocityMarkersToUpdate = this.keyboardStateManager.shiftKey ? selectedMarkers : selectedMatchingMarkers;
        }
        // Once the relevant notes have been found, iterate over them and update each of them. 
        this.velocityLayer.updateVelocityMarkersHeight(velocityMarkersToUpdate, velocityValue);
        velocityMarkersToUpdate.forEach(velocityRect => {
            const id = velocityRect.getAttr('id');
            this.addNoteToAudioEngine(id);
        });
        this.serializeState();
    }

    private humanizeNoteVelocities(velocityMarkerElements: Konva.Rect[], range: number = 0.1) : void {
        velocityMarkerElements.forEach(velocityElement => {
            const { velocity, id } = velocityElement.attrs;
            // Ensure the the velocity value that we randomize is at least `range` distance
            // from the highest legal value (1) and the lowest legal value (0).
            const safeVelocityValue = clamp(
                velocity,
                range,
                1 - range
            );
            const newVelocityValue = safeVelocityValue + (Math.random() * range * 2) - range;
            this.velocityLayer.updateVelocityMarkersHeight([ velocityElement ], newVelocityValue);
            this.addNoteToAudioEngine(id);
        });
        this.serializeState();
    }

    private humanizeSelection() : void {
        const allVelocityMarkers = this.velocityMarkerCache.retrieveAll();
        const selectedMarkers = allVelocityMarkers.filter(el => this.noteSelection.has(el));
        this.humanizeNoteVelocities(selectedMarkers, 0.1);
    }

    private transformSelection(easingMode: EasingModes = EasingModes.linear) : void {
        const allVelocityMarkers = this.velocityMarkerCache.retrieveAll();
        const selectedMarkers = allVelocityMarkers.filter(el => this.noteSelection.has(el));
        this.transformNoteVelocities(selectedMarkers, easingMode);
    }

    private transformNoteVelocities(velocityMarkerElements: Konva.Rect, easingMode: EasingModes) : void {
        
        let originX;
        let terminalX;
        let originVelocity;
        let terminalVelocity;

        velocityMarkerElements.forEach(el => {
            if (originX === undefined || el.attrs.x < originX) {
                originX = el.attrs.x;
                originVelocity = el.attrs.velocity;
            }
            if (terminalX === undefined || el.attrs.x > terminalX) {
                terminalX = el.attrs.x;
                terminalVelocity = el.attrs.velocity;
            }
        });
        const xDelta = Math.abs(originX - terminalX);
        const velocityDelta = terminalVelocity - originVelocity;

        const getPosInRange = x => (x - originX) / xDelta;
        const adjustForFnRange = x => x * velocityDelta + originVelocity;

        const easingFn = easingFns[easingMode] || easingFns.linear;

        const transformFn = pipe(
            getPosInRange,
            easingFn,
            adjustForFnRange
        );

        velocityMarkerElements.forEach(velocityElement => {
            const { x, id } = velocityElement.attrs;
            const newVelocityValue = transformFn(x);
            this.velocityLayer.updateVelocityMarkersHeight([ velocityElement ], newVelocityValue);
            this.addNoteToAudioEngine(id);
        });
        this.serializeState();
    }

    private handleInteractionUpdate(e: KonvaEvent) : void {
        switch (this.dragMode) {
            case DragModes.adjustNoteSize:
                this.handleAdjustNoteSizeInteractionUpdate(e);
                break;
            case DragModes.adjustNotePosition:
                this.handleAdjustNotePositionInteractionUpdate(e);
                break;
            case DragModes.adjustSelection:
                this.handleAdjustSelectionInteractionUpdate(e);
                break;
            case DragModes.adjustSelectionFromVelocityArea:
                this.handleAdjustSelectionFromVelocityInteractionUpdate(e);
                break;
            case DragModes.adjustVelocityAreaHeight:
                this.handleAdjustVelocityAreaHeightInteractionUpdate(e);
                break;
            default:
                return;
        }
    }

    private handleAdjustNoteSizeInteractionUpdate(e: KonvaEvent) : void {
        const { rawX, rawY } = this.extractInfoFromEventObject(e);
        this.nudgeGridIfRequired(rawX, rawY, NudgeDirections.horizontal);
        const xWithScroll = rawX - this.scrollManager.x;
        const selectedNoteIds = this.noteSelection.retrieveAll();
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        this.noteLayer.updateNoteDurations(
            this.mouseStateManager.x, 
            xWithScroll, 
            selectedNoteElements
        );
    }

    private handleAdjustNotePositionInteractionUpdate(e: KonvaEvent) : void {
        const { rawX, rawY } = this.extractInfoFromEventObject(e);
        this.nudgeGridIfRequired(rawX, rawY, NudgeDirections.both);
        const xWithScroll = rawX - this.scrollManager.x;
        const yWithScroll = rawY - this.scrollManager.y;
        this.mouseStateManager.updateHasTravelled(xWithScroll, yWithScroll);
        const xDelta = this.conversionManager.roundToGridCol(
            xWithScroll - this.mouseStateManager.x
        );
        const yDelta = this.conversionManager.roundToGridRow(
            yWithScroll - this.mouseStateManager.y
        );
        const selectedNoteIds = this.noteSelection.retrieveAll();
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this.velocityMarkerCache.retrieve(selectedNoteIds);
        this.noteLayer.repositionNotes(xDelta, yDelta, selectedNoteElements);
        this.velocityLayer.repositionVelocityMarkers(xDelta, selectedVelocityMarkerElements);
    }

    private handleAdjustSelectionInteractionUpdate(e: KonvaEvent) : void {
        const { rawX, rawY } = this.extractInfoFromEventObject(e);
        this.nudgeGridIfRequired(rawX, rawY, NudgeDirections.both);
        const currentX = rawX - this.scrollManager.x;
        const currentY = rawY - this.scrollManager.y;
        const mouseDownX = this.mouseStateManager.x;
        const mouseDownY = this.mouseStateManager.y;
        const selectionX1 = Math.min(mouseDownX, currentX);
        const selectionX2 = Math.max(mouseDownX, currentX);
        const selectionY1 = Math.min(mouseDownY, currentY);
        const selectionY2 = Math.max(mouseDownY, currentY);
        this.noteLayer.updateSelectionMarquee(selectionX1, selectionY1, selectionX2, selectionY2);
        this.reconcileNoteSelectionWithSelectionArea(selectionX1, selectionY1, selectionX2, selectionY2);
    }

    private handleAdjustSelectionFromVelocityInteractionUpdate(e: KonvaEvent) : void {
        const { rawX, rawY } = this.extractInfoFromEventObject(e);
        this.nudgeGridIfRequired(rawX, rawY, NudgeDirections.horizontal);
        const xWithScroll = rawX - this.scrollManager.x;
        const mouseDownX = this.mouseStateManager.x;
        const mouseDownY = this.mouseStateManager.y;
        const topOfVelocityArea = this.conversionManager.stageHeight - this.conversionManager.velocityAreaHeight - StaticMeasurements.scrollbarWidth;
        const bottomofVelocityArea = this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth;
        const x1 = Math.min(mouseDownX, xWithScroll);
        const x2 = Math.max(mouseDownX, xWithScroll);
        const y1 = Math.max(topOfVelocityArea, Math.min(mouseDownY, rawY) );
        const y2 = Math.min(bottomofVelocityArea, Math.max(mouseDownY, rawY) );
        this.velocityLayer.updateSelectionMarquee(x1, y1, x2, y2);
        this.reconcileNoteSelectionWithSelectionArea(x1, 0, x2, this.conversionManager.gridHeight);
    }

    private handleAdjustVelocityAreaHeightInteractionUpdate(e: KonvaEvent) : void {
        const { rawY } = this.extractInfoFromEventObject(e);
        const newHeight = (this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth) - rawY;
        this.velocityLayer.redrawOnHeightChange(newHeight);
        this.conversionManager.velocityAreaHeight = newHeight;
    }

    private handleInteractionEnd(e: KonvaEvent) : void {
        switch (this.dragMode) {
            case DragModes.adjustNoteSize:
                this.handleAdjustNoteSizeInteractionEnd(e);
                break;
            case DragModes.adjustNotePosition:
                this.handleAdjustNotePositionInteractionEnd(e);
                break;
            case DragModes.adjustSelection:
                this.handleAdjustSelectionInteractionEnd(e);
                break;
            case DragModes.adjustSelectionFromVelocityArea:
                this.handleAdjustSelectionFromVelocityInteractionEnd(e);
                break;
            case DragModes.adjustVelocityAreaHeight:
                this.handleAdjustVelocityAreaHeightInteractionEnd(e);
                break;
            default:
                return;
        }
    }

    private handleAdjustNoteSizeInteractionEnd(e: KonvaEvent) : void {
        this.dragMode = null;
        const selectedNoteIds = this.noteSelection.retrieveAll();
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this.velocityMarkerCache.retrieve(selectedNoteIds);
        this.noteLayer.updateNotesAttributeCaches(selectedNoteElements);
        this.velocityLayer.updateVelocityMarkersAttributeCaches(selectedVelocityMarkerElements);
        selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
        this.serializeState();
    }

    private handleAdjustNotePositionInteractionEnd(e: KonvaEvent) : void {
        if (!this.mouseStateManager.hasTravelled) {
            const { target } = e;
            const isCurrentlySelected = this.noteSelection.has(target);
            if (this.keyboardStateManager.shiftKey) {
                if (isCurrentlySelected) {
                    this.removeNoteFromSelection(target);
                } else {
                    this.addNoteToSelection(target);
                }
            } else {
                this.clearSelection();
                if (!isCurrentlySelected) {
                    this.addNoteToSelection(target);
                }
            }
        }
        const selectedNoteIds = this.noteSelection.retrieveAll();
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this.velocityMarkerCache.retrieve(selectedNoteIds);
        this.noteLayer.updateNotesAttributeCaches(selectedNoteElements);
        this.velocityLayer.updateVelocityMarkersAttributeCaches(selectedVelocityMarkerElements);
        selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
        this.serializeState();
        this.dragMode = null;
    }

    private handleAdjustSelectionInteractionEnd(e: KonvaEvent) : void {
        this.noteLayer.clearSelectionMarquee();
        this.dragMode = null;
        this.serializeState();
    }

    private handleAdjustSelectionFromVelocityInteractionEnd(e: KonvaEvent) : void {
        this.velocityLayer.clearSelectionMarquee();
        this.dragMode = null;
        this.serializeState();
    }

    private handleAdjustVelocityAreaHeightInteractionEnd(e: KonvaEvent) : void {
        this.dragMode = null;
    }

}
