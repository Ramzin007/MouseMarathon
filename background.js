importScripts('config.js');

const MILESTONES = [1, 5, 10, 50, 300]; // set to low values for demo testing

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

async function syncToSupabase() {
  const res = await chrome.storage.local.get(['user_id', 'nickname', 'unsynced_meters']);
  const distanceToSend = res.unsynced_meters || 0;
  
  if (distanceToSend <= 0.05) return true; // Don't spam for microscopic fractions

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
        p_distance: distanceToSend
      })
    });

    if (response.ok) {
      // Safely subtract only what was confirmed synced
      chrome.storage.local.get(['unsynced_meters'], (latest) => {
        const remaining = Math.max(0, (latest.unsynced_meters || 0) - distanceToSend);
        chrome.storage.local.set({ unsynced_meters: remaining });
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error('[MouseMarathon] Sync failed:', err);
    return false;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Handle continuous cursor delta
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

  // Handle manual sync trigger from popup
  if (msg.type === 'MANUAL_SYNC') {
    syncToSupabase().then((success) => {
      sendResponse({ success });
    });
    return true; // Keeps the message channel open for async response
  }
});

// Periodic auto-sync every 60 seconds
setInterval(syncToSupabase, 60000);