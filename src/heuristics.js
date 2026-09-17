const FILLER_PATTERNS = [
  { re: /^(note|important|todo|fixme|warning)\s*[:\-]/i, label: 'starts with a filler label' },
  { re: /\bthis (function|method|class|component|file|module|variable|constant|block|code|line)\b/i, label: 'restates "this X does Y"' },
  { re: /\b(basically|essentially|simply put|in other words|as (you can see|mentioned))\b/i, label: 'generic filler phrasing' },
  { re: /^(first|next|then|finally|now|here)[,:]?\s+we\b/i, label: 'narrative filler phrasing' },
  { re: /^\s*(step\s*\d+|[0-9]+[.)])\s/i, label: 'numbered step narration' },
  { re: /\b(make sure to|ensure that|it('|)s important to)\b/i, label: 'instructional filler phrasing' },
];

const DECL_RE = /\b(?:function|class|const|let|var|def|func|interface|type)\s+([A-Za-z_$][A-Za-z0-9_$]*)/;

function splitWords(identifier) {
  return identifier
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function scoreComment(group, nextLineText) {
  const plain = group.plainText.trim();
  const reasons = [];
  let score = 0;

  if (!plain) return { flagged: false, score: 0, reasons };

  if (group.lineCount >= 3) {
    score += 2;
    reasons.push(`${group.lineCount}-line comment block`);
  }

  if (plain.length > 220) {
    score += 2;
    reasons.push('long comment');
  } else if (plain.length > 120) {
    score += 1;
    reasons.push('long comment');
  }

  for (const { re, label } of FILLER_PATTERNS) {
    if (re.test(plain)) {
      score += 1;
      reasons.push(label);
      break;
    }
  }

  if (nextLineText) {
    const m = DECL_RE.exec(nextLineText);
    if (m) {
      const words = splitWords(m[1]);
      if (words.length) {
        const lowerPlain = plain.toLowerCase();
        const hits = words.filter((w) => lowerPlain.includes(w)).length;
        if (hits / words.length >= 0.6) {
          score += 1;
          reasons.push('restates the following identifier name');
        }
      }
    }
  }

  return { flagged: score >= 2, score, reasons };
}

module.exports = { scoreComment };
