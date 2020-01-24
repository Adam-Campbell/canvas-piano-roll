// green
const malachite = {
    main: '#07da74',
    lightened: '#1de283',
    darkened: '#0bc56b'
};

// blue
const cerulean = {
    main: '#07b3da',
    lightened: '#23c7ec',
    darkened: '#068cab'
};

// red
const monza = {
    main: '#da0729',
    lightened: '#fda4b2',
    darkened: '#b10521'
};

const blueGrayScale = {
    1: '#daf0f5',
    2: '#bad3d8',
    3: '#9bb2b7',
    4: '#6d8084',
    5: '#4c5a5d',
    6: '#323a3c'
};

const currentGrayScale = {
    1: '#dadada',
    2: '#acacac',
    3: '#6d6d6d',
    4: '#666',
    5: '#555',
    6: '#333',
    7: '#222',
    8: '#0b0b0b'
}


/*

Current grayscale:

#dadada - grid background

#acacac - transport area background and velocity layer background

#6d6d6d - scrollbar thumb

#666 - lighter grid lines

#333 - scrollbar track

#222 - darker grid lines







*/

export default {
    primary: malachite,
    secondary: monza,
    tertiary: cerulean,
    grayscale: currentGrayScale
}