// Heuristic check: abort if password or credit card inputs exist
if (document.querySelector('input[type="password"], input[autocomplete="cc-number"]')) {
  console.warn('[MouseMarathon] Sensitive inputs detected. Tracking aborted.');
} else {
  let lastX = null;
  let lastY = null;
  let bufferedMeters = 0;
  const MM_PER_PIXEL = 0.264583;

  window.addEventListener('mousemove', (e) => {
    if (lastX !== null && lastY !== null) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const pixelDist = Math.sqrt(dx * dx + dy * dy);
      bufferedMeters += (pixelDist * MM_PER_PIXEL) / 1000;
    }
    lastX = e.clientX;
    lastY = e.clientY;
  }, { passive: true });

  // Flush buffer every 2,000 ms to background
  setInterval(() => {
    if (bufferedMeters > 0) {
      chrome.runtime.sendMessage({
        type: 'MOUSE_DELTA',
        meters: bufferedMeters
      }).catch(() => {});
      bufferedMeters = 0;
    }
  }, 2000);

  // Listen for celebration jumpscares
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'TRIGGER_CELEBRATION') {
      showCelebration(msg.milestone);
    }
  });
}

function showCelebration(milestone) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 2147483647;
    background: rgba(0, 0, 0, 0.85); display: flex;
    flex-direction: column; align-items: center; justify-content: center;
    color: #00ff00; font-family: monospace; font-size: 32px;
    font-weight: bold; text-shadow: 0 0 10px #00ff00;
    cursor: pointer; pointer-events: auto;
  `;
  overlay.innerHTML = `
    <div>🚨 MILESTONE REACHED: ${milestone}m 🚨</div>
    <div style="font-size: 16px; color: #fff; margin-top: 15px;">CLICK TO DISMISS YOUR MEANINGLESS FEAT</div>
  `;

  try {
    const audio = new Audio(chrome.runtime.getURL('airhorn.mp3'));
    audio.play().catch(() => {});
  } catch (e) {}

  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}