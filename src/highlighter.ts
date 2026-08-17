/**
 * Wireloom Syntax Highlighter & Tokenizer Engine.
 *
 * Fully abstracted lexical engine conforming strictly to design/grammar.md (v0.8.0).
 * Supports pluggable frontends (HTML with custom classPrefix, inline CSS styles,
 * CLI/ANSI terminal escapes, and raw token streams for Monaco/CodeMirror/React).
 */

export type TokenType =
  | 'keyword'
  | 'macro'
  | 'var'
  | 'container'
  | 'primitive'
  | 'attr'
  | 'flag'
  | 'num'
  | 'string'
  | 'comment'
  | 'text';

export interface HighlightToken {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export interface HighlightTheme {
  keyword: string;
  macro: string;
  var: string;
  container: string;
  primitive: string;
  attr: string;
  flag: string;
  num: string;
  string: string;
  comment: string;
}

export const DEFAULT_HIGHLIGHT_THEME_LIGHT: HighlightTheme = {
  keyword: '#7c3aed',
  macro: '#0284c7',
  var: '#be123c',
  container: '#1d4ed8',
  primitive: '#0f766e',
  attr: '#c2410c',
  flag: '#6d28d9',
  num: '#0369a1',
  string: '#15803d',
  comment: '#94a3b8',
};

export const DEFAULT_HIGHLIGHT_THEME_DARK: HighlightTheme = {
  keyword: '#c084fc',
  macro: '#38bdf8',
  var: '#f43f5e',
  container: '#60a5fa',
  primitive: '#2dd4bf',
  attr: '#fb923c',
  flag: '#a78bfa',
  num: '#38bdf8',
  string: '#fde047',
  comment: '#64748b',
};

const ANSI_COLORS: Record<TokenType, string> = {
  keyword: '\x1b[35m',   // Magenta
  macro: '\x1b[36m',     // Cyan
  var: '\x1b[31m',       // Red
  container: '\x1b[34m', // Blue
  primitive: '\x1b[32m', // Green
  attr: '\x1b[33m',      // Yellow
  flag: '\x1b[35m',      // Magenta
  num: '\x1b[36m',       // Cyan
  string: '\x1b[32m',    // Green
  comment: '\x1b[90m',   // Bright Black (Gray)
  text: '\x1b[0m',       // Reset
};

export const HL_KEYWORDS = new Set([
  'define', 'window', 'annotation', 'use',
  'leading', 'trailing', 'center',
]);

export const HL_CONTAINERS = new Set([
  'header', 'footer', 'panel', 'section', 'tabs', 'row', 'col',
  'list', 'slot', 'grid', 'table', 'columns', 'tr', 'foot',
  'code', 'resourcebar', 'stats', 'navbar', 'tabbar', 'sheet',
  'segmented', 'tree', 'menubar', 'menu', 'breadcrumb',
]);

export const HL_PRIMITIVES = new Set([
  'tab', 'item', 'text', 'button', 'backbutton', 'input', 'combo',
  'slider', 'kv', 'image', 'icon', 'divider', 'cell', 'column',
  'td', 'resource', 'stat', 'progress', 'chart', 'spacer',
  'tabitem', 'segment', 'checkbox', 'radio', 'toggle', 'chip',
  'avatar', 'spinner', 'status', 'node', 'menuitem', 'separator',
  'crumb',
]);

export const HL_FLAGS_AND_ENUMS = new Set([
  // Bare flags
  'primary', 'disabled', 'active', 'selected', 'checked', 'on', 'off',
  'closable', 'collapsed', 'large', 'chevron', 'label-right',
  'bold', 'italic', 'muted', 'striped', 'compact', 'bordered', 'lines',
  'scroll', 'handle',

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

  // Status & Progress kinds
  'neutral', 'pending', 'running', 'ring',

  // Kinds & Variants
  'kbd', 'default', 'bar', 'line', 'pie', 'sparkline', 'area', 'donut', 'stacked', 'scatter', 'heatmap',
  'password', 'email', 'search',

  // Named icon glyphs
  'credits', 'influence', 'faith', 'authority', 'computation', 'tech',
  'policy', 'ship', 'planet', 'leader', 'gear', 'lock', 'check', 'star', 'plus', 'minus',
  'user', 'settings', 'folder', 'file', 'refresh', 'trash', 'home',
]);

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Tokenizes a Wireloom source string into a typed token stream with line and column positions.
 */
export function tokenizeWireloom(code: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  let i = 0;
  let line = 1;
  let col = 1;
  const len = code.length;

  while (i < len) {
    const ch = code[i]!;
    const startLine = line;
    const startCol = col;

    // Helper to advance index and track line/col
    const advance = (n = 1): void => {
      for (let k = 0; k < n; k++) {
        if (code[i + k] === '\n') {
          line++;
          col = 1;
        } else {
          col++;
        }
      }
      i += n;
    };

    // 1. Comments: '#' to end of line
    if (ch === '#') {
      let comment = '';
      while (i < len && code[i] !== '\n') {
        comment += code[i];
        advance(1);
      }
      tokens.push({ type: 'comment', value: comment, line: startLine, column: startCol });
      continue;
    }

    // 2. Whitespace & Newlines
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      let ws = '';
      while (i < len && (code[i] === ' ' || code[i] === '\t' || code[i] === '\r' || code[i] === '\n')) {
        ws += code[i];
        advance(1);
      }
      tokens.push({ type: 'text', value: ws, line: startLine, column: startCol });
      continue;
    }

    // 3. String literal: "..." with escape handling
    if (ch === '"') {
      let strVal = '"';
      advance(1);
      while (i < len) {
        const sc = code[i]!;
        if (sc === '\\' && i + 1 < len) {
          strVal += sc + code[i + 1];
          advance(2);
        } else if (sc === '"') {
          strVal += '"';
          advance(1);
          break;
        } else if (sc === '\n') {
          break;
        } else {
          strVal += sc;
          advance(1);
        }
      }
      tokens.push({ type: 'string', value: strVal, line: startLine, column: startCol });
      continue;
    }

    // 4. Macro definition / invocation: @Name
    if (ch === '@') {
      let name = '@';
      advance(1);
      while (i < len && /[a-zA-Z0-9_-]/.test(code[i]!)) {
        name += code[i];
        advance(1);
      }
      tokens.push({ type: 'macro', value: name, line: startLine, column: startCol });
      continue;
    }

    // 5. Macro variable reference: $name
    if (ch === '$') {
      let varName = '$';
      advance(1);
      while (i < len && /[a-zA-Z0-9_-]/.test(code[i]!)) {
        varName += code[i];
        advance(1);
      }
      tokens.push({ type: 'var', value: varName, line: startLine, column: startCol });
      continue;
    }

    // 6. Number, Range, or Dimension unit (e.g. 100, 100px, 50%, 1fr, 0-100)
    if (/[0-9]/.test(ch)) {
      let numStr = '';
      while (i < len && /[0-9.-]/.test(code[i]!)) {
        numStr += code[i];
        advance(1);
      }
      if (i < len && code[i] === '%') {
        numStr += '%';
        advance(1);
      } else if (i + 1 < len && code.slice(i, i + 2).toLowerCase() === 'px') {
        numStr += code.slice(i, i + 2);
        advance(2);
      } else if (i + 1 < len && code.slice(i, i + 2).toLowerCase() === 'fr') {
        numStr += code.slice(i, i + 2);
        advance(2);
      }
      tokens.push({ type: 'num', value: numStr, line: startLine, column: startCol });
      continue;
    }

    // 7. Identifiers, Attribute keys, Keywords, Containers, Primitives, Flags
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < len && /[a-zA-Z0-9_-]/.test(code[i]!)) {
        ident += code[i];
        advance(1);
      }

