import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCliArgs } from '../src/cli.js';
test('defaults', () => assert.deepEqual(parseCliArgs([]), { port: 3000, host: 'localhost', verbose: false, files: [] }));
test('all options', () => assert.deepEqual(parseCliArgs(['--port', '8080', '--host', '0.0.0.0', '-v', 'a.txt', 'b.txt']), { port: 8080, host: '0.0.0.0', verbose: true, files: ['a.txt', 'b.txt'] }));
test('long verbose', () => assert.deepEqual(parseCliArgs(['--verbose', '--port', '9000', 'x']), { port: 9000, host: 'localhost', verbose: true, files: ['x'] }));
test('unknown option throws', () => assert.throws(() => parseCliArgs(['--nope'])));
