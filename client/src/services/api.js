import { getActiveSession } from './supabase';

const API_BASE = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5000/api';

async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const session = await getActiveSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch {
    // Continue unauthenticated
  }
  return headers;
}

export async function fetchState() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/state`, { headers });
  if (!res.ok) throw new Error('Failed to fetch live system state');
  return res.json();
}

export async function updateScenario(overrides) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/scenario`, {
    method: 'POST',
    headers,
    body: JSON.stringify(overrides),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update scenario');
  }
  return res.json();
}

export async function resetScenario() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/scenario/reset`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) throw new Error('Failed to reset scenario');
  return res.json();
}

export async function fetchRouteRecommendation(fromZoneId, toZoneId, preference = 'least_crowded') {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE}/visitor/route?from=${encodeURIComponent(fromZoneId)}&to=${encodeURIComponent(toZoneId)}&preference=${preference}`,
    { headers }
  );
  if (!res.ok) throw new Error('Failed to fetch route recommendation');
  return res.json();
}

export async function executePlaybookAction(alertId, actionType, details = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/alerts/${encodeURIComponent(alertId)}/action`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ actionType, details }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to execute playbook intervention');
  }
  return res.json();
}

export async function fetchAuditLogs() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/audit-log`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchHistorySnapshots() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/history/snapshots`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export async function reseedDatabase() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/seed`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to reseed database');
  }
  return res.json();
}

export async function fetchEgressWindow() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/visitor/egress-window`, { headers });
  if (!res.ok) throw new Error('Failed to fetch egress window');
  return res.json();
}

export async function fetchConcessions(category = 'all') {
  const headers = await getAuthHeaders();
  const url = category && category !== 'all'
    ? `${API_BASE}/visitor/concessions?category=${encodeURIComponent(category)}`
    : `${API_BASE}/visitor/concessions`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('Failed to fetch concessions');
  return res.json();
}

export async function fetchWaitTimes() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/visitor/wait-times`, { headers });
  if (!res.ok) throw new Error('Failed to fetch wait times');
  return res.json();
}

export async function fetchAnnouncements() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/visitor/announcements`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export async function broadcastAnnouncement(data) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/visitor/announcements`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to broadcast announcement');
  return res.json();
}

export async function fetchZoneTelemetry(zoneId) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/zones/${encodeURIComponent(zoneId)}/telemetry`, { headers });
  if (!res.ok) throw new Error('Failed to fetch zone telemetry');
  return res.json();
}

export async function setReminder(data) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/visitor/reminders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to set reminder');
  return res.json();
}

export async function fetchReminders() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/visitor/reminders`, { headers });
  if (!res.ok) return [];
  return res.json();
}

export async function toggleBookmark(concessionId) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/visitor/bookmarks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ concessionId }),
  });
  if (!res.ok) throw new Error('Failed to toggle bookmark');
  return res.json();
}

export async function fetchBookmarks() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/visitor/bookmarks`, { headers });
  if (!res.ok) return { bookmarkedIds: [] };
  return res.json();
}



export async function clearAuditLogs() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/audit-log`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to clear audit logs');
  return res.json();
}

export async function updateClockState(options = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/control/clock`, {
    method: 'POST',
    headers,
    body: JSON.stringify(options),
  });
  if (!res.ok) throw new Error('Failed to update simulation timeline');
  return res.json();
}

export async function fetchGateStatuses() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/gates/status`, { headers });
  if (!res.ok) return { operationalState: {}, gates: [] };
  return res.json();
}

export async function toggleGateMode(gateId, targetMode) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/control/gates/toggle`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ gateId, targetMode }),
  });
  if (!res.ok) throw new Error('Failed to toggle gate operational mode');
  return res.json();
}



