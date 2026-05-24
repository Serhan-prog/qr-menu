let audioContext;
let soundReady = false;

function audioContextClass() {
  return window.AudioContext || window.webkitAudioContext;
}

async function getAudioContext() {
  const AudioContextClass = audioContextClass();
  if (!AudioContextClass) {
    return null;
  }

  audioContext = audioContext || new AudioContextClass();
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  soundReady = audioContext.state === 'running';
  return audioContext;
}

export async function enableNotificationSound() {
  try {
    const context = await getAudioContext();
    if (!context) {
      return false;
    }

    const gain = context.createGain();
    const oscillator = context.createOscillator();
    const now = context.currentTime;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.09);

    return true;
  } catch {
    soundReady = false;
    return false;
  }
}

export async function playNotificationSound() {
  try {
    const context = await getAudioContext();
    if (!context || !soundReady) {
      return;
    }

    const first = context.createOscillator();
    const second = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    first.type = 'sine';
    second.type = 'sine';
    first.frequency.setValueAtTime(880, now);
    second.frequency.setValueAtTime(1175, now + 0.11);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

    first.connect(gain);
    second.connect(gain);
    gain.connect(context.destination);

    first.start(now);
    first.stop(now + 0.16);
    second.start(now + 0.12);
    second.stop(now + 0.34);
  } catch {
    // Browser autoplay rules can block sound until the admin interacts with the page.
  }
}

export function isNotificationSoundReady() {
  return soundReady;
}
