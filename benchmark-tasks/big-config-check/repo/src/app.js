import { readFileSync } from 'node:fs';
import { loadConfig } from './config.js';

export function boot(path) {
  const config = loadConfig(JSON.parse(readFileSync(path, 'utf8')));
  console.log(`Starting ${config.workers} worker(s) in ${config.mode} mode on port ${config.port}`);
  return config;
}
