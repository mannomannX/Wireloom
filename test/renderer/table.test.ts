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

describe('Table renderer (Milestone 3)', () => {
  it('renders a table with column headers, zebra striping, and cell text', () => {
    const src = `window "Metrics":
  table striped bordered:
    columns:
      column "Metric" align=left
      column "Value" align=right
      column "Trend" align=center
    tr:
      td "Revenue"
      td "$1.2M"
      td "+14%" accent=success
    tr:
      td "Churn"
      td "1.8%"
      td "-0.4%" accent=danger
    foot:
      td "Summary"
      td "2 KPIs" span=2 align=right`;

    const svg = render(src);
    expect(svg).toContain('>Revenue<');
    expect(svg).toContain('>$1.2M<');
    expect(svg).toContain('>+14%<');
    expect(svg).toContain('>Churn<');
    expect(svg).toContain('>Summary<');
    expect(svg).toContain('fill="#3f8f5c"'); // success accent
    expect(svg).toContain('fill="#b0413c"'); // danger accent
  });

  it('truncates overflowing cell text with ellipsis', () => {
    const src = `window:
  table:
    columns:
      column "Short" w=40
    tr:
      td "This is an extremely long string that definitely will not fit in 40 pixels"`;

    const svg = render(src);
    expect(svg).toContain('…');
  });

  it('renders compact tables with reduced padding', () => {
    const normalSrc = `window:
  table:
    tr:
      td "Cell"`;
    const compactSrc = `window:
  table compact:
    tr:
      td "Cell"`;

    const normalDoc = parse(normalSrc);
    const compactDoc = parse(compactSrc);
    const normalLaid = layout(normalDoc, DEFAULT_THEME);
    const compactLaid = layout(compactDoc, DEFAULT_THEME);

    expect(compactLaid.root.children[0]!.width).toBeLessThan(
      normalLaid.root.children[0]!.width,
    );
  });

  it('renders correctly in dark theme', () => {
    const src = `window "Dark Table":
  table striped:
    columns:
      column "Col A"
      column "Col B"
    tr:
      td "1"
      td "2"`;

    const svg = render(src, DARK_THEME);
    expect(svg).toContain('fill="#2a2a2a"'); // dark tableHeaderBg
    expect(svg).toContain('>Col A<');
  });
});
