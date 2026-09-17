const cStyle = { line: '//', block: ['/*', '*/'], strings: ['"', "'", '`'] };
const hashStyle = { line: '#', block: null, strings: ['"', "'"] };
const xmlStyle = { line: null, block: ['<!--', '-->'], strings: ['"', "'"] };
const sqlStyle = { line: '--', block: ['/*', '*/'], strings: ["'", '"'] };
const luaStyle = { line: '--', block: ['--[[', ']]'], strings: ['"', "'"] };
const cssStyle = { line: null, block: ['/*', '*/'], strings: ['"', "'"] };
const scssStyle = { line: '//', block: ['/*', '*/'], strings: ['"', "'"] };

const EXT_MAP = {
  '.js': cStyle, '.jsx': cStyle, '.mjs': cStyle, '.cjs': cStyle,
  '.ts': cStyle, '.tsx': cStyle,
  '.java': cStyle, '.c': cStyle, '.h': cStyle, '.cpp': cStyle, '.cc': cStyle,
  '.cxx': cStyle, '.hpp': cStyle,
  '.cs': cStyle, '.go': cStyle, '.rs': cStyle, '.swift': cStyle,
  '.kt': cStyle, '.kts': cStyle, '.php': cStyle, '.scala': cStyle,
  '.dart': cStyle, '.m': cStyle, '.mm': cStyle,
  '.py': hashStyle, '.rb': hashStyle, '.sh': hashStyle, '.bash': hashStyle,
  '.zsh': hashStyle, '.yml': hashStyle, '.yaml': hashStyle, '.pl': hashStyle,
  '.r': hashStyle, '.toml': hashStyle,
  '.html': xmlStyle, '.htm': xmlStyle, '.xml': xmlStyle, '.vue': xmlStyle,
  '.svelte': xmlStyle,
  '.sql': sqlStyle,
  '.lua': luaStyle,
  '.css': cssStyle, '.scss': scssStyle, '.less': scssStyle,
};

module.exports = { EXT_MAP };
