import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export const RULES_PATH = new URL('../rules/leantoken.md', import.meta.url);
export const LITE_RULES_PATH = new URL('../rules/leantoken-lite.md', import.meta.url);

const BEGIN = '<!-- leantoken:begin -->';
const END = '<!-- leantoken:end -->';

export function rulesText(): string {
  return readFileSync(RULES_PATH, 'utf8');
}

/** The ruleset with one checklist step removed, for ablation runs. */
export function rulesWithout(step: number, text = rulesText()): string {
  return text.split('\n').filter((line) => !line.startsWith(`${step}. **`)).join('\n');
}

/** The full ruleset without its example APIs, to test whether the examples (not the checklist) drive the effect. */
export function rulesWithoutExamples(text = rulesText()): string {
  return text.replace(/ \(e\.g\.[^)]*\)/g, '');
}

export function rulesVersion(text = rulesText()): string {
  return text.match(/leantoken-rules v([\d.]+)/)?.[1] ?? 'unknown';
}

/** Remove the LeanToken block from a document, leaving everything else untouched. */
export function stripBlock(doc: string): string {
  const start = doc.indexOf(BEGIN);
  const end = doc.indexOf(END);
  if (start === -1 || end === -1) return doc;
  const before = doc.slice(0, start).replace(/\n+$/, '');
  const after = doc.slice(end + END.length).replace(/^\n+/, '');
  return before && after ? `${before}\n\n${after}` : before + after;
}

/** Add (or replace) the LeanToken block. Idempotent. */
export function withBlock(doc: string, rules: string): string {
  const base = stripBlock(doc).replace(/\n+$/, '');
  const block = `${BEGIN}\n${rules.trim()}\n${END}\n`;
  return base ? `${base}\n\n${block}` : block;
}

export function install(file: string): void {
  const doc = existsSync(file) ? readFileSync(file, 'utf8') : '';
  writeFileSync(file, withBlock(doc, rulesText()));
}

export function uninstall(file: string): boolean {
  if (!existsSync(file)) return false;
  const doc = readFileSync(file, 'utf8');
  const next = stripBlock(doc);
  if (next === doc) return false;
  writeFileSync(file, next);
  return true;
}
