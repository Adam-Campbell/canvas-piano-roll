import Konva from 'konva';

export const canShiftUp = (rects: Konva.Rect[], shiftAmount: number) : boolean=> {
    for (const rect of rects) {
        if (rect.attrs.y - shiftAmount < 0) {
            return false;
        }
    }
    return true;
};

export const canShiftDown = (rects: Konva.Rect[], limit: number, shiftAmount: number) : boolean => {
    for (const rect of rects) {
        if (rect.attrs.y + rect.attrs.height + shiftAmount > limit) {
            return false;
        }
    }
    return true;
};

export const canShiftLeft = (rects: Konva.Rect[]) : boolean => {
    for (const rect of rects) {
        if (rect.attrs.x <= 0) {
            return false;
        }
    }
    return true;
};

export const canShiftRight = (rects: Konva.Rect[], limit: number, shiftAmount: number) : boolean => {
    for (const rect of rects) {
        if (rect.attrs.x + rect.attrs.width + shiftAmount > limit) {
            return false;
        }
    }
    return true;
};
