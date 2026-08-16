import { describe, expect, it } from 'vitest';
import { parse } from '../../src/parser/parser.js';
import { layout } from '../../src/renderer/layout.js';
import { DEFAULT_THEME } from '../../src/renderer/themes.js';
import type { GridNode } from '../../src/parser/ast.js';

describe('Grid with track=auto and cell spanning', () => {
  it('parses grid track=auto and cell span / rows', () => {
    const src = `window:
  grid cols=3 rows=2 track=auto:
    cell "Header" span=2:
      text "Spans 2 columns"
    cell "Side":
      text "Side"
    cell "A":
      text "Col 1"
    cell "B":
      text "Col 2"
    cell "C":
      text "Col 3"`;
    const doc = parse(src);
    const grid = doc.root?.children[0] as GridNode;
    expect(grid.track).toBe('auto');
    expect(grid.children[0]?.span).toBe(2);
  });

  it('lays out auto-track grid according to column content sizes', () => {
    const src = `window:
  grid cols=2 rows=1 track=auto:
    cell "Small":
      text "short"
    cell "Large":
      text "This is a very long text content in column 2"`;
    const doc = parse(src);
    const laid = layout(doc, DEFAULT_THEME);
    const gridLaid = laid.root.children[0]!;
    const [c1, c2] = gridLaid.children;
    expect(c2!.width).toBeGreaterThan(c1!.width);
  });

  it('correctly calculates position and width for spanning cells', () => {
    const src = `window:
  grid cols=3 rows=2:
    cell "Top" span=3:
      text "Wide cell"
    cell "1":
      text "A"
    cell "2":
      text "B"
    cell "3":
      text "C"`;
    const doc = parse(src);
    const laid = layout(doc, DEFAULT_THEME);
    const gridLaid = laid.root.children[0]!;
    const [topCell, c1, c2, c3] = gridLaid.children;
    expect(topCell!.width).toBeCloseTo(gridLaid.width, 1);
    expect(c1!.x).toBe(topCell!.x);
    expect(c3!.x + c3!.width).toBeCloseTo(topCell!.x + topCell!.width, 1);
  });
});
