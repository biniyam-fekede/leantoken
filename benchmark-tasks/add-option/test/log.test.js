import { test } from 'node:test';
import assert from 'node:assert/strict';
import { log } from '../src/log.js';
test('prefix', () => { const out = []; log('ready', { prefix: 'api' }, (l) => out.push(l)); assert.deepEqual(out, ['[api] ready']); });
test('no options', () => { const out = []; log('ready', undefined, (l) => out.push(l)); assert.deepEqual(out, ['ready']); });
