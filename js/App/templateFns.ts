import { render, html, nothing } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import Window from '../Window';
import { WindowDisplayModes, Tools } from '../Constants';

const quantizeSelectData = {
    id: 'quantize-select',
    label: 'Quantize',
    options: [
        { value: '32t', label: '32t' },
        { value: '32n', label: '32n' },
        { value: '16t', label: '16t' },
        { value: '16n', label: '16n' },
        { value: '8t', label: '8t' },
        { value: '8n', label: '8n' },
        { value: '4t', label: '4t' },
        { value: '4n', label: '4n' },
        { value: '2t', label: '2t' },
        { value: '2n', label: '2n' },
        { value: '1m', label: '1m' }
    ]
};

const noteDurationSelectData = {
    id: 'note-duration-select',
    label: 'Note Duration',
    options: [
        { value: '32t', label: '32t' },
        { value: '32n', label: '32n' },
        { value: '16t', label: '16t' },
        { value: '16n', label: '16n' },
        { value: '8t', label: '8t' },
        { value: '8n', label: '8n' },
        { value: '4t', label: '4t' },
        { value: '4n', label: '4n' },
        { value: '2t', label: '2t' },
        { value: '2n', label: '2n' },
        { value: '1m', label: '1m' }
    ]
};

const scaleKeySelectData = {
    id: 'scale-key-select',
    label: 'Key',
    options: [
        { value: 'C', label: 'C' },
        { value: 'C#', label: 'C#' },
        { value: 'D', label: 'D' },
        { value: 'D#', label: 'D#' },
        { value: 'E', label: 'E' },
        { value: 'F', label: 'F' },
        { value: 'F#', label: 'F#' },
        { value: 'G', label: 'G' },
        { value: 'G#', label: 'G#' },
        { value: 'A', label: 'A' },
        { value: 'A#', label: 'A#' },
        { value: 'B', label: 'B' }
    ]
}

const scaleTypeSelectData = {
    id: 'scale-type-select',
    label: 'Scale Type',
    optionGroups: [
        {
            label: '5 Note',
            options: [
                { value: 'major pentatonic', label: 'Major Pentatonic' },
                { value: 'minor pentatonic', label: 'Minor Pentatonic' },
                { value: 'ionian pentatonic', label: 'Ionian Pentatonic' },
                { value: 'lydian pentatonic', label: 'Lydian Pentatonic' },
                { value: 'locrian pentatonic', label: 'Locrian Pentatonic' },
                { value: 'egyptian', label: 'Egyptian' },
                { value: 'pelog', label: 'Pelog' },
                { value: 'kumoijoshi', label: 'Kumoijoshi' },
                { value: 'hirajoshi', label: 'Hirajoshi' },
                { value: 'iwato', label: 'Iwato' },
                { value: 'in-sen', label: 'In-Sen' }
            ]
        },
        {
            label: '6 Note',
            options: [
                { value: 'major blues', label: 'Major Blues' },
                { value: 'minor blues', label: 'Minor Blues' },
                { value: 'minor hexatonic', label: 'Minor Hexatonic' },
                { value: 'augmented', label: 'Augmented' },
                { value: 'prometheus', label: 'Prometheus' },
            ]
        },
        {
            label: '7 Note',
            options: [
                { value: 'major', label: 'Major' },
                { value: 'minor', label: 'Minor' },
                { value: 'locrian', label: 'Locrian' },
                { value: 'locrian major', label: 'Locrian Major' },
                { value: 'harmonic minor', label: 'Harmonic Minor' },
                { value: 'harmonic major', label: 'Harmonic Major' },
                { value: 'lydian', label: 'Lydian' },
                { value: 'lydian minor', label: 'Lydian Minor' },
                { value: 'lydian augmented', label: 'Lydian Augmented' },
                { value: 'lydian diminished', label: 'Lydian Diminished' },
                { value: 'melodic minor', label: 'Melodic Minor' },
                { value: 'oriental', label: 'Oriental' },
                { value: 'mixolydian', label: 'Mixolydian' },
                { value: 'enigmatic', label: 'Enigmatic' },
                { value: 'persian', label: 'Persian' }
            ]
        },
        {
            label: '8 Note',
            options: [
                { value: 'bebop', label: 'Bebop' },
                { value: 'bebop minor', label: 'Bebop Minor' },
                { value: 'bebop major', label: 'Bebop Major' },
                { value: 'bebop locrian', label: 'Bebop Locrian' }
            ]
        }
    ]
};

