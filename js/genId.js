let currentId = 0;

export const genId = () => {
    const num = currentId++;
    return num.toString();
};