      // Attribute key (followed immediately by '=')
      if (i < len && code[i] === '=') {
        tokens.push({ type: 'attr', value: ident, line: startLine, column: startCol });
        tokens.push({ type: 'text', value: '=', line, column: col });
        advance(1); // consume '='
        continue;
      }

      if (HL_KEYWORDS.has(ident)) {
        tokens.push({ type: 'keyword', value: ident, line: startLine, column: startCol });
      } else if (HL_CONTAINERS.has(ident)) {
        tokens.push({ type: 'container', value: ident, line: startLine, column: startCol });
      } else if (HL_PRIMITIVES.has(ident)) {
        tokens.push({ type: 'primitive', value: ident, line: startLine, column: startCol });
      } else if (HL_FLAGS_AND_ENUMS.has(ident)) {
        tokens.push({ type: 'flag', value: ident, line: startLine, column: startCol });
      } else {
        tokens.push({ type: 'text', value: ident, line: startLine, column: startCol });
      }
      continue;
    }

    // 8. Other punctuation / symbols (:, ,, (, ), etc.)
    tokens.push({ type: 'text', value: ch, line: startLine, column: startCol });
    advance(1);
  }

  return tokens;
}

export interface HighlightOptions {
  /**
   * Rendering mode:
   * - 'html' (default): wraps tokens in `<span class="{classPrefix}{type}">`
   * - 'inline-css': wraps tokens in `<span style="color: ...">` using the active theme
   * - 'ansi': terminal ANSI escape codes for CLI output
   */
  mode?: 'html' | 'inline-css' | 'ansi';

