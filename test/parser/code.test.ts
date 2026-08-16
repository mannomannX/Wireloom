import { describe, expect, it } from 'vitest';
import { parse } from '../../src/parser/parser.js';
import type { CodeNode } from '../../src/parser/ast.js';

describe('Code primitive parser (Milestone 5)', () => {
  it('parses code with content, lang, and lines flag', () => {
    const src = `window:
  code "console.log('hello');" lang="typescript" lines`;

    const doc = parse(src);
    const code = doc.root?.children[0] as CodeNode;
    expect(code.kind).toBe('code');
    expect(code.content).toBe("console.log('hello');");
    expect(code.lang).toBe('typescript');
    expect(code.attributes.some((a) => a.kind === 'flag' && a.flag === 'lines')).toBe(true);
  });

  it('parses code with children lines', () => {
    const src = `window:
  code lang="rust":
    text "fn main() {"
    text "    println!(\\"Hello, world!\\");"
    text "}"`;

    const doc = parse(src);
    const code = doc.root?.children[0] as CodeNode;
    expect(code.kind).toBe('code');
    expect(code.lang).toBe('rust');
    expect(code.children.length).toBe(3);
  });
});
