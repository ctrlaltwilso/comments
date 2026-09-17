const fs = require('fs');
const path = require('path');
const { EXT_MAP } = require('./languages');
const { extractCommentGroups } = require('./extractComments');
const { scoreComment } = require('./heuristics');
const { printReport } = require('./report');
const git = require('./git');

const HELP = `comments — lists comments added in your changes so you can review them before opening a PR.

Usage:
  comments                      New comments in uncommitted changes (staged + unstaged) vs HEAD
  comments --staged             New comments staged for commit only
  comments --base <ref>         New comments in your working tree vs another branch/commit (e.g. main)
  comments --base <ref> --staged  New comments staged for commit vs another branch/commit

Options:
  --flagged-only    Only show comments the heuristics consider verbose/noisy
  --json            Print machine-readable JSON instead of a report
  -h, --help        Show this help
`;

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--staged') opts.staged = true;
    else if (a === '--base') opts.base = argv[++i];
    else if (a === '--flagged-only') opts.flaggedOnly = true;
    else if (a === '--json') opts.json = true;
    else if (a === '-h' || a === '--help') opts.help = true;
    else throw new Error(`Unknown argument: ${a}\n\n${HELP}`);
  }
  return opts;
}

function findNextCodeLine(lines, afterLine) {
  for (let idx = afterLine; idx < lines.length; idx++) {
    if (lines[idx] && lines[idx].trim()) return lines[idx];
  }
  return '';
}

function rangeOverlaps(startLine, endLine, addedLines) {
  for (let l = startLine; l <= endLine; l++) {
    if (addedLines.has(l)) return true;
  }
  return false;
}

function collectResults(repoRoot, filesMap, contentSource, opts) {
  const results = [];

  for (const [relPath, info] of filesMap) {
    if (info.addedLines.size === 0) continue;

    const ext = path.extname(relPath).toLowerCase();
    const lang = EXT_MAP[ext];
    if (!lang) continue;

    let content;
    try {
      content = contentSource === 'index'
        ? git.readIndexFile(repoRoot, relPath)
        : fs.readFileSync(path.join(repoRoot, relPath), 'utf8');
    } catch {
      continue;
    }
    if (content.includes(String.fromCharCode(0))) continue;

    const groups = extractCommentGroups(content, lang);
    if (groups.length === 0) continue;
    const lines = content.split('\n');

    for (const group of groups) {
      if (!rangeOverlaps(group.startLine, group.endLine, info.addedLines)) continue;
      const nextLineText = findNextCodeLine(lines, group.endLine);
      const scored = scoreComment(group, nextLineText);
      if (opts.flaggedOnly && !scored.flagged) continue;
      results.push({ file: relPath, ...group, ...scored });
    }
  }

  return results;
}

async function run(argv) {
  const opts = parseArgs(argv);
  if (opts.help) {
    console.log(HELP);
    return;
  }

  const cwd = process.cwd();
  if (!git.isGitRepo(cwd)) {
    throw new Error('Not inside a git repository.');
  }
  const repoRoot = git.getRepoRoot(cwd);

  const base = opts.base || 'HEAD';
  if (opts.base && !git.refExists(base, repoRoot)) {
    throw new Error(`Unknown ref/branch: ${base}`);
  }

  const diffArgs = opts.staged ? ['--cached', base] : [base];
  const contentSource = opts.staged ? 'index' : 'worktree';

  const filesMap = git.diffAddedLines(repoRoot, diffArgs);
  const results = collectResults(repoRoot, filesMap, contentSource, opts);

  const title = opts.staged
    ? `Staged changes vs ${base}`
    : `Working tree vs ${base}`;

  printReport(results, { json: opts.json, title });
}

module.exports = { run };
