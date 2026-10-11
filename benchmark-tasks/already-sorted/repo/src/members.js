export function listMembers(members) {
  return [...members].sort((a, b) => a.name.localeCompare(b.name));
}
