const fs = require('fs');
const { spawnSync } = require('child_process');

function charOffsetOfLine(content, lineNum) {
  if (lineNum <= 1) return 0;
  let line = 1;
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') {
      line++;
      if (line === lineNum) return i + 1;
    }
  }
  return content.length;
}

function deleteComment(content, group) {
  if (group.kind === 'line-block' || (group.kind === 'block' && !group.isTrailing)) {
    const lines = content.split('\n');
    lines.splice(group.startLine - 1, group.endLine - group.startLine + 1);
    return lines.join('\n');
  }

  const fromOffset = charOffsetOfLine(content, group.startLine);
  const idx = content.indexOf(group.raw, fromOffset);
  if (idx === -1) return content;

  const before = content.slice(0, idx).replace(/[ \t]+$/, '');
  const after = content.slice(idx + group.raw.length);
  return before + after;
}

function openEditor(filePath, line) {
  const editor = process.env.EDITOR || process.env.VISUAL || 'vi';
  const result = spawnSync(editor, [`+${line}`, filePath], { stdio: 'inherit' });
  return result.status === 0 || result.status === null;
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content);
}

module.exports = { deleteComment, openEditor, writeFile };
