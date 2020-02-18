import { 
    KonvaLineData,
    Colours 
} from '../../Constants';

/**
 * Constructs and returns an array containing the data that can be used to create the Konva.Line elements 
 * for the horizontal grid lines. 
 */
export const getHorizontalLinesData = (numChannels: number, channelHeight: number, gridWidth: number) : KonvaLineData[] => {
    let lineDataArr = [];
    for (let i = 0; i <= numChannels; i++) {
        lineDataArr.push({
            points: [ 0, i*channelHeight, gridWidth, i*channelHeight ],
            stroke: Colours.grayscale[7],
            strokeWidth: 1
        });
    }
    return lineDataArr;
};

/**
 * Constructs and returns an array containing the data that can be used to create the Konva.Line elements
 * for the vertical grid lines. 
 */
export const getVerticalLinesData = (numBars: number, barWidth: number, gridHeight: number) : KonvaLineData[] => {
    let lineDataArr = [];
    for (let i = 0; i <= numBars; i++) {
        lineDataArr.push({
            points: [ i*barWidth, 0, i*barWidth, gridHeight ],
            stroke: Colours.grayscale[7],
            strokeWidth: 1
        });
    }
    return lineDataArr;
};