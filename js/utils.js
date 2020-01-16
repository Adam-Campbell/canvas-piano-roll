export const clamp = (num, lowerBound, upperBound) => {
    return Math.max(
        lowerBound,
        Math.min(upperBound, num)
    );
};

export const pipe = (...fns) => (input) => fns.reduce((total, fn) => fn(total), input);