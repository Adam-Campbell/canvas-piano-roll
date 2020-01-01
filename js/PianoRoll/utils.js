const isInRange = (point, rangeMin, rangeMax) => {
    return point >= rangeMin && point <= rangeMax;
}

const pointIsInRange = (pointX, pointY, rangeX1, rangeX2, rangeY1, rangeY2) => {
    return isInRange(pointX, rangeX1, rangeX2) &&
        isInRange(pointY, rangeY1, rangeY2);
};

const isContained = (entityA_X1, entityA_X2, entityA_Y1, entityA_Y2, entityB_X1, entityB_X2, entityB_Y1, entityB_Y2) => {
    return pointIsInRange(entityA_X1, entityA_Y1, entityB_X1, entityB_X2, entityB_Y1, entityB_Y2) ||
        pointIsInRange(entityA_X1, entityA_Y2, entityB_X1, entityB_X2, entityB_Y1, entityB_Y2) ||
        pointIsInRange(entityA_X2, entityA_Y1, entityB_X1, entityB_X2, entityB_Y1, entityB_Y2) ||
        pointIsInRange(entityA_X2, entityA_Y2, entityB_X1, entityB_X2, entityB_Y1, entityB_Y2);
}

export const doesOverlap = (entityA_X1, entityA_X2, entityA_Y1, entityA_Y2, entityB_X1, entityB_X2, entityB_Y1, entityB_Y2) => {
    return isContained(entityA_X1, entityA_X2, entityA_Y1, entityA_Y2, entityB_X1, entityB_X2, entityB_Y1, entityB_Y2) ||
        isContained(entityB_X1, entityB_X2, entityB_Y1, entityB_Y2, entityA_X1, entityA_X2, entityA_Y1, entityA_Y2);
}

export const canShiftUp = (notes) => {
    for (let note of notes) {
        if (note.attrs.y <= 0) {
            return false;
        }
    }
    return true;
};

export const canShiftDown = (notes, limit) => {
    for (let note of notes) {
        if (note.attrs.y + note.attrs.height + 1 >= limit) {
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