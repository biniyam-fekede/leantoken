import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldShowBetaBanner } from '../src/banner.js';
test('off by default', () => { delete process.env.BETA; assert.equal(shouldShowBetaBanner(), false); });
test('on with BETA=1', () => { process.env.BETA = '1'; assert.equal(shouldShowBetaBanner(), true); });
test('off with BETA=0', () => { process.env.BETA = '0'; assert.equal(shouldShowBetaBanner(), false); });
