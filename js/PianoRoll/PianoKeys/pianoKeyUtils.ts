import { 
    Colours, 
    Pitch, 
    StaticMeasurements 
} from '../../Constants';

export const staticKeyProps = {
    x: 0,
    stroke: Colours.grayscale[8],
    strokeWidth: 2
};

interface KeyProps {
    x: number,
    y: number,
    width: number,
    height: number,
    fill: string,
    originalFill: string,
    stroke: string,
    strokeWidth: number,
    cornerRadius?: number[],
    pitch: Pitch,
    id: string
}

export const getKeyProps = (pitch: Pitch, idx: number) : KeyProps => {
    const approxY = idx * StaticMeasurements.rowHeight;
    const noteIdx = idx % 12;
    switch (noteIdx) {
        case 1:
        case 3:
        case 5:
        case 8:
        case 10:
            return {
                ...staticKeyProps,
                y: approxY,
                width: 90,
                height: 20,
                fill: Colours.grayscale[8],
                originalFill: Colours.grayscale[8],
                cornerRadius: [0, 3, 3, 0],
                pitch,
                id: pitch.full
            };
        case 6:
        case 11:
            return {
                ...staticKeyProps,
                y: approxY - 10,
                width: 120,
                height: 30,
                fill: 'white',
                originalFill: 'white',
                pitch,
                id: pitch.full

            };
        case 0:
        case 7:
            return {
                ...staticKeyProps,
                y: approxY,
                width: 120,
                height: 30,
                fill: 'white',
                originalFill: 'white',
                pitch,
                id: pitch.full
            };
        case 2:
        case 4:
        case 9:
            return {
                ...staticKeyProps,
                y: approxY - 10,
                width: 120,
                height: 40,
                fill: 'white',
                originalFill: 'white',
                pitch,
                id: pitch.full
            };
    }
};

export const sortByColor = (a: KeyProps, b: KeyProps) : number => {
    if (a.fill < b.fill) {
        return 1;
    } else if (a.fill > b.fill) {
        return -1;
    } else {
        return 0;
    }
};
