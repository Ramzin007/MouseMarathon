chrome.storage.local.get(['total_meters', 'nickname'], (res) => {
  const m = res.total_meters || 0;
  document.getElementById('dist').innerText = m > 1000 
    ? `${(m / 1000).toFixed(3)} km` 
    : `${m.toFixed(2)} m`;

  if (res.nickname) {
    document.getElementById('nicknameInput').value = res.nickname;
  }
});

// Load saved nickname into the input box on popup open
chrome.storage.local.get(['nickname'], (res) => {
  if (res.nickname) {
    document.getElementById('nicknameInput').value = res.nickname;
  }
});

// Handle Save Button click
const saveNickBtn = document.getElementById('saveNickBtn');
const nicknameInput = document.getElementById('nicknameInput');

saveNickBtn.addEventListener('click', () => {
  const newNick = nicknameInput.value.trim();
  if (!newNick) return;

  saveNickBtn.disabled = true;
  saveNickBtn.innerText = 'SAVED!';

  // Store locally
  chrome.storage.local.set({ nickname: newNick }, () => {
    // Optionally trigger an immediate sync to update the name on Supabase
    chrome.runtime.sendMessage({ type: 'MANUAL_SYNC' }, () => {
      loadLeaderboard();
    });

    setTimeout(() => {
      saveNickBtn.disabled = false;
      saveNickBtn.innerText = 'SAVE';
    }, 1200);
  });
});

// Save Nickname
document.getElementById('saveNickBtn').addEventListener('click', async () => {
  const newNick = document.getElementById('nicknameInput').value.trim();
  if (!newNick) return;

  const { user_id } = await chrome.storage.local.get(['user_id']);
  await chrome.storage.local.set({ nickname: newNick });

  // Update immediately in Supabase
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

  loadLeaderboard();
});

// Fetch Leaderboard
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

function updateLocalDisplay() {
  chrome.storage.local.get(['total_meters'], (res) => {
    const m = res.total_meters || 0;
    document.getElementById('dist').innerText = m > 1000 
      ? `${(m / 1000).toFixed(3)} km` 
      : `${m.toFixed(2)} m`;
  });
}

updateLocalDisplay();
loadLeaderboard();

// Handle Manual Sync Click
const syncBtn = document.getElementById('syncBtn');
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