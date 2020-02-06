import Konva from 'konva';

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
