importScripts('config.js');

const MILESTONE_STEP = 10;

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['user_id']);
  if (!data.user_id) {
    await chrome.storage.local.set({
      user_id: crypto.randomUUID(),
      nickname: 'ScrollMaster_' + Math.floor(Math.random() * 1000),
      total_meters: 0,
      unsynced_meters: 0,
      last_milestone: 0
    });
  }
  chrome.alarms.create('supabase_periodic_sync', { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'supabase_periodic_sync') {
    syncToSupabase();
  }
});

async function playBuzzerAudio() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });

  if (existingContexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Play alarm sound immediately on milestone reach'
    });
  }

  chrome.runtime.sendMessage({ type: 'PLAY_BUZZER' }).catch(() => {});
}

async function stopBuzzerAudio() {
  chrome.runtime.sendMessage({ type: 'STOP_BUZZER' }).catch(() => {});
}

async function syncToSupabase() {
  const res = await chrome.storage.local.get(['user_id', 'nickname', 'unsynced_meters']);
  const distanceToSend = res.unsynced_meters || 0;
  
  if (distanceToSend <= 0.05) return true;

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
      const latest = await chrome.storage.local.get(['unsynced_meters']);
      const remaining = Math.max(0, (latest.unsynced_meters || 0) - distanceToSend);
      await chrome.storage.local.set({ unsynced_meters: remaining });
      return true;
    }
    return false;
  } catch (err) {
    console.error('[MouseMarathon] Sync failed:', err);
    return false;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'MOUSE_DELTA') {
    chrome.storage.local.get(['total_meters', 'unsynced_meters', 'last_milestone'], async (res) => {
      const oldTotal = res.total_meters || 0;
      const newTotal = oldTotal + msg.meters;
      const unsynced = (res.unsynced_meters || 0) + msg.meters;
      let lastMilestone = res.last_milestone || 0;

      if (newTotal - lastMilestone >= MILESTONE_STEP) {
        lastMilestone = Math.floor(newTotal / MILESTONE_STEP) * MILESTONE_STEP;
        
        // 1. Play the buzzer immediately via Offscreen (bypasses tab autoplay block)
        await playBuzzerAudio();

        // 2. Trigger the meme overlay in the active tab
        if (sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            type: 'TRIGGER_CELEBRATION',
            milestone: lastMilestone
          }).catch(() => {});
        }
      }

      chrome.storage.local.set({
        total_meters: newTotal,
        unsynced_meters: unsynced,
        last_milestone: lastMilestone
      });
    });
    return false;
  }

  if (msg.type === 'DISMISS_BUZZER') {
    stopBuzzerAudio();
    return false;
  }

  if (msg.type === 'MANUAL_SYNC') {
    syncToSupabase().then((success) => {
      sendResponse({ success });
    });
    return true;
  }
});