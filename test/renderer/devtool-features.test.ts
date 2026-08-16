import { describe, expect, it } from 'vitest';
import { parse } from '../../src/parser/parser.js';
import { layout } from '../../src/renderer/layout.js';
import { emitSvg } from '../../src/renderer/svg.js';
import { DEFAULT_THEME, DARK_THEME } from '../../src/renderer/themes.js';

function render(source: string, theme = DEFAULT_THEME): string {
  const doc = parse(source);
  const laid = layout(doc, theme);
  return emitSvg(laid, theme);
}

describe('Devtool features (Milestone 5)', () => {
  it('renders a code block with language header and line numbers', () => {
    const src = `window "Snippet":
  code "import { parse } from 'wireloom';\\nconst doc = parse('window: ...');" lang="typescript" lines`;

    const svg = render(src);
    expect(svg).toContain('>typescript<');
    expect(svg).toContain('>1<');
    expect(svg).toContain('>2<');
    expect(svg).toContain('import { parse }');
    expect(svg).toContain('font-family="ui-monospace');
  });

  it('renders a code block in dark theme', () => {
    const src = `window "Dark Snippet":
  code "fn main() {}" lang="rust"`;

    const svg = render(src, DARK_THEME);
    expect(svg).toContain('fill="#1e1e1e"'); // dark codeBg
    expect(svg).toContain('fill="#d4d4d4"'); // dark codeTextColor
  });

  it('renders a vertical divider inside a row', () => {
    const src = `window:
  row:
    button "Left"
    divider orientation=vertical
    button "Right"`;

    const svg = render(src);
    expect(svg).toContain('stroke="#c4c4c4"');
    // Vertical line x1 equals x2
    expect(svg).toMatch(/<line x1="\d+(\.\d+)?" y1="\d+(\.\d+)?" x2="\d+(\.\d+)?" y2="\d+(\.\d+)?" stroke="#c4c4c4"/);
  });

  it('renders a keyboard shortcut chip with variant=kbd', () => {
    const src = `window:
  row:
    text "Search:"
    chip "Ctrl+K" variant=kbd`;

    const svg = render(src);
    expect(svg).toContain('>Ctrl+K<');
    expect(svg).toContain('font-family="ui-monospace');
  });

  it('renders tab content body when tab has nested children', () => {
    const src = `window "Tabs with content":
  tabs:
    tab "Overview" active:
      panel:
        text "Overview content here"
    tab "Settings":
      panel:
        text "Settings content here"`;

    const svg = render(src);
    expect(svg).toContain('>Overview content here<');
    // Inactive tab body should not be rendered
    expect(svg).not.toContain('>Settings content here<');
  });
});
