const saveNickBtn = document.getElementById('saveNickBtn');
const nicknameInput = document.getElementById('nicknameInput');
const syncBtn = document.getElementById('syncBtn');

function updateLocalDisplay() {
  chrome.storage.local.get(['total_meters', 'nickname'], (res) => {
    const m = res.total_meters || 0;
    document.getElementById('dist').innerText = m > 1000 
      ? `${(m / 1000).toFixed(3)} km` 
      : `${m.toFixed(2)} m`;

    if (res.nickname && !nicknameInput.value) {
      nicknameInput.value = res.nickname;
    }
  });
}

// Listen for live updates while the popup remains open
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.total_meters) {
    const m = changes.total_meters.newValue || 0;
    document.getElementById('dist').innerText = m > 1000 
      ? `${(m / 1000).toFixed(3)} km` 
      : `${m.toFixed(2)} m`;
  }
});

function loadLeaderboard() {
  fetch(`${SUPABASE_CONFIG.URL}/rest/v1/users?select=nickname,total_meters&order=total_meters.desc&limit=10`, {
    headers: {
      'apikey': SUPABASE_CONFIG.ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`
    }
  })
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById('leaderboard');
      table.innerHTML = '';
      if (!data.length) {
        table.innerHTML = '<tr><td colspan="3">No runners yet.</td></tr>';
        return;
      }
      data.forEach((row, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="rank">#${i + 1}</td>
          <td>${(row.nickname || 'Anon').substring(0, 14)}</td>
          <td class="score">${parseFloat(row.total_meters).toFixed(1)}m</td>
        `;
        table.appendChild(tr);
      });
    })
    .catch(() => {
      document.getElementById('leaderboard').innerHTML = '<tr><td colspan="3">Leaderboard Offline</td></tr>';
    });
}

// Single handler for saving nickname locally and to Supabase
saveNickBtn.addEventListener('click', async () => {
  const newNick = nicknameInput.value.trim();
  if (!newNick) return;

  saveNickBtn.disabled = true;
  saveNickBtn.innerText = 'SAVING...';

  const { user_id } = await chrome.storage.local.get(['user_id']);
  await chrome.storage.local.set({ nickname: newNick });

  try {
    await fetch(`${SUPABASE_CONFIG.URL}/rest/v1/users?user_id=eq.${user_id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_CONFIG.ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ nickname: newNick })
    });
  } catch (e) {}

  saveNickBtn.innerText = 'SAVED!';
  loadLeaderboard();

  setTimeout(() => {
    saveNickBtn.disabled = false;
    saveNickBtn.innerText = 'SAVE';
  }, 1200);
});

// Sync button handler
syncBtn.addEventListener('click', () => {
  syncBtn.disabled = true;
  syncBtn.innerText = 'SYNCING...';

  chrome.runtime.sendMessage({ type: 'MANUAL_SYNC' }, (response) => {
    if (response && response.success) {
      syncBtn.innerText = 'SYNC COMPLETE!';
      updateLocalDisplay();
      loadLeaderboard();
    } else {
      syncBtn.innerText = 'SYNC FAILED';
    }

    setTimeout(() => {
      syncBtn.disabled = false;
      syncBtn.innerText = 'SYNC NOW';
    }, 1500);
  });
});

updateLocalDisplay();
loadLeaderboard();