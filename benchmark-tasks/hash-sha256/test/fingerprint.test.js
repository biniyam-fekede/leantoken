import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fingerprint } from '../src/fingerprint.js';
test('known vector', () => assert.equal(fingerprint('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));
test('utf8', () => assert.equal(fingerprint('é').length, 64));
