import Konva from 'konva';

const isInRange = (point: number, rangeMin: number, rangeMax: number) : boolean => {
    return point >= rangeMin && point <= rangeMax;
}

const doesOverlapAlongAxis = (a1: number, a2: number, b1: number, b2: number) : boolean => {
    return isInRange(a1, b1, b2) || isInRange(a2, b1, b2) || isInRange(b1, a1, a2) || isInRange(b2, a1, a2);
}

export const doesOverlap = (A_x1: number, A_x2: number, A_y1: number, A_y2: number, B_x1: number, B_x2: number, B_y1: number, B_y2: number) : boolean => {
    return doesOverlapAlongAxis(A_x1, A_x2, B_x1, B_x2) &&
        doesOverlapAlongAxis(A_y1, A_y2, B_y1, B_y2);
}

export const canShiftUp = (notes: Konva.Rect[], shiftAmount: number) : boolean=> {
    for (let note of notes) {
        if (note.attrs.y - shiftAmount < 0) {
            return false;
        }
    }
    return true;
};

export const canShiftDown = (notes: Konva.Rect[], limit: number, shiftAmount: number) : boolean => {
    for (let note of notes) {
        if (note.attrs.y + note.attrs.height + shiftAmount > limit) {
            return false;
        }
    }
    return true;
};

export const canShiftLeft = (notes: Konva.Rect[]) : boolean => {
    for (let note of notes) {
        if (note.attrs.x <= 0) {
            return false;
        }
    }
    return true;
};

export const canShiftRight = (notes: Konva.Rect[], limit: number) : boolean => {
    for (let note of notes) {
        if (note.attrs.x + note.attrs.width + 1 >= limit) {
            return false;
        }
    }
    return true;
};

export const easingFns = {
    linear: x => x,
    easeIn: x => x * x,
    easeOut: x => x * (2 - x),
    easeInOut: x => x < 0.5 ? 2 * x * x : -1 + (4 - 2 * x) * x
};
