export enum Events {
    // Piano roll related events
    quantizeValueUpdate = 'quantizeValueUpdate',
    noteDurationUpdate = 'noteDurationUpdate',
    scaleKeyUpdate = 'scaleKeyUpdate',
    scaleTypeUpdate = 'scaleTypeUpdate',
    displayScaleUpdate = 'displayScaleUpdate',
    chordTypeUpdate = 'chordTypeUpdate',
    addNote = 'addNote',
    activeToolUpdate = 'activeToolUpdate',
    undoAction = 'undoAction',
    redoAction = 'redoAction',
    copyToClipboard = 'copyToClipboard',
    cutToClipboard = 'cutToClipboard',
    pasteFromClipboard = 'pasteFromClipboard',
    // Window related events
    closeWindow = 'closeWindow',
    deminimizeWindow = 'deminimizeWindow',
    renderApp = 'renderApp',
    focusWindow = 'focusWindow',
    resizeWindow = 'resizeWindow',
    openPianoRollWindow = 'openPianoRollWindow',
    historyTravelled = 'historyTravelled',
    addStateToStack = 'addStateToStack',
    triggerUIRender = 'triggerUIRender',
    openChannelSettingsWindow = 'openChannelSettingsWindow'
}

export enum DragModes {
    adjustNoteSize = 'adjustNoteSize',
    adjustNotePosition = 'adjustNotePosition',
    adjustSelection = 'adjustSelection',
    adjustSelectionFromVelocityArea = 'adjustSelectionFromVelocityArea',
    adjustVelocityAreaHeight = 'adjustVelocityAreaHeight'
}

export enum ArrangerDragModes {
    adjustSectionLength = 'adjustSectionLength',
    adjustSectionPosition = 'adjustSectionPosition',
    adjustSelection = 'adjustSelection'
}

export enum Tools {
    cursor = 'cursor',
    pencil = 'pencil',
    marquee = 'marquee'
}

export enum WindowTypes {
    pianoRoll = 'pianoRoll'
}

export enum WindowInteractionModes {
    resize = 'resize',
    reposition = 'reposition'
}

export enum WindowDisplayModes {
    minimized = 'minimized',
    maximized = 'maximized',
    normal = 'normal'
}
