const { execFileSync } = require('child_process');

function git(args, cwd) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 64,
    });
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : err.message;
    throw new Error(`git ${args.join(' ')} failed: ${stderr.trim()}`);
  }
}

function isGitRepo(cwd) {
  try {
    execFileSync('git', ['rev-parse', '--is-inside-work-tree'], {
      cwd,
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}

function getRepoRoot(cwd) {
  return git(['rev-parse', '--show-toplevel'], cwd).trim();
}

function refExists(ref, cwd) {
  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', ref], {
      cwd,
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}

function parseDiff(diffText) {
  const files = new Map();
  const lines = diffText.split('\n');
  let current = null;
  let newLineNo = null;

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      current = null;
      newLineNo = null;
      continue;
    }
    if (line.startsWith('+++ ')) {
      const path = line.slice(4).trim();
      if (path === '/dev/null') { current = null; continue; }
      const filePath = path.replace(/^b\//, '');
      current = { path: filePath, addedLines: new Set() };
      files.set(filePath, current);
      continue;
    }
    if (line.startsWith('@@')) {
      const m = /@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
      if (m) newLineNo = parseInt(m[1], 10);
      continue;
    }
    if (!current || newLineNo === null) continue;
    if (line.startsWith('+')) {
      current.addedLines.add(newLineNo);
      newLineNo++;
    } else if (line.startsWith(' ')) {
      newLineNo++;
    }
  }

  return files;
}

function diffAddedLines(cwd, diffArgs) {
  const out = git(['diff', '--unified=0', '--no-color', ...diffArgs], cwd);
  return parseDiff(out);
}

function readIndexFile(cwd, relPath) {
  return git(['show', `:${relPath}`], cwd);
}

function readFileAtRef(cwd, ref, relPath) {
  return git(['show', `${ref}:${relPath}`], cwd);
}

module.exports = {
  isGitRepo,
  getRepoRoot,
  refExists,
  diffAddedLines,
  readIndexFile,
  readFileAtRef,
};