const chordTypeSelectData = {
    id: 'chord-type-select',
    label: 'Chord Type',
    optionGroups: [
        {
            label: 'Major',
            options: [
                { value: 'major', label: 'Major' },
                { value: 'major seventh', label: 'Major Seventh' },
                { value: 'major ninth', label: 'Major Ninth' },
                { value: 'major thirteenth', label: 'Major Thirteenth' },
                { value: 'sixth', label: 'Sixth' },
                { value: 'sixth/ninth', label: 'Sixth/Ninth' },
                { value: 'lydian', label: 'Lydian' },
                { value: 'major seventh b6', label: 'Major Seventh flat Six' }
            ]
        },
        {
            label: 'Minor',
            options: [
                { value: 'minor', label: 'Minor' },
                { value: 'minor seventh', label: 'Minor Seventh' },
                { value: 'minor/major seventh', label: 'Minor/Major Seventh' },
                { value: 'minor sixth', label: 'Minor Sixth' },
                { value: 'minor ninth', label: 'Minor Ninth' },
                { value: 'minor eleventh', label: 'Minor Eleventh' },
                { value: 'minor thirteenth', label: 'Minor Thirteenth' },
                { value: 'diminished', label: 'Diminished' },
                { value: 'diminished seventh', label: 'Diminished Seventh' },
                { value: 'half-diminished', label: 'Half-Diminished' }
            ]
        },
        {
            label: 'Dominant/Seventh',
            options: [
                { value: 'dominant seventh', label: 'Dominant Seventh' },
                { value: 'dominant ninth', label: 'Dominant Ninth' },
                { value: 'dominant thirteenth', label: 'dominant thirteenth' },
                { value: 'lydian dominant seventh', label: 'Lydian Dominant Seventh' },
                { value: 'dominant b9', label: 'Dominant flat Nine' },
                { value: 'dominant #9', label: 'Dominant sharp Nine' },
                { value: 'altered', label: 'Altered' },
                { value: 'suspended 4th', label: 'Suspended Fourth' },
                { value: 'suspended 2nd', label: 'Suspended Second' },
                { value: 'suspended 4th seventh', label: 'Suspended Fourth Seventh' },
                { value: 'eleventh', label: 'Eleventh' },
                { value: 'suspended 4th b9', label: 'Suspended Fourth flat Nine' },
                { value: 'fifth', label: 'Fifth' },
                { value: 'augmented', label: 'Augmented' },
                { value: 'augmented seventh', label: 'Augmented Seventh' },
                { value: 'major #11 (lydian)', label: 'Major sharp Eleven' },
            ]
        }
    ]
};

const toggleScaleHighlightingCheckboxData = {
    id: 'display-scale-toggle',
    label: 'Show Scale Highlighting'
};

const transportButtonsData = [
    { label: 'Play' },
    { label: 'Pause' },
    { label: 'Stop' }
];

const historyButtonsData = [
    { label: 'Undo' },
    { label: 'Redo' }
];

const activeToolRadioGroupData = {
	name: 'active-tool-radio-group',
	options: [
		{
			id: 'cursor',
			icon: 'mouse',
			value: Tools.cursor
		},
		{
			id: 'pencil',
			icon: 'create',
			value: Tools.pencil
		},
		{
			id: 'marquee',
			icon: 'select_all',
			value: Tools.marquee
		}
	]
}

interface CheckboxData {
    id: string,
    label: string
}

interface ButtonData {
    label: string
}

interface SelectOptionData {
    value: string,
    label: string
}

interface SelectOptionGroup {
    label: string,
    options: SelectOptionData[]
}

interface SelectData {
    id: string,
    label: string,
    options?: SelectOptionData[],
    optionGroups?: SelectOptionGroup[]
}

interface RadioButtonData {
	id: string,
	icon: string,
	value: string
}

interface RadioGroupData {
	name: string,
	options: RadioButtonData[]
}

const generateSelectOptions = (options: SelectOptionData[], currentValue: string) => html`
    ${repeat(
        options,
        option => option.value,
        option => html`
            <option 
                value=${option.value}
                ?selected=${currentValue === option.value}
            >
                ${option.label}
            </option>
            `
    )}
`;

const generateSelectOptionGroups = (optionGroups: SelectOptionGroup[], currentValue: string) => html`
    ${repeat(
        optionGroups,
        optionGroup => optionGroup.label,
        optionGroup => html`
            <optgroup label=${optionGroup.label}>
                ${generateSelectOptions(optionGroup.options, currentValue)}
            </optgroup>
        `
    )}
`;




const generateSelectMarkup = (data: SelectData, currentValue: string, onChangeCb: Function) => html`
    <div class="control__container">
        <label class="control__label" for=${data.id}>${data.label}</label>
        <select class="control" id=${data.id} @change=${onChangeCb}>
            ${data.optionGroups ?
                generateSelectOptionGroups(data.optionGroups, currentValue) :
                generateSelectOptions(data.options, currentValue)
            }
        </select>
    </div>
`;

