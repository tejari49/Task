export function purgeExpiredLocal() {
  try {
    const key = "pp-last-purge";
    const last = localStorage.getItem(key);
    if (last && Date.now() - parseInt(last) < 3600000) return;
    localStorage.setItem(key, Date.now().toString());
  } catch {}
}

export function isExpired(e: { toMillis: () => number } | null) {
  return e ? Date.now() > e.toMillis() : false;
}

export function timeLeft(e: { toMillis: () => number } | null) {
  if (!e) return "";
  const r = e.toMillis() - Date.now();
  if (r <= 0) return "Expired";
  const h = Math.floor(r / 3600000);
  const m = Math.floor((r % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
