export async function getJSON(url, { fetchImpl = fetch, timeoutMs = 5000 } = {}) {
  const res = await fetchImpl(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}
