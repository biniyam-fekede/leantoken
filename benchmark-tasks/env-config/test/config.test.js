import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig } from '../src/config.js';
test('reads .env', () => {
  const p = join(mkdtempSync(join(tmpdir(), 'env-')), '.env');
  writeFileSync(p, '# settings\nPORT=8080\nDATABASE_URL=postgres://localhost/app\n');
  assert.deepEqual(loadConfig(p), { port: 8080, databaseUrl: 'postgres://localhost/app' });
});
