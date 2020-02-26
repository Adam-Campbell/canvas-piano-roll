import { Tools } from '../Constants';
 
export const quantizeSelectData = {
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

export const noteDurationSelectData = {
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

export const scaleKeySelectData = {
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
};

export const scaleTypeSelectData = {
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

export const chordTypeSelectData = {
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

export const toggleScaleHighlightingCheckboxData = {
    id: 'display-scale-toggle',
    label: 'Show Scale Highlighting'
};

export const activeToolRadioGroupData = {
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
};
