import Tone from 'tone';

export const initButtons = () => {
    const startButton = document.getElementById('start-button');
    const stopButton = document.getElementById('stop-button');
    startButton.addEventListener('click', e => {
        Tone.Transport.start();
    });
    stopButton.addEventListener('click', e => {
        Tone.Transport.stop();
    });
}