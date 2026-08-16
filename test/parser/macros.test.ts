import { describe, expect, it } from 'vitest';
import { parse } from '../../src/parser/parser.js';
import type { PanelNode, TextNode } from '../../src/parser/ast.js';

describe('Macro system (Milestone 5)', () => {
  it('defines and expands macros with parameter substitution', () => {
    const src = `define @Card:
  panel:
    text "$title" bold
    text "$desc"

window "App":
  use @Card title="Users" desc="Manage users"
  use @Card title="Billing" desc="Invoices and plans"`;

    const doc = parse(src);
    expect(doc.macros?.length).toBe(1);
    expect(doc.root?.children.length).toBe(2);

    const card1 = doc.root?.children[0] as PanelNode;
    expect(card1.kind).toBe('panel');
    const title1 = card1.children[0] as TextNode;
    const desc1 = card1.children[1] as TextNode;
    expect(title1.content).toBe('Users');
    expect(desc1.content).toBe('Manage users');

    const card2 = doc.root?.children[1] as PanelNode;
    expect(card2.kind).toBe('panel');
    const title2 = card2.children[0] as TextNode;
    const desc2 = card2.children[1] as TextNode;
    expect(title2.content).toBe('Billing');
    expect(desc2.content).toBe('Invoices and plans');
  });

  it('throws a helpful error when using an undefined macro', () => {
    const src = `window:
  use @MissingCard title="Test"`;
    expect(() => parse(src)).toThrow(/undefined macro "@MissingCard"/);
  });
});
