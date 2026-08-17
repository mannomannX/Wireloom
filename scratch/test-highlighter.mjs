function highlightWireloom(code) {
  const lines = code.split('\n');
  const highlightedLines = lines.map(line => {
    let comment = '';
    let mainLine = line;
    const commentIdx = line.indexOf('#');
    if (commentIdx !== -1) {
      const beforeComment = line.slice(0, commentIdx);
      const quotes = (beforeComment.match(/"/g) || []).length;
      if (quotes % 2 === 0) {
        mainLine = beforeComment;
        comment = line.slice(commentIdx);
      }
    }

    let tokensHtml = '';
    const stringRegex = /"([^"\\]|\\.)*"/g;
    let lastIdx = 0;
    let match;

    function formatNonString(str) {
      let s = str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Macro vars: $name
      s = s.replace(/(\$[a-zA-Z0-9_-]+)/g, '<span class="hl-var">$1</span>');

      // Macro names: @Name
      s = s.replace(/(@[a-zA-Z0-9_-]+)/g, '<span class="hl-macro">$1</span>');

      // Attribute pairs: attr=
      s = s.replace(/\b([a-zA-Z0-9_-]+)=/g, '<span class="hl-attr">$1</span>=');

      // Top-level Keywords & slot containers
      s = s.replace(/\b(define|window|annotation|use|leading|trailing|center)\b/g, '<span class="hl-keyword">$1</span>');

      // Structural Containers
      s = s.replace(/\b(header|footer|panel|section|tabs|row|col|list|slot|grid|table|columns|tr|foot|code|resourcebar|stats|navbar|tabbar|sheet|segmented|tree|menubar|menu|breadcrumb)\b/g, '<span class="hl-container">$1</span>');

      // Primitives & Controls
      s = s.replace(/\b(tab|item|text|button|backbutton|input|combo|slider|kv|image|icon|divider|cell|column|td|resource|stat|progress|chart|spacer|tabitem|segment|checkbox|radio|toggle|chip|avatar|spinner|status|node|menuitem|separator|crumb)\b/g, '<span class="hl-primitive">$1</span>');

      // Flags & enum constants (including hyphenated like label-right)
      s = s.replace(/(?:^|\b|=)(label-right|primary|disabled|checked|selected|active|bold|muted|italic|lines|striped|compact|bordered|fill|hug|auto|uniform|left|right|center|start|end|between|around|evenly|stretch|top|bottom|horizontal|vertical|small|medium|large|light|regular|semibold|kbd|closable|on|off|chevron|success|info|warning|error|danger|research|military|industry|wealth|approval|locked|available|purchased|maxed|growing|ripe|withering|cashed|bar|line|pie|password|email)(?=\b|\s|:|$)/g, (match, p1) => {
        const prefix = match.startsWith('=') ? '=' : (match.startsWith(' ') ? ' ' : '');
        return `${prefix}<span class="hl-flag">${p1}</span>`;
      });

      // Numbers, units (%, px, fr) & ranges (0-100)
      s = s.replace(/(?:^|\s|=)(\d+(?:-\d+)?(?:%|fr|px)?)(?=\s|:|,|\)|$)/g, (match, p1) => {
        const prefix = match.startsWith('=') ? '=' : (match.startsWith(' ') ? ' ' : '');
        return `${prefix}<span class="hl-num">${p1}</span>`;
      });

      return s;
    }

    while ((match = stringRegex.exec(mainLine)) !== null) {
      const before = mainLine.slice(lastIdx, match.index);
      tokensHtml += formatNonString(before);
      const strVal = match[0].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      tokensHtml += `<span class="hl-string">${strVal}</span>`;
      lastIdx = match.index + match[0].length;
    }
    tokensHtml += formatNonString(mainLine.slice(lastIdx));

    if (comment) {
      const escComment = comment.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      tokensHtml += `<span class="hl-comment">${escComment}</span>`;
    }

    return tokensHtml;
  });

  return highlightedLines.join('\n') + '\n';
}

const sample = `window:
  navbar:
    leading:
      button "Back"
    trailing:
      button "Help"
  sheet position=bottom:
    text "Title" size=small
    checkbox "Option" label-right checked
    col w=50% h=200px:
      item "List item" chevron
`;

console.log(highlightWireloom(sample));
