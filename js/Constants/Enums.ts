export enum Events {
    // Piano roll related events
    quantizeValueUpdate = 'quantizeValueUpdate',
    noteDurationUpdate = 'noteDurationUpdate',
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
    resizeWindow = 'resizeWindow'
}

export enum DragModes {
    adjustNoteSize = 'adjustNoteSize',
    adjustNotePosition = 'adjustNotePosition',
    adjustSelection = 'adjustSelection',
    adjustSelectionFromVelocityArea = 'adjustSelectionFromVelocityArea',
    adjustVelocityAreaHeight = 'adjustVelocityAreaHeight'
}

export enum Tools {
    cursor = 'cursor',
    pencil = 'pencil',
    marquee = 'marquee'
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