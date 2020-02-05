import { Colours } from '../Constants';

interface LineData {
    points: number[],
    stroke: string,
    strokeWidth: number
}

export const getHorizontalLinesData = (gridWidthPx: number) : LineData[] => {
    let linesArr = [];
    for (let i = 0; i < 109; i++) {
        linesArr.push({
            points: [ 0, i*20, gridWidthPx, i*20 ],
            stroke: Colours.grayscale[7],
            strokeWidth: 1
        });
    }
    return linesArr;
}

export const getVerticalLinesData = (numBars: number, barWidthPx: number, 
    colWidthPx: number, gridHeightPx: number) : LineData[] => {
    let gridLines = [];
    let total = 0;
    let escapeHatch = 0;
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
            stroke: total % barWidthPx === 0 ? Colours.grayscale[7] : Colours.grayscale[4],
            strokeWidth
        });
        total += colWidthPx;
        escapeHatch++;
    }
    return gridLines;
};