const generateCheckboxMarkup = (data: CheckboxData, isChecked: boolean, handleChange: Function) => html`
    <div class="checkbox__container">
        <label class="checkbox__label" for=${data.id}>${data.label}</label>
        <input 
            class="checkbox" 
            .checked=${isChecked} 
            type="checkbox" 
            id=${data.id}
            @change=${handleChange} 
        />
    </div>
`;

const generateButtonMarkup = (icon: string, handleClick: Function) => html`
    <button class="button" @click=${handleClick}>
        <i class="material-icons">${icon}</i>
    </button>
`;

const generateRadioGroupMarkup = (data: RadioGroupData, currentValue, handleChange) => html`
    <div class="radio-group">
		${repeat(
			data.options,
			option => option.id,
			option => html`
				<input
					class="radio-group__button" 
					id=${option.id}
					type="radio"
					name=${data.name}
                    value=${option.value}
                    .checked=${option.value === currentValue}
                    @change=${handleChange}
				/>
				<label
					class="radio-group__label" 
					for=${option.id}
                >
                    <i class="material-icons">${option.icon}</i>
                </label>
			`
		)}
    </div>
`;

const generateBpmControlMarkup = (currentValue, handleChange) => html`
    <div class="control__container">
        <label for="bpm-control" class="control__label">BPM</label>
        <input
            id="bpm-control"
            class="control"
            type="number"
            min="40"
            max="320"
            value=${currentValue}
            @change=${handleChange}
        />
    </div>
`;

export const generateMenubarMarkup = ({
    quantizeValue,
    setQuantizeValue,
    noteDurationValue,
    setNoteDurationValue,
    scaleKey,
    setScaleKey,
    scaleType,
    setScaleType,
    shouldShowScaleHighlights,
    toggleScaleHighlightsVisibility,
    chordType,
    setChordType,
    playTrack,
    pauseTrack,
    stopTrack,
    undoAction,
    redoAction,
    activeTool,
    setActiveTool,
    bpm,
    setBpm
}) => html`
    <div class="menubar">
        <div class="menubar__content-container">
            <div class="menubar__controls-group">
                ${generateSelectMarkup(quantizeSelectData, quantizeValue, setQuantizeValue)}
                ${generateSelectMarkup(noteDurationSelectData, noteDurationValue, setNoteDurationValue)}
            </div>
            <div class="menubar__controls-group">
                ${generateSelectMarkup(scaleKeySelectData, scaleKey, setScaleKey)}
                ${generateSelectMarkup(scaleTypeSelectData, scaleType, setScaleType)}
                ${generateCheckboxMarkup(
                    toggleScaleHighlightingCheckboxData, 
                    shouldShowScaleHighlights, 
                    toggleScaleHighlightsVisibility
                )}
            </div>
            <div class="menubar__controls-group">
                ${generateSelectMarkup(chordTypeSelectData, chordType, setChordType)}
            </div>
            <div class="menubar__controls-group">
                ${generateBpmControlMarkup(bpm, setBpm)}
            </div>
		</div>
		<div class="menubar__content-container">
			<div class="menubar__controls-group">
                ${generateButtonMarkup('play_arrow', playTrack)}
                ${generateButtonMarkup('pause', pauseTrack)}
                ${generateButtonMarkup('stop', stopTrack)}
			</div>
			<div class="menubar__controls-group">
                ${generateButtonMarkup('undo', undoAction)}
                ${generateButtonMarkup('redo', redoAction)}
            </div>
            ${generateRadioGroupMarkup(activeToolRadioGroupData, activeTool, setActiveTool)}
        </div>
    </div>
`;


/*

<div class="menubar__controls-group">
                ${repeat(
                    historyButtonsData,
                    buttonData => buttonData.label,
                    buttonData => generateButtonMarkup(buttonData)
                )}
            </div>


*/

export const generateTaskbarMarkup = (activeWindows: Window[]) => html`
    <div class="taskbar">
        <ul class="taskbar__list" id="taskbar-list">
            ${repeat(
                activeWindows,
                activeWindow => `${activeWindow.id}-taskbar`,
                activeWindow => html`
                    <li 
                        class="taskbar__item" 
                        data-window-id=${activeWindow.id} 
                        @click=${activeWindow.toggleMinimize}
                    >
                        ${activeWindow.title}
                    </li>
                `
            )}
        </ul>
    </div>
`;

export const generateWindowsMarkup = (activeWindows: Window[]) => html`
    ${repeat(
        activeWindows,
        activeWindow => activeWindow.id,
        (activeWindow, idx) => {
            return activeWindow.displayMode === WindowDisplayModes.minimized ? 
            nothing : 
            activeWindow.generateMarkup();
        }
    )}
`;
