const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { deleteComment, openEditor } = require('./edit');
const { paint, truncate, colors: c } = require('./report');

const CONTEXT = 2;

function printContext(lines, group) {
  const from = Math.max(1, group.startLine - CONTEXT);
  const to = Math.min(lines.length, group.endLine + CONTEXT);
  for (let n = from; n <= to; n++) {
    const isCommentLine = n >= group.startLine && n <= group.endLine;
    const text = truncate(lines[n - 1] ?? '', 110);
    const lineNo = String(n).padStart(5);
    if (isCommentLine) {
      console.log(paint(c.yellow, `  ${lineNo} | ${text}`));
    } else {
      console.log(paint(c.dim, `  ${lineNo} | ${text}`));
    }
  }
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function runInteractive(results, repoRoot) {
  if (results.length === 0) {
    console.log('No new comments found.');
    return { kept: 0, edited: 0, deleted: 0 };
  }

  const byFile = new Map();
  for (const r of results) {
    if (!byFile.has(r.file)) byFile.set(r.file, []);
    byFile.get(r.file).push(r);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const summary = { kept: 0, edited: 0, deleted: 0 };
  let quit = false;

  outer:
  for (const [file, groups] of byFile) {
    const absPath = path.join(repoRoot, file);
    let content = fs.readFileSync(absPath, 'utf8');
    groups.sort((a, b) => b.startLine - a.startLine);

    for (const group of groups) {
      const lines = content.split('\n');
      console.log(`\n${paint(c.bold, file)}${group.flagged ? '  ' + paint(c.yellow, '⚑ ' + group.reasons.join('; ')) : ''}`);
      printContext(lines, group);

      const answer = (await ask(rl, paint(c.cyan, '  [k]eep / [d]elete / [e]dit / [s]kip file / [q]uit  (k) ')))
        .trim()
        .toLowerCase() || 'k';

      if (answer === 'q') { quit = true; break outer; }
      if (answer === 's') { break; }

      if (answer === 'd') {
        content = deleteComment(content, group);
        fs.writeFileSync(absPath, content);
        summary.deleted++;
      } else if (answer === 'e') {
        fs.writeFileSync(absPath, content);
        openEditor(absPath, group.startLine);
        content = fs.readFileSync(absPath, 'utf8');
        summary.edited++;
      } else {
        summary.kept++;
      }
    }
  }

  rl.close();
  if (quit) console.log('\nStopped early.');
  console.log(
    `\n${summary.deleted} deleted, ${summary.edited} edited, ${summary.kept} kept.`
  );
  return summary;
}

module.exports = { runInteractive };
