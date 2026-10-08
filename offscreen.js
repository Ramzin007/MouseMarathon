const audio = document.getElementById('buzzer');

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'PLAY_BUZZER') {
    audio.currentTime = 0;
    audio.volume = 1.0;
    audio.play().catch((e) => console.error('Offscreen play error:', e));
  } else if (msg.type === 'STOP_BUZZER') {
    audio.pause();
    audio.currentTime = 0;
  }
});