import { describe, expect, it } from 'vitest';
import { parse } from '../../src/parser/parser.js';
import type { TableNode } from '../../src/parser/ast.js';

describe('Table parser (Milestone 3)', () => {
  it('parses a basic table with columns, tr, td, and foot', () => {
    const src = `window "Inventory":
  table striped bordered:
    columns:
      column "Item" align=left w=120
      column "Qty" align=right w=1fr
      column "Price" align=right
    tr:
      td "Widget"
      td "12"
      td "$4.99"
    tr:
      td "Gadget"
      td "3"
      td "$19.99"
    foot:
      td "Total" span=2
      td "$69.85"`;

    const doc = parse(src);
    expect(doc.root).toBeDefined();
    const table = doc.root?.children[0] as TableNode;
    expect(table.kind).toBe('table');
    expect(table.columns?.children.length).toBe(3);
    expect(table.columns?.children[0]?.title).toBe('Item');
    expect(table.columns?.children[0]?.align).toBe('left');
    expect(table.columns?.children[0]?.width).toEqual({ value: 120, unit: 'px' });
    expect(table.rows.length).toBe(2);
    expect(table.rows[0]?.children[0]?.content).toBe('Widget');
    expect(table.foot?.children.length).toBe(2);
    expect(table.foot?.children[0]?.span).toBe(2);
  });

  it('supports implicit td wrapping for non-td children in tr and foot', () => {
    const src = `window "Users":
  table:
    tr:
      text "Alice"
      button "Edit"
      status "Active" kind=success`;

    const doc = parse(src);
    const table = doc.root?.children[0] as TableNode;
    expect(table.rows[0]?.children.length).toBe(3);
    expect(table.rows[0]?.children[0]?.children[0]?.kind).toBe('text');
    expect(table.rows[0]?.children[1]?.children[0]?.kind).toBe('button');
    expect(table.rows[0]?.children[2]?.children[0]?.kind).toBe('status');
  });

  it('rejects columns after tr rows', () => {
    const src = `window:
  table:
    tr:
      td "A"
    columns:
      column "Col 1"`;
    expect(() => parse(src)).toThrow(/"columns" block must appear before "tr"/);
  });

  it('rejects multiple foot blocks', () => {
    const src = `window:
  table:
    tr:
      td "A"
    foot:
      td "F1"
    foot:
      td "F2"`;
    expect(() => parse(src)).toThrow(/"table" can only have one "foot"/);
  });
});
