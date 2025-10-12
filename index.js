#!/usr/bin/env -S node --experimental-sqlite --env-file=.env

process.removeAllListeners("warning");

await import("./cli.js");
