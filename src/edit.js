const fs = require('fs');
const path = require('path');
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

function buildEditorCommand(filePath, line) {
  const editorEnv = process.env.EDITOR || process.env.VISUAL || 'vi';
  const parts = editorEnv.match(/(?:[^\s"]+|"[^"]*")+/g) || ['vi'];
  const cmd = parts[0].replace(/^"|"$/g, '');
  const extraArgs = parts.slice(1).map((p) => p.replace(/^"|"$/g, ''));
  const base = path.basename(cmd).toLowerCase();

  if (base.startsWith('code')) {
    return { cmd, args: [...extraArgs, '--goto', `${filePath}:${line}`] };
  }
  if (base.startsWith('subl') || base.startsWith('sublime')) {
    return { cmd, args: [...extraArgs, `${filePath}:${line}`] };
  }
  return { cmd, args: [...extraArgs, `+${line}`, filePath] };
}

function openEditor(filePath, line) {
  const { cmd, args } = buildEditorCommand(filePath, line);
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  if (result.error) {
    console.error(`Couldn't launch editor "${cmd}": ${result.error.message}`);
    return false;
  }
  if (typeof result.status === 'number' && result.status !== 0) {
    console.error(`Editor "${cmd}" exited with status ${result.status}.`);
    return false;
  }
  return true;
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content);
}

module.exports = { deleteComment, openEditor, writeFile };
