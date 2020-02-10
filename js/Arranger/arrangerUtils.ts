export const getBarNumFromBBSString = (startString: string) : number => {
    const barString = startString.split(':')[0];
    return parseInt(barString);
}