export const clamp = (num, lowerBound, upperBound) => {
    return Math.max(
        lowerBound,
        Math.min(upperBound, num)
    );
}