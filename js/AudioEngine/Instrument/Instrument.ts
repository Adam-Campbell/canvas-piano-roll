import Tone from 'tone';
import { InstrumentPresets } from '../../Constants';
import { 
    padInstrumentSettings,
    bassInstrumentSettings,
    leadInstrumentSettings
} from '../AudioEngineConstants/InstrumentSettings';

const settingsDict = {
    [InstrumentPresets.arps]: padInstrumentSettings,
    [InstrumentPresets.echoLead]: bassInstrumentSettings,
    [InstrumentPresets.etherealPads]: leadInstrumentSettings,
    [InstrumentPresets.fatSquare]: padInstrumentSettings,
    [InstrumentPresets.hardBass]: bassInstrumentSettings,
    [InstrumentPresets.sawPads]: leadInstrumentSettings,
    [InstrumentPresets.softSynth]: padInstrumentSettings,
    [InstrumentPresets.wubBass]: bassInstrumentSettings 
}

export default class Instrument {

    preset: InstrumentPresets;
    private synth: Tone.PolySynth;

    constructor(preset: InstrumentPresets) {
        this.preset = preset;
        this.synth = this.produceSynth(this.preset);
    }

    private cleanupSynth() : void {
        this.synth.disconnect(Tone.Master);
        this.synth.dispose();
        this.synth = null;
    }

    private produceSynth(preset: InstrumentPresets) : void {
        const instrumentSettings = settingsDict[preset]; 
        const synth = new Tone.PolySynth(12, Tone.Synth).toMaster();
        synth.set(instrumentSettings);
        return synth;
    }

    updatePreset(preset: InstrumentPresets) : void {
        this.preset = preset;
        this.cleanupSynth();
        this.synth = this.produceSynth(preset);
    }

    triggerAttackRelease(note: string, duration: string, time: number, velocity: number) : void {
        this.synth.triggerAttackRelease(note, duration, time, velocity);
    }

    triggerAttack(pitch) : void {
        this.synth.triggerAttack(pitch);
    }

    triggerRelease(pitch) : void {
        this.synth.triggerRelease(pitch);
    }


}