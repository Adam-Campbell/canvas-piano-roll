import { render, html, nothing } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import {
    quantizeSelectData,
    noteDurationSelectData,
    scaleKeySelectData,
    scaleTypeSelectData,
    chordTypeSelectData,
    toggleScaleHighlightingCheckboxData,
    activeToolRadioGroupData
} from './templateData';
import {
    CheckboxData,
    ButtonData,
    SelectOptionData,
    SelectOptionGroup,
    SelectData,
    RadioButtonData,
    RadioGroupData,
    GenerateMenubarMarkupOptions
} from './templateTypes';


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
}: GenerateMenubarMarkupOptions) => html`
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

