import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extensionOf } from '../src/files.js';
test('last extension', () => assert.equal(extensionOf('docs/report.final.pdf'), '.pdf'));
test('none', () => assert.equal(extensionOf('bin/README'), ''));
test('dotfile', () => assert.equal(extensionOf('.gitignore'), ''));
test('dir with dot', () => assert.equal(extensionOf('v1.2/Makefile'), ''));
