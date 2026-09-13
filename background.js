importScripts('config.js');

const MILESTONES = [10, 50, 100, 500, 1000];

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['user_id']);
  if (!data.user_id) {
    await chrome.storage.local.set({
      user_id: crypto.randomUUID(),
      nickname: 'ScrollMaster_' + Math.floor(Math.random() * 1000),
      total_meters: 0,
      unsynced_meters: 0,
      passed_milestones: []
    });
  }
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'MOUSE_DELTA') {
    chrome.storage.local.get(['total_meters', 'unsynced_meters', 'passed_milestones'], (res) => {
      const oldTotal = res.total_meters || 0;
      const newTotal = oldTotal + msg.meters;
      const unsynced = (res.unsynced_meters || 0) + msg.meters;
      const passed = res.passed_milestones || [];

      for (const m of MILESTONES) {
        if (newTotal >= m && !passed.includes(m)) {
          passed.push(m);
          if (sender.tab?.id) {
            chrome.tabs.sendMessage(sender.tab.id, { type: 'TRIGGER_CELEBRATION', milestone: m }).catch(() => {});
          }
        }
      }

      chrome.storage.local.set({
        total_meters: newTotal,
        unsynced_meters: unsynced,
        passed_milestones: passed
      });
    });
  }
});

// Periodic sync every 60 seconds (faster for hackathon demo)
setInterval(async () => {
  const res = await chrome.storage.local.get(['user_id', 'nickname', 'unsynced_meters']);
  if (!res.unsynced_meters || res.unsynced_meters < 0.1) return;

  try {
    const response = await fetch(`${SUPABASE_CONFIG.URL}/rest/v1/rpc/increment_distance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_CONFIG.ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`
      },
      body: JSON.stringify({
        p_user_id: res.user_id,
        p_nickname: res.nickname,
        p_distance: res.unsynced_meters
      })
    });

    if (response.ok) {
      await chrome.storage.local.set({ unsynced_meters: 0 });
    }
  } catch (err) {
    console.error('[MouseMarathon] Supabase sync failed:', err);
  }
}, 60000);