export function loadConfig(raw) {
  return { port: raw.port, mode: raw.mode, workers: raw.workers };
}
