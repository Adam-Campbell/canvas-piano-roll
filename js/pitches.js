const notes = ['B', 'A#', 'A','G#', 'G', 'F#', 'F', 'E', 'D#', 'D', 'C#', 'C'];
const octaves = ['8', '7', '6', '5', '4', '3', '2', '1', '0'];

const constructPitchesArray = () => {
    let pitchesArray = [];
    for (let octave of octaves) {
        for (let note of notes) {
            pitchesArray.push(note + octave);
        }
    }
    return pitchesArray;
};

export const pitchesArray = constructPitchesArray();

export const getPitchAtIndex = (idx) => {
    const octaveIdx = Math.floor(idx / 12);
    const noteIdx = idx % 12;
    return notes[noteIdx] + octaves[octaveIdx];
};