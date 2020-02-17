import Tone from 'tone';
import Konva from 'konva';
import EventEmitter from '../EventEmitter';
import ConversionManager from './ConversionManager';
import AudioReconciler from './AudioReconciler';
import SelectionManager from '../common/SelectionManager';
import KeyboardStateManager from '../common/KeyboardStateManager';
import MouseStateManager from '../common/MouseStateManager';
import CanvasElementCache from '../common/CanvasElementCache';
import PianoRollClipboard from './PianoRollClipboard';
import StageScrollManager from '../common/StageScrollManager';
import GridLayer from './GridLayer';
import NoteLayer from './NoteLayer';
import VelocityLayer from './VelocityLayer';
import TransportLayer from './TransportLayer';
import SeekerLineLayer from './SeekerLineLayer';
import PianoKeyLayer from './PianoKeyLayer';
import PianoRollScrollbars from './PianoRollScrollbars';
import ContextMenuLayer from './ContextMenuLayer';
import StageBackground from '../common/StageBackground';
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
import { SerializedSectionState, SerializedAudioEngineState } from '../AudioEngine/AudioEngineConstants';
import Section from '../AudioEngine/Section';

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
    private noteSelection: SelectionManager;
    private clipboard: PianoRollClipboard;
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
    private scrollbarLayer: PianoRollScrollbars;
    private backgroundLayer: StageBackground;
    private eventEmitter: EventEmitter;
    private unsubscribeFns: Function[] = [];
    private section: Section;
    private interactionXDeltaMax: number;
    private interactionXDeltaMin: number;
    private interactionYDeltaMax: number;
    private interactionYDeltaMin: number;

    constructor(eventEmitter: EventEmitter) {
        // Initialize class properties
        window.pianoRoll = this;
        this.dragMode = null;
        this.activeTool = Tools.cursor;
        this.previousBumpTimestamp = null;
        this.chordType = 'major';
        this.playbackFromTicks = 0;
        this.eventEmitter = eventEmitter;
    }

    init(pianoRollOptions: PianoRollOptions) : void {
        this.instantiateChildClasses(pianoRollOptions);
        this.stage.add(this.primaryBackingLayer);
        this.stage.add(this.seekerLineLayer.layer);
        this.stage.add(this.secondaryBackingLayer);
        this.backgroundLayer.init();
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
        this.forceToState(
            this.section.serializeState()
        );
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
        this.section = section;
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
            this.eventEmitter,
            initialQuantize,
            initialNoteDuration,
            numBars
        );
        this.audioReconciler = new AudioReconciler(this.conversionManager, this.section);
        this.noteSelection = new SelectionManager();
        this.clipboard = new PianoRollClipboard(this.conversionManager);
        // Instantiate canvas layer related classes
        this.primaryBackingLayer = new Konva.Layer();
        this.secondaryBackingLayer = new Konva.Layer();
        this.backgroundLayer = new StageBackground(this.conversionManager, this.primaryBackingLayer);
        this.gridLayer = new GridLayer(this.conversionManager, this.primaryBackingLayer, this.eventEmitter);
        this.noteLayer = new NoteLayer(this.conversionManager, this.primaryBackingLayer);
        this.velocityLayer = new VelocityLayer(this.conversionManager, this.primaryBackingLayer);
        this.transportLayer = new TransportLayer(this.conversionManager, this.primaryBackingLayer);
        this.seekerLineLayer = new SeekerLineLayer(this.conversionManager, this.section);
        this.pianoKeyLayer = new PianoKeyLayer(
            this.conversionManager, 
            this.secondaryBackingLayer,
            livePlayInstrument
        );
        this.contextMenuLayer = new ContextMenuLayer(this.conversionManager, this.secondaryBackingLayer);
        this.scrollManager = new StageScrollManager(
            [ this.gridLayer, this.noteLayer, this.velocityLayer, this.transportLayer, this.seekerLineLayer ],
            [ this.gridLayer, this.noteLayer, this.pianoKeyLayer ],
            StaticMeasurements.pianoKeyWidth,
            this.conversionManager.seekerAreaHeight
        );
        this.scrollbarLayer = new PianoRollScrollbars(
            this.scrollManager,
            this.conversionManager,
            this.secondaryBackingLayer,
            StaticMeasurements.pianoKeyWidth
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
                this.eventEmitter.emit(Events.activeToolUpdate, 'cursor');
            }
        });
        this.keyboardStateManager.addKeyListener('2', () => {
            if (this.keyboardStateManager.altKey) {
                this.eventEmitter.emit(Events.activeToolUpdate, 'pencil');
            }
        });
        this.keyboardStateManager.addKeyListener('3', () => {
            if (this.keyboardStateManager.altKey) {
                this.eventEmitter.emit(Events.activeToolUpdate, 'marquee');
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
        this.keyboardStateManager.addKeyListener(' ', () => this.handleTogglePlayback());
    }

    private registerGlobalEventSubscriptions() : void {
        this.eventEmitter.subscribe(Events.activeToolUpdate, tool => {
            this.activeTool = tool;
            console.log(this.activeTool);
        });
        this.eventEmitter.subscribe(Events.chordTypeUpdate, chordType => {
            this.chordType = chordType;
        });
        this.eventEmitter.subscribe(Events.historyTravelled, (state: SerializedAudioEngineState) => {
            let serializedSection;
            for (const channel of state.channels) {
                if (channel.sections[this.section.id]) {
                    serializedSection = channel.sections[this.section.id];
                    break;
                }
            }
            this.forceToState(serializedSection);
        });
    }

    cleanup() {
        this.stage.destroy();
    }

    /**
     * Called by the parent window class when it changes size. Updates various parts of
     * the canvas as needed with the new width and height and then redraws the canvas.
     */
    handleResize(containerWidth: number, containerHeight: number) : void {
        if (containerWidth !== this.conversionManager.stageWidth) {
            this.conversionManager.stageWidth = containerWidth;
            this.stage.width(containerWidth);
            if (!this.scrollbarLayer.shouldAllowHorizontalScrolling) {
                if (this.scrollManager.x !== StaticMeasurements.pianoKeyWidth) {
                    this.scrollManager.x = StaticMeasurements.pianoKeyWidth;
                }
            } else {
                const endOfScrollRange = (this.scrollbarLayer.horizontalScrollRange * -1) + StaticMeasurements.pianoKeyWidth;
                if (this.scrollManager.x < endOfScrollRange) {
                    this.scrollManager.x = endOfScrollRange;
                }
            }
        }
        if (containerHeight !== this.conversionManager.stageHeight) {
            this.conversionManager.stageHeight = containerHeight;
            this.stage.height(containerHeight);
            if (!this.scrollbarLayer.shouldAllowVerticalScrolling) {
                if (this.scrollManager.y !== this.conversionManager.seekerAreaHeight) {
                    this.scrollManager.y = this.conversionManager.seekerAreaHeight;
                }
            } else {
                const endOfScrollRange = (this.scrollbarLayer.verticalScrollRange * -1) + this.conversionManager.seekerAreaHeight;
                if (this.scrollManager.y < endOfScrollRange) {
                    this.scrollManager.y = endOfScrollRange;
                }
            }
        }
        this.backgroundLayer.redrawOnResize();
        this.velocityLayer.redrawOnVerticalResize();
        this.pianoKeyLayer.redrawOnVerticalResize();
        this.scrollbarLayer.redrawOnResize();
        this.primaryBackingLayer.draw();
        this.secondaryBackingLayer.draw();
    }

    /**
     * Updates the necessary parts of the canvas and redraws the canvas when the level of 
     * zoom updates.
     */
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
            // Calculate the current scroll values position, as a decimal, within the total scrolling
            // range. If the scrolling range is 0 (no scrolling available because the entire width of
            // the window is visible) then just use the value 0.
            const startScrollPosInRange = (this.scrollManager.x - StaticMeasurements.pianoKeyWidth) * -1;
            const startScrollPosAsDec = this.scrollbarLayer.horizontalScrollRange > 0 ? 
                startScrollPosInRange / this.scrollbarLayer.horizontalScrollRange :
                0;
            // Updating the tickToPxRatio value in conversionManager will effect the way various things
            // are calculated. 
            this.conversionManager.tickToPxRatio = newZoomLevel;
            // With the tickToPxRatio updated, recalculate the scroll value, clamping it between the
            // maximum and minimum legal values to ensure that it is valid, then update scrollManager
            // with the new value. 
            const newScrollPosInRange = startScrollPosAsDec * this.scrollbarLayer.horizontalScrollRange;
            const newScrollValue = (newScrollPosInRange * -1) + StaticMeasurements.pianoKeyWidth;
            const endOfAllowedScrollValues = (this.scrollbarLayer.horizontalScrollRange * -1) + StaticMeasurements.pianoKeyWidth;
            const safeNewScrollValue = clamp(
                newScrollValue,
                endOfAllowedScrollValues,
                StaticMeasurements.pianoKeyWidth 
            );
            this.scrollManager.x = safeNewScrollValue;
            
            this.gridLayer.redrawOnZoomAdjustment();
            this.noteLayer.redrawOnZoomAdjustment(isZoomingIn);
            this.velocityLayer.redrawOnZoomAdjustment(isZoomingIn);
            this.transportLayer.redrawOnZoomAdjustment(isZoomingIn);
            this.seekerLineLayer.redrawOnZoomAdjustment();
            this.scrollbarLayer.syncHorizontalThumb();
        }
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
                this.scrollbarLayer.syncHorizontalThumb();
            } else if (isAtRightEdge) {
                const scrollLimit = -1 * (this.conversionManager.gridWidth - this.conversionManager.stageWidth + StaticMeasurements.scrollbarWidth);
                this.scrollManager.x = Math.max(scrollLimit, this.scrollManager.x - 100);
                this.scrollbarLayer.syncHorizontalThumb();
            }
        }

        if (nudgeDirection === NudgeDirections.both || nudgeDirection === NudgeDirections.vertical) {
            const isAtTopEdge = y < this.conversionManager.seekerAreaHeight + triggerThreshold;
            const isAtBottomEdge = this.conversionManager.stageHeight - StaticMeasurements.scrollbarWidth - this.conversionManager.velocityAreaHeight - y < triggerThreshold;
            if (isAtTopEdge) {
                const scrollLimit = this.conversionManager.seekerAreaHeight;
                this.scrollManager.y = Math.min(scrollLimit, this.scrollManager.y + 100);
                this.scrollbarLayer.syncVerticalThumb();
            } else if (isAtBottomEdge) {
                const scrollLimit = -1 * (
                    this.conversionManager.gridHeight - this.conversionManager.stageHeight + 
                    StaticMeasurements.scrollbarWidth + this.conversionManager.velocityAreaHeight
                );
                this.scrollManager.y = Math.max(scrollLimit, this.scrollManager.y - 100);
                this.scrollbarLayer.syncVerticalThumb();
            }
        }
    }

    /**
     * Adds a note to the audio engine, deriving its values from the canvas elements representing
     * that note and its velocity marker. This method does not trigger adding a new entry to the 
     * history stack, this allows it to be called repeatedly to add multiple notes as part of the
     * same 'transaction' without producing a new entry on the history stack after the addition of
     * each individual note. 
     */
    private addNoteToAudioEngine(noteId: string) : void {
        const noteElement = this.noteCache.retrieveOne(noteId);
        const velocityMarkerElement = this.velocityMarkerCache.retrieveOne(noteId);
        console.log(noteElement, velocityMarkerElement);
        this.audioReconciler.addNote(noteElement, velocityMarkerElement);
    }

    /**
     * Adds a new note, and its associated velocity marker, to the canvas, but does not affect the
     * audio engine or history stack.
     */
    private addNewNote(x: number, y: number, width?: number) : Konva.Rect {
        const id = genId();
        const newNote = this.noteLayer.addNewNote(x, y, id, width);
        const newVelocityMarker = this.velocityLayer.addNewVelocityMarker(x, id);
        this.noteCache.add(newNote);
        this.velocityMarkerCache.add(newVelocityMarker);
        this.noteSelection.add(newNote);
        return newNote;
    }    

    /**
     * If no notes are selected then this does nothing, but if any are selected then they are
     * deleted from the canvas (along with their associated velocity markers), cleaned up and 
     * deleted from the audio engine, and a new entry is added to the history stack.
     */
    private deleteSelectedNotes() : void {
        const selectedNoteIds = this.noteSelection.retrieveAll();
        if (selectedNoteIds.length === 0) {
            return;
        }
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this.velocityMarkerCache.retrieve(selectedNoteIds);
        this.noteLayer.deleteNotes(selectedNoteElements);
        this.velocityLayer.deleteVelocityMarkers(selectedVelocityMarkerElements);
        this.noteSelection.clear();
        selectedNoteElements.forEach(el => this.noteCache.remove(el));
        selectedVelocityMarkerElements.forEach(el => this.velocityMarkerCache.remove(el));
        this.audioReconciler.removeNotes(selectedNoteIds);
        this.addToHistory();
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

    /**
     * Iterates over all notes and adds them to / removes them from the current selection based on 
     * whether they overlap with selection rectangle described by the coordinates given. This only affects
     * the appearance of the canvas elements for the notes and their velocity markers, as well as this classes 
     * selected notes cache, it does not affect the audio engine or the history stack. 
     */
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

    /**
     * Shifts all selected notes up to the pitch above their current pitch, if this is
     * possible. If it is not possible for any of the notes, then none of the notes
     * are shifted. This method also updates the audio engine and adds a new entry to the
     * history stack. Also accepts a boolean shiftByOctave which, if true, attempts to shift
     * the note by 12 pitch increments rather than 1.
     */
    private shiftSelectionUp(shiftByOctave: boolean) : void {
        const shiftAmount = shiftByOctave ? 
            this.conversionManager.rowHeight * 12 : 
            this.conversionManager.rowHeight;
        const selectedNoteIds = this.noteSelection.retrieveAll();
        if (selectedNoteIds.length === 0) {
            return;
        }
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        if (canShiftUp(selectedNoteElements, shiftAmount)) {
            this.noteLayer.shiftNotesUp(selectedNoteElements, shiftAmount);
            selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
            this.addToHistory();
        }
    }

    /**
     * Shifts all selected notes down to the pitch below their current pitch, if this is
     * possible. If it is not possible for any of the notes, then none of the notes
     * are shifted. This method also updates the audio engine and adds a new entry to the
     * history stack. Also accepts a boolean shiftByOctave which, if true, attempts to shift
     * the note by 12 pitch increments rather than 1.
     */
    private shiftSelectionDown(shiftByOctave: boolean) : void {
        const shiftAmount = shiftByOctave ?
            this.conversionManager.rowHeight * 12 :
            this.conversionManager.rowHeight;
        const selectedNoteIds = this.noteSelection.retrieveAll();
        if (selectedNoteIds.length === 0) {
            return;
        }
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        if (canShiftDown(selectedNoteElements, this.conversionManager.gridHeight, shiftAmount)) {
            this.noteLayer.shiftNotesDown(selectedNoteElements, shiftAmount);
            selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
            this.addToHistory();
        }
    }

    /**
     * Shifts all selected notes back to an earlier start time which is based on the current 
     * quantize value, if this is possible. If it is not possible for any of the notes, then 
     * none of the notes are shifted. This method also updates the audio engine and adds a new 
     * entry to the history stack.
     */
    private shiftSelectionLeft() : void {
        const selectedNoteIds = this.noteSelection.retrieveAll();
        if (selectedNoteIds.length === 0) {
            return;
        }
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this.velocityMarkerCache.retrieve(
            selectedNoteIds
        );
        if (canShiftLeft(selectedNoteElements)) {
            this.noteLayer.shiftNotesLeft(selectedNoteElements);
            this.velocityLayer.shiftVelocityMarkersLeft(selectedVelocityMarkerElements);
            selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
            this.addToHistory()
        }
    }

    /**
     * Shifts all selected notes forward to a later start time which is based on the current 
     * quantize value, if this is possible. If it is not possible for any of the notes, then 
     * none of the notes are shifted. This method also updates the audio engine and adds a new 
     * entry to the history stack.
     */
    private shiftSelectionRight() : void {
        const selectedNoteIds = this.noteSelection.retrieveAll();
        if (selectedNoteIds.length === 0) {
            return;
        }
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this.velocityMarkerCache.retrieve(
            selectedNoteIds
        );
        if (canShiftRight(selectedNoteElements, this.conversionManager.gridWidth, this.conversionManager.colWidth)) {
            this.noteLayer.shiftNotesRight(selectedNoteElements);
            this.velocityLayer.shiftVelocityMarkersRight(selectedVelocityMarkerElements);
            selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
            this.addToHistory();
        }
    }

    /**
     * Updates the selected chord by moving upwards through inversions, meaning that the lowest
     * pitched note is moved to the first available higher pitch that belongs to the chord and is
     * not currently being used. This method also updates the audio engine and adds a new entry to
     * the history stack. If there is no suitable pitch for the note to be moved to then this method
     * does nothing and does not affect the audio engine or history stack. 
     */
    private moveUpwardsThroughInversions() : void {
        const noteElements = this.noteCache.retrieve(
            this.noteSelection.retrieveAll()
        );
        if (noteElements.length === 0) {
            return;
        }

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
        this.addToHistory();
    }

    /**
     * Updates the selected chord by moving downwards through inversions, meaning that the highest
     * pitched note is moved to the first available lower pitch that belongs to the chord and is
     * not currently being used. This method also updates the audio engine and adds a new entry to
     * the history stack. If there is no suitable pitch for the note to be moved to then this method
     * does nothing and does not affect the audio engine or history stack. 
     */
    private moveDownwardsThroughInversions() : void {
        const noteElements = this.noteCache.retrieve(
            this.noteSelection.retrieveAll()
        );
        if (noteElements.length === 0) {
            return;
        }

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
        this.addToHistory();
    }

    /**
     * This method used internally by constructChordsFromSelectedRootNotes, it adds notes to the
     * canvas and to the audio engine based on the rootNote and relativePositions arguments provided
     * to it. It does not add a new entry to the history stack, which allows the
     * constructChordsFromSelectedRootNotes to call this method sevral times as part of the same
     * 'transaction' without creating a new entry on the history stack each time. 
     */
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

    /**
     * Takes the currently selected notes and converts them into chords, with the selected notes
     * acting as the root note and the additional notes added being based on the global chord
     * settings. The added notes are also added to the audio engine and a single new entry is 
     * added to the history stack after all notes have been added. 
     */
    private constructChordsFromSelectedRootNotes() : void {
        const selectedNotes = this.noteCache.retrieve(
            this.noteSelection.retrieveAll()
        );
        if (selectedNotes.length === 0) {
            return;
        }
        const { chroma } = chordType(this.chordType);
        let relativePositions = [];
        chroma.split('').forEach((binary, idx) => {
            if (parseInt(binary) && idx > 0) {
                relativePositions.push(idx);
            }
        });
        selectedNotes.forEach(note => this.constructChordFromRootNote(note, relativePositions));
        this.addToHistory();
    }

    private undo() : void {
        this.eventEmitter.emit(Events.undoAction);
    }

    private redo() : void {
        this.eventEmitter.emit(Events.redoAction);
    }

    private addToHistory() {
        this.eventEmitter.emit(Events.addStateToStack);
    }

    /**
     * Copies current selection to clipboard, but has no impact on the audio engine or history stack.
     */
    private copy() : void {
        const selectedNoteIds = this.noteSelection.retrieveAll();
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this.velocityMarkerCache.retrieve(selectedNoteIds);
        this.clipboard.add(selectedNoteElements, selectedVelocityMarkerElements);
    }

    /**
     * Copies current selection to clipboard and then deletes it. This also removes it from the audio
     * engine and results in a new entry being added to the history stack.
     */
    private cut() : void {
        this.copy();
        this.deleteSelectedNotes();
    }

    /**
     * If there is anything on the clipboard, it creates new notes to be added based on the data in the
     * clipboard and current Transport position of the track. The new notes are added to the canvas (in 
     * addition to velocity markers), the notes are also added to the audio engine and a new entry is 
     * added to the history stack. 
     */
    private paste() : void {
        const currentQuantizeAsTicks = this.conversionManager.convertPxToTicks(
            this.conversionManager.colWidth
        );
        const roundedStartTime = this.conversionManager.round(
            Tone.Transport.ticks,
            currentQuantizeAsTicks
        );
        const newNoteData = this.clipboard.produceCopy(roundedStartTime);
        if (newNoteData.length === 0) {
            return;
        }
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
        this.primaryBackingLayer.batchDraw();
        this.addToHistory();
    }

    /**
     * Handles contextMenu events by adding the appropriate context menu to the canvas depending on 
     * where the event was fired from. 
     */
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

    /**
     * Adds a context menu containing options related to note velocities.
     */
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

    /**
     * Adds a context menu containing general options.
     */
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

    /**
     * Adds a context menu containing options related to notes.
     */
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

    /**
     * Takes a Konva event object and returns an accurate x and y coordinate for the event regardless of
     * whether it is a pointer or touch event. Also provides metadata such as the target and whether it is
     * a touch event. 
     */
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

    /**
     * Takes the currently selected notes and determines the maximum and minimum x and y deltas that 
     * they can be moved as a group such that none of the individual notes exit the grid. These 
     * maximum and minimum deltas are stored as class properties so that they can then be referenced
     * throughout the rest of the interaction (preventing the boundaries from having to be recalculated
     * on every `tick` of the interaction update). At the end of the interaction the class properties are
     * reset to null. 
     */
    private calculateDeltaBoundaries() {
        const selectedNoteIds = this.noteSelection.retrieveAll();
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        let totalMaxX = Infinity;
        let totalMinX = -Infinity;
        let totalMaxY = Infinity;
        let totalMinY = -Infinity;
        selectedNoteElements.forEach(el => {
            const thisMaxX = this.conversionManager.gridWidth - (el.x() + el.width());
            if (thisMaxX < totalMaxX) {
                totalMaxX = thisMaxX;
            }
            const thisMinX = -1 * el.x();
            if (thisMinX > totalMinX) {
                totalMinX = thisMinX;
            }
            const thisMaxY = this.conversionManager.gridHeight - (el.y() + el.height());
            if (thisMaxY < totalMaxY) {
                totalMaxY = thisMaxY;
            }
            const thisMinY = -1 * el.y();
            if (thisMinY > totalMinY) {
                totalMinY = thisMinY;
            }
        });
        this.interactionXDeltaMax = totalMaxX;
        this.interactionXDeltaMin = totalMinX;
        this.interactionYDeltaMax = totalMaxY;
        this.interactionYDeltaMin = totalMinY;
    }

    private resetDeltaBoundaries() {
        this.interactionXDeltaMax = null;
        this.interactionXDeltaMin = null;
        this.interactionYDeltaMax = null;
        this.interactionYDeltaMin = null;
    }

    private handleDoubleClick(e: KonvaEvent) : void {
        const { rawX, rawY } = this.extractInfoFromEventObject(e);
        const isTransportAreaClick = rawY <= 30;
        const xWithScroll = rawX - this.scrollManager.x;
        const isOutOfBounds = xWithScroll > this.conversionManager.gridWidth;
        if (isTransportAreaClick && !isOutOfBounds) {
            const roundedX = this.conversionManager.roundDownToGridCol(xWithScroll);
            const positionAsTicks = this.conversionManager.convertPxToTicks(roundedX);
            const sectionStartAsTicks = Tone.Ticks(this.section.start).toTicks();
            this.playbackFromTicks = sectionStartAsTicks + positionAsTicks;
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
        const isOutOfBounds = xWithScroll > this.conversionManager.gridWidth;
        if (isOutOfBounds) {
            return;
        }

        this.mouseStateManager.addMouseDownEvent(xWithScroll, yWithScroll);

        if (isTransportAreaClick) {
            const positionAsTicks = this.conversionManager.convertPxToTicks(roundedX);
            const sectionStartAsTicks = Tone.Ticks(this.section.start).toTicks();
            const absolutePositionAsBBS = Tone.Ticks(positionAsTicks + sectionStartAsTicks)
            .toBarsBeatsSixteenths();
            Tone.Transport.position = absolutePositionAsBBS;
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
                this.calculateDeltaBoundaries();
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
            this.calculateDeltaBoundaries();
            this.dragMode = DragModes.adjustNoteSize
        } else {
            this.calculateDeltaBoundaries();
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
        this.addToHistory();
    }

    /**
     * If there are currently selected notes this method will humanize their velocities by 
     * increasing or decreasing each one by a random amount. The random amount cannot exceed
     * 0.1, which is 10% of the range that note velocities can occupy. This method updates the
     * velocity markers on the canvas as required, then updates the audio engine and finally adds
     * a new entry to the history stack once all note velocities have been updated. 
     */
    private humanizeSelection() : void {
        const allVelocityMarkers = this.velocityMarkerCache.retrieveAll();
        const selectedMarkers = allVelocityMarkers.filter(el => this.noteSelection.has(el));
        //this.humanizeNoteVelocities(selectedMarkers, 0.1);
        if (selectedMarkers.length === 0) {
            return;
        }
        const variationAmount = 0.1;
        selectedMarkers.forEach(velocityElement => {
            const { velocity, id } = velocityElement.attrs;
            // Ensure the the velocity value that we randomize is at least `variationAmount` distance
            // from the highest legal value (1) and the lowest legal value (0).
            const safeVelocityValue = clamp(
                velocity,
                variationAmount,
                1 - variationAmount
            );
            const newVelocityValue = safeVelocityValue + (Math.random() * variationAmount * 2) - variationAmount;
            this.velocityLayer.updateVelocityMarkersHeight([ velocityElement ], newVelocityValue);
            this.addNoteToAudioEngine(id);
        });
        this.addToHistory();
    }

    /**
     * If there are currently selected notes this method transforms the velocities of all the inner
     * notes according to a function whose domain is derived from the time of the first and last notes,
     * and range is determined by velocity of the first and last notes. The exact velocity for a given
     * note is determined by its position within the domain and the easing mode that is currently active.
     * As an example if the first note in the selection has a velocity of 0 and the last note a velocity of 1,
     * and the easing mode is linear, a note halfway between the two will have a velocity of 0.5, a note
     * three quarters of the way will have a velocity of 0.75, etc.
     * 
     * This method updates the velocity markers on the canvas as well as updating the audio engine, and once
     * all notes have been updated it adds a new entry to the history stack. 
     */
    private transformSelection(easingMode: EasingModes = EasingModes.linear) : void {
        const allVelocityMarkers = this.velocityMarkerCache.retrieveAll();
        const selectedMarkers = allVelocityMarkers.filter(el => this.noteSelection.has(el));
        if (selectedMarkers.length === 0) {
            return;
        }
        let originX;
        let terminalX;
        let originVelocity;
        let terminalVelocity;

        selectedMarkers.forEach(el => {
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

        selectedMarkers.forEach(velocityElement => {
            const { x, id } = velocityElement.attrs;
            const newVelocityValue = transformFn(x);
            this.velocityLayer.updateVelocityMarkersHeight([ velocityElement ], newVelocityValue);
            this.addNoteToAudioEngine(id);
        });
        this.addToHistory();
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
        const xDelta = xWithScroll - this.mouseStateManager.x;
        if (xDelta <= this.interactionXDeltaMax) {
            this.noteLayer.updateNoteDurations(
                this.mouseStateManager.x, 
                xWithScroll, 
                selectedNoteElements
            );
        }
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
        const safeXDelta = clamp(
            xDelta,
            this.interactionXDeltaMin,
            this.interactionXDeltaMax
        );
        const safeYDelta = clamp(
            yDelta,
            this.interactionYDeltaMin,
            this.interactionYDeltaMax
        );
        this.noteLayer.repositionNotes(safeXDelta, safeYDelta, selectedNoteElements);
        this.velocityLayer.repositionVelocityMarkers(safeXDelta, selectedVelocityMarkerElements);
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
        this.resetDeltaBoundaries();
        const selectedNoteIds = this.noteSelection.retrieveAll();
        const selectedNoteElements = this.noteCache.retrieve(selectedNoteIds);
        const selectedVelocityMarkerElements = this.velocityMarkerCache.retrieve(selectedNoteIds);
        this.noteLayer.updateNotesAttributeCaches(selectedNoteElements);
        this.velocityLayer.updateVelocityMarkersAttributeCaches(selectedVelocityMarkerElements);
        selectedNoteIds.forEach(id => this.addNoteToAudioEngine(id));
        this.addToHistory();
    }

    private handleAdjustNotePositionInteractionEnd(e: KonvaEvent) : void {
        this.dragMode = null;
        this.resetDeltaBoundaries();
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
        if (this.mouseStateManager.hasTravelled) {
            this.addToHistory();
        }
    }

    private handleAdjustSelectionInteractionEnd(e: KonvaEvent) : void {
        this.noteLayer.clearSelectionMarquee();
        this.dragMode = null;
    }

    private handleAdjustSelectionFromVelocityInteractionEnd(e: KonvaEvent) : void {
        this.velocityLayer.clearSelectionMarquee();
        this.dragMode = null;
    }

    private handleAdjustVelocityAreaHeightInteractionEnd(e: KonvaEvent) : void {
        this.dragMode = null;
    }

    private forceToState(state: SerializedSectionState) : void {
        const noteElements = this.noteLayer.forceToState(state);
        const velocityMarkerElements = this.velocityLayer.forceToState(state);
        this.noteCache.forceToState(noteElements);
        this.velocityMarkerCache.forceToState(velocityMarkerElements);
        this.noteSelection.forceToState([]);
    }

}
