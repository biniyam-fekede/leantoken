export function startServer({ port, host, verbose, files }) {
  if (verbose) console.log(`Serving ${files.length} file(s) on http://${host}:${port}`);
  // ...
}
