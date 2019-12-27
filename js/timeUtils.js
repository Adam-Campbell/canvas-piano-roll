export const TICKS_PER_BAR = 768;

const qValues = {
    '32t': 48,
    '32n': 32,
    '16t': 24,
    '16n': 16,
    '8t': 12,
    '8n': 8,
    '4t': 6,
    '4n': 4,
    '2t': 3,
    '2n': 2,
    '1m': 1
};

export const getDurationAsTicks = (quantizeValue, numberOfQuantizeUnits) => {
    const quantizeUnitsPerBar = qValues[quantizeValue] || 16;
    const ticksPerQuantizeUnit = TICKS_PER_BAR / quantizeUnitsPerBar;
    const durationAsTicks = ticksPerQuantizeUnit * numberOfQuantizeUnits;
    return durationAsTicks;
};