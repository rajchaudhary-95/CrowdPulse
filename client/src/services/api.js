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
