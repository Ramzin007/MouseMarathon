// Check for VISIBLE password/credit card inputs only
const sensitiveField = document.querySelector('input[type="password"], input[autocomplete="cc-number"]');
const isFieldVisible = sensitiveField && (sensitiveField.offsetWidth > 0 || sensitiveField.offsetHeight > 0);

if (isFieldVisible) {
  console.warn('[MouseMarathon] Visible sensitive inputs detected. Tracking aborted.');
} else {
  let lastX = null;
  let lastY = null;
  let bufferedMeters = 0;
  const MM_PER_PIXEL = 0.264583;

  // Use document with capture phase to ensure modern SPAs don't swallow mouse movements
  document.addEventListener('mousemove', (e) => {
    if (lastX !== null && lastY !== null) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const pixelDist = Math.sqrt(dx * dx + dy * dy);
      bufferedMeters += (pixelDist * MM_PER_PIXEL) / 1000;
    }
    lastX = e.clientX;
    lastY = e.clientY;
  }, { capture: true, passive: true });

  const flushInterval = setInterval(() => {
    try {
      if (!chrome.runtime || !chrome.runtime.id) {
        clearInterval(flushInterval);
        return;
      }

      if (bufferedMeters > 0) {
        chrome.runtime.sendMessage({
          type: 'MOUSE_DELTA',
          meters: bufferedMeters
        }, () => {
          if (chrome.runtime.lastError) {}
        });
        bufferedMeters = 0;
      }
    } catch (e) {
      clearInterval(flushInterval);
    }
  }, 2000);

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'TRIGGER_CELEBRATION') {
      showCelebration(msg.milestone);
    }
  });
}

function showCelebration(milestone) {
  // Prevent duplicate popups if one is already showing
  if (document.getElementById('mouse-marathon-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'mouse-marathon-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    background: rgba(0, 0, 0, 0.92);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Courier New', monospace;
    cursor: pointer;
    user-select: none;
    animation: flashBg 0.35s infinite alternate;
  `;

  overlay.innerHTML = `
    <style>
      @keyframes flashBg {
        0% { background: rgba(0, 0, 0, 0.92); }
        100% { background: rgba(20, 0, 0, 0.95); }
      }
      @keyframes neonPulse {
        0%, 100% { text-shadow: 0 0 10px #00ff00, 0 0 20px #00ff00, 0 0 40px #00ff00; }
        50% { text-shadow: 0 0 5px #00ff00, 0 0 10px #00ff00; }
      }
      .neon-title {
        color: #00ff00;
        font-size: 34px;
        font-weight: 900;
        text-align: center;
        letter-spacing: 2px;
        animation: neonPulse 0.5s infinite;
        margin: 0;
      }
      .neon-sub {
        color: #ffffff;
        font-size: 14px;
        letter-spacing: 1px;
        margin-top: 18px;
        text-transform: uppercase;
        border: 1px dashed #00ff00;
        padding: 6px 14px;
        background: rgba(0, 255, 0, 0.1);
      }
      .glitch-stat {
        color: #ff0055;
        font-size: 16px;
        margin-top: 12px;
        font-weight: bold;
      }
    </style>

    <img src="https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif" 
         alt="Celebration" 
         style="width: 220px; height: auto; border: 2px solid #00ff00; margin-bottom: 20px; box-shadow: 0 0 15px #00ff00;" />
    
    <div class="neon-title">🚨 MILESTONE UNLOCKED 🚨</div>
    <div class="glitch-stat">CURSOR DISPLACEMENT: ${milestone} METERS</div>
    <div class="neon-sub">[ CLICK ANYWHERE TO DISMISS YOUR MEANINGLESS FEAT ]</div>
  `;

  try {
    const audio = new Audio(chrome.runtime.getURL('airhorn.mp3'));
    audio.play().catch(() => {});
  } catch (e) {}

  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}