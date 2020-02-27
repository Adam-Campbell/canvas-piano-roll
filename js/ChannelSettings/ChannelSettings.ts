import { render, html, nothing } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import { 
    WindowChild,
    Events,
    InstrumentPresets
} from '../Constants';
import EventEmitter from '../EventEmitter';
import SettingsManager from '../SettingsManager';
import Channel from '../AudioEngine/Channel';

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

const instrumentPresetsData = {
    id: 'instrument-select',
    label: 'Instrument',
    options: [
        { value: InstrumentPresets.arps, label: 'Arps' },
        { value: InstrumentPresets.echoLead, label: 'Echo Lead' },
        { value: InstrumentPresets.etherealPads, label: 'Ethereal Pads' },
        { value: InstrumentPresets.fatSquare, label: 'Fat Square' },
        { value: InstrumentPresets.hardBass, label: 'Hard Bass' },
        { value: InstrumentPresets.sawPads, label: 'Saw Pads' },
        { value: InstrumentPresets.softSynth, label: 'Soft Synth' },
        { value: InstrumentPresets.wubBass, label: 'Wub Bass' },
    ]
};

const generateSelectOptions = (options: SelectOptionData[], currentValue: string) => html`
    ${repeat(
        options,
        option => option.value,
        option => html`
            <option 
                value=${option.value}
                .selected=${currentValue === option.value}
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


export default class ChannelSettings implements WindowChild {

    private containerNode;
    private eventEmitter: EventEmitter;
    private settingsManager: SettingsManager;
    private channel: Channel;

    constructor(eventEmitter: EventEmitter, settingsManager: SettingsManager) {
        this.eventEmitter = eventEmitter;
        this.settingsManager = settingsManager;
    }

    init({
        container,
        channel
    }) {
        this.containerNode = container;
        this.channel = channel;
        this.render();
        this.eventEmitter.subscribe(Events.triggerUIRender, this.render);
    }

    cleanup() {

    }

    handleResize() {

    }


    handleInstrumentUpdate = (e) => {
        console.log(`New instrument: ${e.target.value}`);
        this.channel.updateInstrument(e.target.value);
        this.eventEmitter.emit(Events.addStateToStack);
        this.eventEmitter.emit(Events.triggerUIRender);
    }

    render = () => {
        console.log('channel settings render was called')
        render(
            html`
                <div class="channel-settings">
                    <h1 class="channel-settings__title">${this.channel.name} Settings</h1>
                    ${generateSelectMarkup(
                        instrumentPresetsData, 
                        this.channel.instrumentPreset, 
                        this.handleInstrumentUpdate
                    )}
                </div>
            `,
            this.containerNode
        );
    }

}