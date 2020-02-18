import { 
    Colours,
    KonvaLineData 
} from '../../Constants';


/**
 * Constructs and returns an array containing the data that can be used to create the Konva.Line elements 
 * for the horizontal grid lines. 
 */
export const getHorizontalLinesData = (gridWidthPx: number) : KonvaLineData[] => {
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

/**
 * Constructs and returns an array containing the data that can be used to create the Konva.Line elements
 * for the vertical grid lines. 
 */
export const getVerticalLinesData = (numBars: number, barWidthPx: number, 
    colWidthPx: number, gridHeightPx: number) : KonvaLineData[] => {
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
