import { store } from './store.js';

export function currentTheme() {
  return store.get('theme') ?? 'light';
}
