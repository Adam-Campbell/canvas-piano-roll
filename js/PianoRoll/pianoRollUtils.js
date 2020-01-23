
const isInRange = (point, rangeMin, rangeMax) => {
    return point >= rangeMin && point <= rangeMax;
}

const doesOverlapAlongAxis = (a1, a2, b1, b2) => {
    return isInRange(a1, b1, b2) || isInRange(a2, b1, b2) || isInRange(b1, a1, a2) || isInRange(b2, a1, a2);
}

export const doesOverlap = (A_x1, A_x2, A_y1, A_y2, B_x1, B_x2, B_y1, B_y2) => {
    return doesOverlapAlongAxis(A_x1, A_x2, B_x1, B_x2) &&
        doesOverlapAlongAxis(A_y1, A_y2, B_y1, B_y2);
}

export const canShiftUp = (notes, shiftAmount) => {
    for (let note of notes) {
        if (note.attrs.y - shiftAmount < 0) {
            return false;
        }
    }
    return true;
};

export const canShiftDown = (notes, limit, shiftAmount) => {
    for (let note of notes) {
        if (note.attrs.y + note.attrs.height + shiftAmount > limit) {
            return false;
        }
    }
    return true;
};

export const canShiftLeft = (notes) => {
    for (let note of notes) {
        if (note.attrs.x <= 0) {
            return false;
        }
    }
    return true;
};

export const canShiftRight = (notes, limit) => {
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