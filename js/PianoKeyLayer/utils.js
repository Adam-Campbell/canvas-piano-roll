import { ROW_HEIGHT } from '../constants';


export const staticKeyProps = {
    x: 0,
    stroke: 'black',
    strokeWidth: 2
};

export const getKeyProps = (pitch, idx) => {
    const approxY = idx * ROW_HEIGHT;
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
                fill: 'black',
                originalFill: 'black',
                pitch,
                id: pitch
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
                id: pitch

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
                id: pitch
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
                id: pitch
            };
    }
};

export const sortByColor = (a, b) => {
    if (a.fill < b.fill) {
        return 1;
    } else if (a.fill > b.fill) {
        return -1;
    } else {
        return 0;
    }
};
