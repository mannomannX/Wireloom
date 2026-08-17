import wireloom from '../dist/index.js';

export function formatWireloomSource(source) {
  // 1. Line-by-line clean pass
  const rawLines = source.split('\n');
  const indentStack = [0]; // tracks leading space counts of ancestors
  const formattedLines = [];

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) {
      formattedLines.push('');
      continue;
    }

    // Clean whitespace between tokens outside string literals
    let cleaned = '';
    const strRegex = /"([^"\\]|\\.)*"/g;
    let lastIdx = 0;
    let m;
    while ((m = strRegex.exec(trimmed)) !== null) {
      const nonStr = trimmed.slice(lastIdx, m.index);
      cleaned += nonStr.replace(/\s+/g, ' ');
      cleaned += m[0];
      lastIdx = m.index + m[0].length;
    }
    cleaned += trimmed.slice(lastIdx).replace(/\s+/g, ' ');

    // Normalize spacing before colons (e.g., 'header :' -> 'header:')
    cleaned = cleaned.replace(/\s+:/g, ':');

    // Measure raw leading indentation
    const rawIndent = (rawLine.match(/^(\s*)/) || [''])[0].replace(/\t/g, '  ').length;

    if (trimmed.startsWith('window') || trimmed.startsWith('define') || trimmed.startsWith('annotation')) {
      indentStack.length = 1;
      indentStack[0] = rawIndent;
      formattedLines.push(cleaned);
      if (cleaned.endsWith(':')) {
        indentStack.push(rawIndent + 2);
      }
      continue;
    }

    // Adjust stack based on rawIndent
    while (indentStack.length > 1 && rawIndent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
    }

    const depth = Math.max(1, indentStack.length - 1);
    const targetIndent = '  '.repeat(depth);
    formattedLines.push(targetIndent + cleaned);

    if (cleaned.endsWith(':')) {
      indentStack.push(rawIndent + 2);
    }
  }

  const result = formattedLines.join('\n');

  // Try parsing with AST serializer to produce standard canonical AST formatting
  try {
    const ast = wireloom.parse(result);
    return wireloom.serialize(ast);
  } catch {
    return result;
  }
}

const messyExample = `window   "Messy UI"    :
   header :
      row :
          text     "Hello World"      bold    size=large
          spacer
          button       "Save"       primary
   panel :
     text   "Item 1"
     text   "Item 2"
`;

console.log('--- FORMATTED ---');
console.log(formatWireloomSource(messyExample));
