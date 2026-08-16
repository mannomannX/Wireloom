import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '../../src/parser/parser.js';
import { layout, type LaidDocument, type LaidOutNode } from '../../src/renderer/layout.js';
import { DEFAULT_THEME, DARK_THEME, type Theme } from '../../src/renderer/themes.js';

const examplesDir = join(__dirname, '..', '..', 'examples');
const exampleFiles = readdirSync(examplesDir).filter((f) => f.endsWith('.wireloom'));

function assertNodeInvariants(node: LaidOutNode, theme: Theme): void {
  expect(Number.isFinite(node.x)).toBe(true);
  expect(Number.isFinite(node.y)).toBe(true);
  expect(Number.isFinite(node.width)).toBe(true);
  expect(Number.isFinite(node.height)).toBe(true);
  expect(node.width).toBeGreaterThanOrEqual(0);
  expect(node.height).toBeGreaterThanOrEqual(0);

  // Check children
  for (const child of node.children) {
    assertNodeInvariants(child, theme);
  }

  // Row horizontal sibling non-overlap invariant
  if (node.node.kind === 'row') {
    for (let i = 0; i < node.children.length - 1; i++) {
      const a = node.children[i]!;
      const b = node.children[i + 1]!;
      if (a.node.kind === 'spacer' || b.node.kind === 'spacer') continue;
      if (a.width === 0 || b.width === 0) continue;
      // b.x must be >= a.x + a.width (with small EPS for floating point)
      expect(b.x).toBeGreaterThanOrEqual(a.x + a.width - 1e-6);
    }
  }

  // Vertical stack non-overlap invariant (panel, col, section, list)
  if (['panel', 'col', 'section', 'list'].includes(node.node.kind)) {
    for (let i = 0; i < node.children.length - 1; i++) {
      const a = node.children[i]!;
      const b = node.children[i + 1]!;
      if (a.node.kind === 'spacer' || b.node.kind === 'spacer') continue;
      if (a.height === 0 || b.height === 0) continue;
      expect(b.y).toBeGreaterThanOrEqual(a.y + a.height - 1e-6);
    }
  }
}

function assertDocumentInvariants(laidDoc: LaidDocument, theme: Theme): void {
  expect(Number.isFinite(laidDoc.canvasWidth)).toBe(true);
  expect(Number.isFinite(laidDoc.canvasHeight)).toBe(true);
  expect(laidDoc.canvasWidth).toBeGreaterThan(0);
  expect(laidDoc.canvasHeight).toBeGreaterThan(0);

  assertNodeInvariants(laidDoc.root, theme);

  for (const a of laidDoc.annotations) {
    expect(Number.isFinite(a.x)).toBe(true);
    expect(Number.isFinite(a.y)).toBe(true);
    expect(Number.isFinite(a.width)).toBe(true);
    expect(Number.isFinite(a.height)).toBe(true);
    expect(a.width).toBeGreaterThanOrEqual(0);
    expect(a.height).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(a.boxAnchor.x)).toBe(true);
    expect(Number.isFinite(a.boxAnchor.y)).toBe(true);
    expect(Number.isFinite(a.targetAnchor.x)).toBe(true);
    expect(Number.isFinite(a.targetAnchor.y)).toBe(true);
  }
}

describe('Semantic layout invariants across example corpus', () => {
  it.each(exampleFiles)('asserts structural invariants for %s (light theme)', (file) => {
    const src = readFileSync(join(examplesDir, file), 'utf8');
    const doc = parse(src);
    const laid = layout(doc, DEFAULT_THEME);
    assertDocumentInvariants(laid, DEFAULT_THEME);
  });

  it.each(exampleFiles)('asserts structural invariants for %s (dark theme)', (file) => {
    const src = readFileSync(join(examplesDir, file), 'utf8');
    const doc = parse(src);
    const laid = layout(doc, DARK_THEME);
    assertDocumentInvariants(laid, DARK_THEME);
  });
});