  /**
   * Prefix for HTML CSS class names. Defaults to 'hl-'.
   * Example: `classPrefix: 'token-'` -> `<span class="token-keyword">`
   */
  classPrefix?: string;

  /**
   * Theme for 'inline-css' mode or custom color overrides.
   * Can be 'default', 'dark', or a custom {@link HighlightTheme}.
   */
  theme?: 'default' | 'dark' | Partial<HighlightTheme>;

  /**
   * Optional custom token formatter hook.
   * Allows consumers to transform tokens arbitrarily (e.g. for React JSX, AST converters, etc.).
   */
  formatToken?: (token: HighlightToken, defaultOutput: string) => string;
}

/**
 * Highlights a Wireloom source string according to the supplied {@link HighlightOptions}.
 */
export function highlight(code: string, options: HighlightOptions = {}): string {
  const mode = options.mode ?? 'html';
  const prefix = options.classPrefix ?? 'hl-';
  const tokens = tokenizeWireloom(code);

  const themeObj: HighlightTheme =
    options.theme === 'dark'
      ? DEFAULT_HIGHLIGHT_THEME_DARK
      : typeof options.theme === 'object'
        ? { ...DEFAULT_HIGHLIGHT_THEME_LIGHT, ...options.theme }
        : DEFAULT_HIGHLIGHT_THEME_LIGHT;

  let out = '';

  for (const token of tokens) {
    let tokenFormatted = '';

    if (mode === 'ansi') {
      const color = ANSI_COLORS[token.type] ?? ANSI_COLORS.text;
      tokenFormatted = token.type === 'text' ? token.value : `${color}${token.value}\x1b[0m`;
    } else if (mode === 'inline-css') {
      const escaped = escapeHtml(token.value);
      if (token.type === 'text') {
        tokenFormatted = escaped;
      } else {
        const color = themeObj[token.type as keyof HighlightTheme] ?? 'inherit';
        tokenFormatted = `<span style="color: ${color};">${escaped}</span>`;
      }
    } else {
      // Default: 'html' with CSS class
      const escaped = escapeHtml(token.value);
      if (token.type === 'text') {
        tokenFormatted = escaped;
      } else {
        tokenFormatted = `<span class="${prefix}${token.type}">${escaped}</span>`;
      }
    }

    if (options.formatToken) {
      out += options.formatToken(token, tokenFormatted);
    } else {
      out += tokenFormatted;
    }
  }

  return out;
}
