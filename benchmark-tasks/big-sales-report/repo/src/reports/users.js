import { toCsv } from '../lib/csv.js';

export function usersReport(users) {
  return toCsv([['name', 'email'], ...users.map((u) => [u.name, u.email])]);
}
