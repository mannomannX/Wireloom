import { describe, expect, it } from 'vitest';
import wireloom, { highlight, tokenizeWireloom } from '../src/index.js';

describe('Wireloom Syntax Highlighter Core', () => {
  it('highlights top-level macros and variables', () => {
    const code = 'define @Card title="Default":\n  slot $title:';
    const html = highlight(code);
    expect(html).toContain('<span class="hl-keyword">define</span>');
    expect(html).toContain('<span class="hl-macro">@Card</span>');
    expect(html).toContain('<span class="hl-attr">title</span>=');
    expect(html).toContain('<span class="hl-string">"Default"</span>');
    expect(html).toContain('<span class="hl-var">$title</span>');
  });

  it('highlights navbar with leading, center and trailing slots', () => {
    const code = 'window:\n  navbar:\n    leading:\n      button "Back"\n    center:\n      text "Title"\n    trailing:\n      button "Done"';
    const html = wireloom.highlight(code);
    expect(html).toContain('<span class="hl-keyword">window</span>');
    expect(html).toContain('<span class="hl-container">navbar</span>');
    expect(html).toContain('<span class="hl-keyword">leading</span>');
    expect(html).toContain('<span class="hl-keyword">center</span>');
    expect(html).toContain('<span class="hl-keyword">trailing</span>');
    expect(html).toContain('<span class="hl-primitive">button</span>');
  });

  it('highlights units (px, %, fr) and ranges (N-M)', () => {
    const code = 'panel w=50% h=200px grow=1:\n  slider range=0-100 value=42';
    const html = highlight(code);
    expect(html).toContain('<span class="hl-attr">w</span>=<span class="hl-num">50%</span>');
    expect(html).toContain('<span class="hl-attr">h</span>=<span class="hl-num">200px</span>');
    expect(html).toContain('<span class="hl-attr">range</span>=<span class="hl-num">0-100</span>');
    expect(html).toContain('<span class="hl-attr">value</span>=<span class="hl-num">42</span>');
  });

  it('highlights hyphenated flags and enum values', () => {
    const code = 'checkbox "Agree" label-right checked\nchip "Ctrl" variant=kbd';
    const html = highlight(code);
    expect(html).toContain('<span class="hl-flag">label-right</span>');
    expect(html).toContain('<span class="hl-flag">checked</span>');
    expect(html).toContain('<span class="hl-flag">kbd</span>');
  });

  it('highlights comments and escapes html characters', () => {
    const code = 'text "Foo <bar> & baz" # test comment & info';
    const html = highlight(code);
    expect(html).toContain('<span class="hl-string">"Foo &lt;bar&gt; &amp; baz"</span>');
    expect(html).toContain('<span class="hl-comment"># test comment &amp; info</span>');
  });

  it('supports custom classPrefix for custom frontends', () => {
    const code = 'window:\n  button "Click" primary';
    const html = highlight(code, { classPrefix: 'wl-token-' });
    expect(html).toContain('<span class="wl-token-keyword">window</span>');
    expect(html).toContain('<span class="wl-token-primitive">button</span>');
    expect(html).toContain('<span class="wl-token-flag">primary</span>');
  });

  it('supports inline-css mode with light and dark themes', () => {
    const code = 'button "Submit" primary';
    const lightHtml = highlight(code, { mode: 'inline-css', theme: 'default' });
    const darkHtml = highlight(code, { mode: 'inline-css', theme: 'dark' });

    expect(lightHtml).toContain('<span style="color: #0f766e;">button</span>');
    expect(darkHtml).toContain('<span style="color: #2dd4bf;">button</span>');
  });

  it('supports terminal ANSI escape codes for CLI output', () => {
    const code = 'window:\n  text "CLI"';
    const ansi = highlight(code, { mode: 'ansi' });
    expect(ansi).toContain('\x1b[35mwindow\x1b[0m');
    expect(ansi).toContain('\x1b[32mtext\x1b[0m');
    expect(ansi).toContain('\x1b[32m"CLI"\x1b[0m');
  });

  it('supports custom formatToken hook for arbitrary UI frameworks', () => {
    const code = 'window:\n  button "Save"';
    const custom = highlight(code, {
      formatToken: (token) => `[${token.type}:${token.value}]`,
    });
    expect(custom).toContain('[keyword:window]');
    expect(custom).toContain('[primitive:button]');
    expect(custom).toContain('[string:"Save"]');
  });

  it('produces typed token stream with exact line and column positions', () => {
    const tokens = tokenizeWireloom('window:\n  text "Hi" bold');
    const winToken = tokens.find(t => t.value === 'window');
    expect(winToken).toBeDefined();
    expect(winToken?.line).toBe(1);
    expect(winToken?.column).toBe(1);
    expect(winToken?.type).toBe('keyword');

    const textToken = tokens.find(t => t.value === 'text');
    expect(textToken).toBeDefined();
    expect(textToken?.line).toBe(2);
    expect(textToken?.column).toBe(3);
    expect(textToken?.type).toBe('primitive');
  });
});
