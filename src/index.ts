#!/usr/bin/env -S node --experimental-sqlite --env-file=.env
(async () => {
    process.removeAllListeners('warning');
    await import('./cli.js');
})();
