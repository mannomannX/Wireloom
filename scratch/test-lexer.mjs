// High-Quality Single-Pass Lexical Highlighter for Wireloom DSL (based on design/grammar.md)

const TOP_KEYWORDS = new Set([
  'define', 'window', 'annotation', 'use',
  'leading', 'trailing', 'center' // Navbar slots
]);

const CONTAINERS = new Set([
  'header', 'footer', 'panel', 'section', 'tabs', 'row', 'col',
  'list', 'slot', 'grid', 'table', 'columns', 'tr', 'foot',
  'code', 'resourcebar', 'stats', 'navbar', 'tabbar', 'sheet',
  'segmented', 'tree', 'menubar', 'menu', 'breadcrumb'
]);

const PRIMITIVES = new Set([
  'tab', 'item', 'text', 'button', 'backbutton', 'input', 'combo',
  'slider', 'kv', 'image', 'icon', 'divider', 'cell', 'column',
  'td', 'resource', 'stat', 'progress', 'chart', 'spacer',
  'tabitem', 'segment', 'checkbox', 'radio', 'toggle', 'chip',
  'avatar', 'spinner', 'status', 'node', 'menuitem', 'separator',
  'crumb'
]);

const FLAGS_AND_ENUMS = new Set([
  // Bare flags
  'primary', 'disabled', 'active', 'selected', 'checked', 'on', 'off',
  'closable', 'collapsed', 'large', 'chevron', 'label-right',
  'bold', 'italic', 'muted', 'striped', 'compact', 'bordered', 'lines',

  // Sizing & flex values
  'fill', 'hug', 'auto', 'uniform',

  // Alignment & Positions
  'start', 'center', 'end', 'between', 'around', 'evenly', 'stretch',
  'left', 'right', 'top', 'bottom',

  // Orientations
  'horizontal', 'vertical',

  // Typography weights & sizes
  'light', 'regular', 'semibold',
  'small', 'medium',

  // Accents & Polarity
  'research', 'military', 'industry', 'wealth', 'approval',
  'warning', 'danger', 'success', 'info', 'error',

  // States
  'locked', 'available', 'purchased', 'maxed',
  'growing', 'ripe', 'withering', 'cashed',

  // Kinds & Variants
  'kbd', 'bar', 'line', 'pie', 'password', 'email',

  // Named icons (optional keywords)
  'credits', 'influence', 'faith', 'authority', 'computation', 'tech',
  'policy', 'ship', 'planet', 'leader', 'gear', 'lock', 'check', 'star', 'plus', 'minus'
]);

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function highlightWireloom(code) {
  const lines = code.split('\n');
  const highlightedLines = lines.map(line => {
    let out = '';
    let i = 0;
    const len = line.length;

    while (i < len) {
      const ch = line[i];

      // 1. Comments: '#' to end of line
      if (ch === '#') {
        out += `<span class="hl-comment">${escapeHtml(line.slice(i))}</span>`;
        break;
      }

      // 2. Whitespace
      if (ch === ' ' || ch === '\t') {
        out += ch;
        i++;
        continue;
      }

      // 3. String literal: "..." with escapes
      if (ch === '"') {
        let strVal = '"';
        i++;
        while (i < len) {
          const sc = line[i];
          if (sc === '\\' && i + 1 < len) {
            strVal += sc + line[i + 1];
            i += 2;
          } else if (sc === '"') {
            strVal += '"';
            i++;
            break;
          } else {
            strVal += sc;
            i++;
          }
        }
        out += `<span class="hl-string">${escapeHtml(strVal)}</span>`;
        continue;
      }

      // 4. Macro definition / instantiation: @Name
      if (ch === '@') {
        let name = '@';
        i++;
        while (i < len && /[a-zA-Z0-9_-]/.test(line[i])) {
          name += line[i];
          i++;
        }
        out += `<span class="hl-macro">${escapeHtml(name)}</span>`;
        continue;
      }

      // 5. Macro variable: $name
      if (ch === '$') {
        let varName = '$';
        i++;
        while (i < len && /[a-zA-Z0-9_-]/.test(line[i])) {
          varName += line[i];
          i++;
        }
        out += `<span class="hl-var">${escapeHtml(varName)}</span>`;
        continue;
      }

      // 6. Number, Range or Dimension (e.g., 100, 100px, 50%, 1fr, 0-100)
      if (/[0-9]/.test(ch)) {
        let numStr = '';
        while (i < len && /[0-9.-]/.test(line[i])) {
          numStr += line[i];
          i++;
        }
        // Check unit suffix: %, px, fr
        if (i < len && line[i] === '%') {
          numStr += '%';
          i++;
        } else if (i + 1 < len && line.slice(i, i + 2).toLowerCase() === 'px') {
          numStr += line.slice(i, i + 2);
          i += 2;
        } else if (i + 1 < len && line.slice(i, i + 2).toLowerCase() === 'fr') {
          numStr += line.slice(i, i + 2);
          i += 2;
        }
        out += `<span class="hl-num">${escapeHtml(numStr)}</span>`;
        continue;
      }

      // 7. Identifiers, Attributes, Keywords, Containers, Primitives, Flags
      if (/[a-zA-Z_]/.test(ch)) {
        let ident = '';
        while (i < len && /[a-zA-Z0-9_-]/.test(line[i])) {
          ident += line[i];
          i++;
        }

        // Check if followed immediately by '=' (Attribute Key, e.g. w=, justify=)
        if (i < len && line[i] === '=') {
          out += `<span class="hl-attr">${escapeHtml(ident)}</span>=`;
          i++; // consume '='
          continue;
        }

        // Check dictionary classifications
        if (TOP_KEYWORDS.has(ident)) {
          out += `<span class="hl-keyword">${escapeHtml(ident)}</span>`;
        } else if (CONTAINERS.has(ident)) {
          out += `<span class="hl-container">${escapeHtml(ident)}</span>`;
        } else if (PRIMITIVES.has(ident)) {
          out += `<span class="hl-primitive">${escapeHtml(ident)}</span>`;
        } else if (FLAGS_AND_ENUMS.has(ident)) {
          out += `<span class="hl-flag">${escapeHtml(ident)}</span>`;
        } else {
          // Unclassified identifier (e.g. custom prop value or variable name)
          out += escapeHtml(ident);
        }
        continue;
      }

      // 8. Other punctuation / symbols (:, ,, (, ), etc.)
      out += escapeHtml(ch);
      i++;
    }

    return out;
  });

  return highlightedLines.join('\n') + '\n';
}

const sample = `define @Card title="Default" accent=research:
  slot $title accent=$accent:
    text "Nested text"

window "Grammar Showcase":
  navbar:
    leading:
      backbutton "Back"
    center:
      text "Mobile Nav" bold
    trailing:
      button "Done" primary
  header large:
    text "Header Title"
  table striped compact bordered:
    columns:
      column "Col A" w=50% align=left
      column "Col B" w=120px align=right
    tr:
      td "Value 1" accent=success
      status "Live" kind=info
  sheet position=bottom title="Action Sheet":
    checkbox "Remember choice" label-right checked
    slider range=0-100 value=42 label="Volume"
    chip "Cmd+K" variant=kbd closable
    avatar "JD" size=medium accent=military
  annotation "Important info\\nmulti-line" target="welcome" position=right # callout comment
`;

console.log(highlightWireloom(sample));
