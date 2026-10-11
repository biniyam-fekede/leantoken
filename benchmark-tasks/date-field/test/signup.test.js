import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../public/signup.html', import.meta.url), 'utf8');
const form = html.slice(html.indexOf('<form'), html.indexOf('</form>'));
test('birthday field inside the form', () => assert.match(form, /<(input|select)[^>]*name=["']?birthday/));
test('existing fields kept', () => { assert.match(form, /name="name"/); assert.match(form, /name="email"/); });
