type SoundName = "kick" | "goal" | "tackle" | "orb" | "skill" | "ui" | "whistle" | "save" | "win" | "lose";

let ctx: AudioContext | null = null;
let enabled = true;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

export function unlockAudio(): void {
  if (!enabled) return;
  getCtx();
}

function tone(
  frequency: number,
  duration: number,
  type: OscillatorType,
  gain: number,
  slideTo?: number,
  delay = 0
): void {
  const audio = getCtx();
  if (!audio) return;
  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(20, frequency), start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), start + duration);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noise(duration: number, gain: number, delay = 0, filterFreq = 1400): void {
  const audio = getCtx();
  if (!audio) return;
  const sampleCount = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, sampleCount, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.9;
  const amp = audio.createGain();
  amp.gain.setValueAtTime(gain, audio.currentTime + delay);
  amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + delay + duration);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(audio.destination);
  src.start(audio.currentTime + delay);
}

export function playSound(name: SoundName): void {
  if (!enabled) return;
  switch (name) {
    case "kick":
      tone(150, 0.1, "triangle", 0.12, 60);
      noise(0.06, 0.07, 0, 900);
      break;
    case "goal":
      tone(392, 0.14, "sawtooth", 0.09, 523);
      tone(523, 0.16, "sawtooth", 0.09, 659, 0.1);
      tone(784, 0.32, "triangle", 0.1, 1046, 0.2);
      noise(0.5, 0.045, 0.05, 2200);
      break;
    case "tackle":
      tone(90, 0.18, "square", 0.1, 45);
      noise(0.12, 0.09, 0, 500);
      break;
    case "orb":
      tone(880, 0.06, "sine", 0.07, 1320);
      tone(1320, 0.09, "sine", 0.05, 1760, 0.04);
      break;
    case "skill":
      tone(220, 0.24, "sawtooth", 0.07, 880);
      noise(0.24, 0.045, 0, 2800);
      break;
    case "save":
      tone(260, 0.12, "square", 0.07, 130);
      noise(0.12, 0.07, 0, 1100);
      break;
    case "whistle":
      tone(1760, 0.13, "sine", 0.06, 1860);
      tone(1760, 0.15, "sine", 0.05, 1720, 0.16);
      break;
    case "win":
      tone(523, 0.12, "triangle", 0.1, 659);
      tone(659, 0.12, "triangle", 0.1, 784, 0.12);
      tone(1046, 0.5, "triangle", 0.1, 1318, 0.24);
      break;
    case "lose":
      tone(330, 0.24, "triangle", 0.08, 220);
      tone(220, 0.4, "triangle", 0.07, 130, 0.18);
      break;
    case "ui":
    default:
      tone(660, 0.045, "sine", 0.035, 780);
      break;
  }
}
