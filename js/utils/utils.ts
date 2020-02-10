export const clamp = (num, lowerBound, upperBound) => {
    return Math.max(
        lowerBound,
        Math.min(upperBound, num)
    );
};

export const pipe = (...fns) => (input) => fns.reduce((total, fn) => fn(total), input);

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