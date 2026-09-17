function lineHasNonWhitespaceBefore(content, lineStart, idx) {
  return /\S/.test(content.slice(lineStart, idx));
}

function extractRaw(content, lang) {
  const raw = [];
  const n = content.length;
  let i = 0;
  let line = 1;
  let lineStart = 0;
  let inString = null;

  while (i < n) {
    const ch = content[i];

    if (inString) {
      if (ch === '\\') { i += 2; continue; }
      if (ch === inString) { inString = null; i++; continue; }
      if (ch === '\n') { line++; lineStart = i + 1; }
      i++;
      continue;
    }

    if (ch === '\n') { line++; lineStart = i + 1; i++; continue; }

    if (lang.block && content.startsWith(lang.block[0], i)) {
      const startLine = line;
      const isTrailing = lineHasNonWhitespaceBefore(content, lineStart, i);
      const closeIdx = content.indexOf(lang.block[1], i + lang.block[0].length);
      const end = closeIdx === -1 ? n : closeIdx + lang.block[1].length;
      const text = content.slice(i, end);
      for (let k = i; k < end; k++) {
        if (content[k] === '\n') { line++; lineStart = k + 1; }
      }
      raw.push({ type: 'block', startLine, endLine: line, isTrailing, raw: text });
      i = end;
      continue;
    }

    if (lang.line && content.startsWith(lang.line, i)) {
      const startLine = line;
      const isTrailing = lineHasNonWhitespaceBefore(content, lineStart, i);
      let end = content.indexOf('\n', i);
      if (end === -1) end = n;
      const text = content.slice(i, end);
      raw.push({ type: 'line', startLine, endLine: startLine, isTrailing, raw: text });
      i = end;
      continue;
    }

    if (lang.strings && lang.strings.includes(ch)) { inString = ch; i++; continue; }

    i++;
  }

  return raw;
}

function stripMarkers(entry, lang) {
  if (entry.type === 'line') {
    return entry.raw.slice(lang.line.length).trim();
  }
  const [open, close] = lang.block;
  let inner = entry.raw.slice(open.length);
  if (inner.endsWith(close)) inner = inner.slice(0, -close.length);
  return inner
    .split('\n')
    .map((l) => l.replace(/^\s*\*+\s?/, '').trim())
    .filter(Boolean)
    .join(' ');
}

function groupComments(raw, lang) {
  const groups = [];
  let i = 0;

  while (i < raw.length) {
    const entry = raw[i];

    if (entry.type === 'line' && !entry.isTrailing) {
      let j = i;
      let endLine = entry.endLine;
      const parts = [stripMarkers(entry, lang)];
      while (
        j + 1 < raw.length &&
        raw[j + 1].type === 'line' &&
        !raw[j + 1].isTrailing &&
        raw[j + 1].startLine === endLine + 1
      ) {
        j++;
        endLine = raw[j].endLine;
        parts.push(stripMarkers(raw[j], lang));
      }
      groups.push({
        kind: 'line-block',
        startLine: entry.startLine,
        endLine,
        lineCount: j - i + 1,
        isTrailing: false,
        plainText: parts.filter(Boolean).join(' '),
      });
      i = j + 1;
    } else {
      groups.push({
        kind: entry.type === 'block' ? 'block' : 'trailing',
        startLine: entry.startLine,
        endLine: entry.endLine,
        lineCount: entry.endLine - entry.startLine + 1,
        isTrailing: entry.isTrailing,
        plainText: stripMarkers(entry, lang),
      });
      i++;
    }
  }

  return groups;
}

function extractCommentGroups(content, lang) {
  return groupComments(extractRaw(content, lang), lang);
}

module.exports = { extractCommentGroups };
