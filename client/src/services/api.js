const API_BASE = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5000/api';

export async function fetchState() {
  const res = await fetch(`${API_BASE}/state`);
  if (!res.ok) throw new Error('Failed to fetch live system state');
  return res.json();
}

export async function updateScenario(overrides) {
  const res = await fetch(`${API_BASE}/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(overrides),
  });
  if (!res.ok) throw new Error('Failed to update scenario');
  return res.json();
}

export async function resetScenario() {
  const res = await fetch(`${API_BASE}/scenario/reset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reset scenario');
  return res.json();
}

export async function fetchRouteRecommendation(fromZoneId, toZoneId, preference = 'least_crowded') {
  const res = await fetch(
    `${API_BASE}/visitor/route?from=${encodeURIComponent(fromZoneId)}&to=${encodeURIComponent(toZoneId)}&preference=${preference}`
  );
  if (!res.ok) throw new Error('Failed to fetch route recommendation');
  return res.json();
}

export async function reseedDatabase() {
  const res = await fetch(`${API_BASE}/seed`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to reseed database');
  return res.json();
}
