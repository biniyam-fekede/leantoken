import { parseCliArgs } from './cli.js';
import { startServer } from './server.js';

const options = parseCliArgs(process.argv.slice(2));
startServer(options);
