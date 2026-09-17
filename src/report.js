const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  yellow: '\x1b[33m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
};

const useColor = process.stdout.isTTY;
function paint(code, s) { return useColor ? `${code}${s}${c.reset}` : s; }

function truncate(s, n) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function printReport(results, { json, title } = {}) {
  if (json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  if (results.length === 0) {
    console.log(title ? `${title}: no new comments found.` : 'No new comments found.');
    return;
  }

  const byFile = new Map();
  for (const r of results) {
    if (!byFile.has(r.file)) byFile.set(r.file, []);
    byFile.get(r.file).push(r);
  }

  let flaggedCount = 0;

  for (const [file, items] of byFile) {
    console.log(`\n${paint(c.bold, file)}`);
    for (const r of items.sort((a, b) => a.startLine - b.startLine)) {
      if (r.flagged) flaggedCount++;
      const marker = r.flagged ? paint(c.yellow, '⚑') : ' ';
      const range = r.startLine === r.endLine ? `${r.startLine}` : `${r.startLine}-${r.endLine}`;
      const preview = truncate(r.plainText.replace(/\s+/g, ' ').trim(), 100);
      console.log(`  ${marker} ${paint(c.gray, range.padEnd(9))} ${preview}`);
      if (r.flagged && r.reasons.length) {
        console.log(`      ${paint(c.dim + c.yellow, `└─ ${r.reasons.join('; ')}`)}`);
      }
    }
  }

  const summary = `${results.length} comment${results.length === 1 ? '' : 's'}` +
    (flaggedCount ? `, ${paint(c.yellow, `${flaggedCount} flagged`)}` : '');
  console.log(`\n${summary}`);
}

module.exports = { printReport };
