import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';
test('valid with default workers', () => assert.deepEqual(loadConfig({ port: 8080, mode: 'prod' }), { port: 8080, mode: 'prod', workers: 1 }));
test('valid explicit', () => assert.deepEqual(loadConfig({ port: 1, mode: 'dev', workers: 4 }), { port: 1, mode: 'dev', workers: 4 }));
test('names every bad field', () => {
  assert.throws(() => loadConfig({ port: 70000, mode: 'test', workers: 0 }), (e) => /port/.test(e.message) && /mode/.test(e.message) && /workers/.test(e.message));
});
test('rejects non-integer port', () => assert.throws(() => loadConfig({ port: 80.5, mode: 'dev' }), /port/));
