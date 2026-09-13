chrome.storage.local.get(['total_meters'], (res) => {
  const m = res.total_meters || 0;
  document.getElementById('dist').innerText = m > 1000 
    ? `${(m / 1000).toFixed(3)} km` 
    : `${m.toFixed(2)} m`;
});

// Query Supabase REST API directly: order by total_meters desc limit 10
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
      table.innerHTML = '<tr><td colspan="3">No runners yet. Move your mouse!</td></tr>';
      return;
    }
    data.forEach((row, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="rank">#${i + 1}</td>
        <td>${(row.nickname || 'Anon').substring(0, 12)}</td>
        <td class="score">${parseFloat(row.total_meters).toFixed(1)}m</td>
      `;
      table.appendChild(tr);
    });
  })
  .catch(() => {
    document.getElementById('leaderboard').innerHTML = '<tr><td colspan="3">Leaderboard Offline</td></tr>';
  });