#!/usr/bin/env bun
const { run } = require('../src/index.js');

run(process.argv.slice(2)).catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
