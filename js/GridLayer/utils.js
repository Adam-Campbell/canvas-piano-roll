import { NOTES_GRID_WIDTH, NOTES_GRID_HEIGHT, BAR_WIDTH } from '../constants';

export const qValues = {
    '32t': 48,
    '32n': 32,
    '16t': 24,
    '16n': 16,
    '8t': 12,
    '8n': 8,
    '4t': 6,
    '4n': 4,
    '2t': 3,
    '2n': 2,
    '1m': 1
};

export const noteDurationTicks = {
    '32t': 16,
    '32n': 24,
    '16t': 32,
    '16n': 48,
    '8t': 64,
    '8n': 96,
    '4t': 128,
    '4n': 192,
    '2t': 256,
    '2n': 384,
    '1m': 768
}

// export const getHorizontalLinesData = () => {
//     let linesArr = [];
//     for (let i = 0; i < 109; i++) {
//         linesArr.push({
//             points: [ 0, i*20, NOTES_GRID_WIDTH, i*20 ],
//             stroke: '#222',
//             strokeWidth: 1
//         });
//     }
//     return linesArr;
// }

export const getHorizontalLinesData = (gridWidthPx) => {
    let linesArr = [];
    for (let i = 0; i < 109; i++) {
        linesArr.push({
            points: [ 0, i*20, gridWidthPx, i*20 ],
            stroke: '#222',
            strokeWidth: 1
        });
    }
    return linesArr;
}

export const getVerticalLinesData = (numBars, barWidthPx, colWidthPx, gridHeightPx) => {
    let gridLines = [];
    let total = 0;
    let escapeHatch = 0;
    //const beatUnit = BAR_WIDTH / qValues[qVal];
    while (total < numBars * barWidthPx && escapeHatch < 1000) {
        let strokeWidth;
        if (total % barWidthPx === 0) {
            strokeWidth = 2;
        } else if (total % (barWidthPx / 4) === 0) {
            strokeWidth = 1;
        } else {
            strokeWidth = 0.5;
        }
        gridLines.push({
            points: [ total, 0, total, gridHeightPx ],
            stroke: total % barWidthPx === 0 ? '#222' : '#666',
            strokeWidth
        })
        total += colWidthPx;
        escapeHatch++;
    }
    return gridLines;
};


// export const getVerticalLinesData = (numBars, qVal) => {
//     let gridLines = [];
//     let total = 0;
//     let escapeHatch = 0;
//     const beatUnit = BAR_WIDTH / qValues[qVal];
//     while (total < numBars * BAR_WIDTH && escapeHatch < 1000) {
//         let strokeWidth;
//         if (total % BAR_WIDTH === 0) {
//             strokeWidth = 2;
//         } else if (total % (BAR_WIDTH / 4) === 0) {
//             strokeWidth = 1;
//         } else {
//             strokeWidth = 0.5;
//         }
//         gridLines.push({
//             points: [ total, 0, total, NOTES_GRID_HEIGHT ],
//             stroke: total % BAR_WIDTH === 0 ? '#222' : '#666',
//             strokeWidth
//         })
//         total += beatUnit;
//         escapeHatch++;
//     }
//     return gridLines;
// };

export const getTimeString = (numBeats, currentQuantize) => {
    let remainingBeatUnits;
    const beatUnitsPerBar = qValues[currentQuantize];
    const bars = Math.floor(numBeats / beatUnitsPerBar);
    remainingBeatUnits = numBeats - (bars * beatUnitsPerBar);
    const beats = Math.floor(remainingBeatUnits / (beatUnitsPerBar / 4));
    remainingBeatUnits = remainingBeatUnits - (beats * (beatUnitsPerBar / 4));
    // console.log({
    //     bars,
    //     beats,
    //     remainingBeatUnits
    // });
    const timeString = `${bars}:${beats}:${remainingBeatUnits}`;
    return timeString;
}
