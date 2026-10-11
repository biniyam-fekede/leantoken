// write is injectable for testing.
export function log(message, options = {}, write = console.log) {
  write(message);
}
