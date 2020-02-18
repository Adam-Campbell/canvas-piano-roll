
/**
 * Parses a BBS string (format: '0:0:0') to retrieve the bar number, converted into a number.
 */
export const getBarNumFromBBSString = (startString: string) : number => {
    const barString = startString.split(':')[0];
    return parseInt(barString);
}