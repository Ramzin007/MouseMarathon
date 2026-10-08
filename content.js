const MEME_ROSTER = [
  { img: 'https://media.giphy.com/media/l0MYEqEzwMWFCg8rm/giphy.gif', tag: 'DAMU PANIC SPRINT' },
  { img: 'https://media.giphy.com/media/3o7btUg3Mx537GY3Ac/giphy.gif', tag: 'OVERCONFIDENT DRIFT' },
  { img: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.gif', tag: 'MAKRI GOPALAN SYNDROME' },
  { img: 'https://media.giphy.com/media/l1J9EdzfOSgfyueLm/giphy.gif', tag: 'TACTICAL ERROR DETECTED' },
  { img: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif', tag: 'SHIVANEE MOMENT' },
  { img: 'https://media.giphy.com/media/d2W7eZX5z62IXqWS/giphy.gif', tag: 'ARAKKAL ABU VELOCITY' },
  { img: 'https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif', tag: 'SUGATHAN BREAKDOWN' },
  { img: 'https://media.giphy.com/media/xUPGcyi4YxcZp8dWZq/giphy.gif', tag: 'UNNECESSARY AMBITION' },
  { img: 'https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif', tag: 'DRAMATIC GAZE INTENSITY' },
  { img: 'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif', tag: 'FOCUS LEVEL: ZERO' },
  { img: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif', tag: 'ADIPOLI KUTTAN CELEBRATION' }
];

// Heuristic Privacy Check: abort on visible password or credit card fields
const sensitiveField = document.querySelector('input[type="password"], input[autocomplete="cc-number"]');
const isFieldVisible = sensitiveField && (sensitiveField.offsetWidth > 0 || sensitiveField.offsetHeight > 0);

if (isFieldVisible) {
  console.warn('[MouseMarathon] Visible sensitive inputs detected. Tracking aborted.');
} else {
  let lastX = null;
  let lastY = null;
  let bufferedMeters = 0;
  const MM_PER_PIXEL = 0.264583;

  document.addEventListener('mousemove', (e) => {
    if (lastX !== null && lastY !== null) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      bufferedMeters += (Math.sqrt(dx * dx + dy * dy) * MM_PER_PIXEL) / 1000;
    }
    lastX = e.clientX;
    lastY = e.clientY;
  }, { capture: true, passive: true });

  const flushInterval = setInterval(() => {
    try {
      // Guard against orphaned content scripts if extension reloads
      if (!chrome.runtime || !chrome.runtime.id) {
        clearInterval(flushInterval);
        return;
      }

      if (bufferedMeters > 0) {
        chrome.runtime.sendMessage({
          type: 'MOUSE_DELTA',
          meters: bufferedMeters
        }, () => {
          if (chrome.runtime.lastError) {
            // Suppress disconnection errors cleanly
          }
        });
        bufferedMeters = 0;
      }
    } catch (e) {
      clearInterval(flushInterval);
    }
  }, 200);

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'TRIGGER_CELEBRATION') {
      showCelebration(msg.milestone);
    }
  });
}

function showCelebration(milestone) {
  const existing = document.getElementById('mouse-marathon-overlay');
  if (existing) existing.remove();

  const item = MEME_ROSTER[Math.floor(Math.random() * MEME_ROSTER.length)];

  const overlay = document.createElement('div');
  overlay.id = 'mouse-marathon-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 2147483647;
    background: rgba(0, 0, 0, 0.92); display: flex;
    flex-direction: column; align-items: center; justify-content: center;
    color: #00ff00; font-family: monospace, sans-serif;
    cursor: pointer; pointer-events: auto; user-select: none;
    text-align: center; padding: 20px;
  `;

  overlay.innerHTML = `
    <div style="font-size: 28px; font-weight: bold; text-shadow: 0 0 10px #00ff00; margin-bottom: 6px;">
      🚨 MILESTONE REACHED: ${milestone} METERS! 🚨
    </div>
    <div style="font-size: 14px; color: #888; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 2px;">
      [ ${item.tag} ]
    </div>
    <img src="${item.img}" alt="Meme" 
      style="max-width: 380px; max-height: 260px; border: 3px solid #00ff00; border-radius: 8px; box-shadow: 0 0 20px #00ff00; margin-bottom: 16px; object-fit: cover;" 
      onerror="this.style.display='none'" />
    <div style="font-size: 12px; color: #fff; letter-spacing: 1px;">
      [ CLICK ANYWHERE TO STOP ALARM & DISMISS ]
    </div>
  `;

  overlay.addEventListener('click', () => {
    try {
      if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({ type: 'DISMISS_BUZZER' }, () => {
          if (chrome.runtime.lastError) {
            // Suppress port closure notifications
          }
        });
      }
    } catch (err) {
      // Catch invalidated context if extension was reloaded mid-session
    }
    overlay.remove();
  });

  document.body.appendChild(overlay);
}