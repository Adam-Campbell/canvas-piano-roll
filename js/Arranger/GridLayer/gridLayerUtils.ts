import { 
    KonvaLineData,
    Colours 
} from '../../Constants';

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