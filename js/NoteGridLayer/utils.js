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