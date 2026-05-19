let audioContext;

export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    audioContext = audioContext || new AudioContextClass();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const first = audioContext.createOscillator();
    const second = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;

    first.type = 'sine';
    second.type = 'sine';
    first.frequency.setValueAtTime(880, now);
    second.frequency.setValueAtTime(1175, now + 0.11);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

    first.connect(gain);
    second.connect(gain);
    gain.connect(audioContext.destination);

    first.start(now);
    first.stop(now + 0.16);
    second.start(now + 0.12);
    second.stop(now + 0.34);
  } catch {
    // Browser autoplay rules can block sound until the admin interacts with the page.
  }
}
