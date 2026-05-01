// Simple sound effects utility using Web Audio API
// Creates simple beep sounds for gamification

const audioContext = typeof window !== 'undefined' && new (window.AudioContext || window.webkitAudioContext)();

export const playSound = {
  // Click/button press sound - short beep
  click: () => {
    if (!audioContext) return;
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.start(now);
    osc.stop(now + 0.1);
  },

  // Success sound - ascending notes
  success: () => {
    if (!audioContext) return;
    const now = audioContext.currentTime;
    const frequencies = [523.25, 659.25, 783.99]; // C, E, G
    
    frequencies.forEach((freq, idx) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.value = freq;
      osc.type = 'sine';
      const start = now + idx * 0.1;
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.15);
      
      osc.start(start);
      osc.stop(start + 0.15);
    });
  },

  // Achievement/PB sound - triumphant chord
  achievement: () => {
    if (!audioContext) return;
    const now = audioContext.currentTime;
    const frequencies = [329.63, 493.88, 659.25]; // E, B, E (power chord)
    
    frequencies.forEach((freq) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      osc.start(now);
      osc.stop(now + 0.4);
    });
  },

  // Notification/ping sound - two ascending notes
  notification: () => {
    if (!audioContext) return;
    const now = audioContext.currentTime;
    const frequencies = [440, 523.25]; // A, C#
    
    frequencies.forEach((freq, idx) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.value = freq;
      osc.type = 'sine';
      const start = now + idx * 0.08;
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.12);
      
      osc.start(start);
      osc.stop(start + 0.12);
    });
  },
};
