import { describe, expect, it } from 'vitest';
import { parse } from '../../src/parser/parser.js';
import { layout } from '../../src/renderer/layout.js';
import { DEFAULT_THEME } from '../../src/renderer/themes.js';
import { render } from '../../src/index.js';

describe('Universal sizing attributes (w, h, min-w, min-h, max-w, max-h)', () => {
  it('applies explicit w and h to window root', async () => {
    const dsl = `window "Custom Mobile" w=360 h=640:
  text "Hello"`;
    const doc = parse(dsl);
    const laid = layout(doc, DEFAULT_THEME);
    expect(laid.canvasWidth).toBe(360);
    expect(laid.canvasHeight).toBe(640);

    const res = await render('test', dsl);
    expect(res.svg).toContain('width="360"');
    expect(res.svg).toContain('height="640"');
  });

  it('applies explicit w and h to input fields', () => {
    const dsl = `window:
  row:
    input placeholder="0" w=44 h=52`;
    const doc = parse(dsl);
    const laid = layout(doc, DEFAULT_THEME);
    const row = laid.root.children[0]!;
    const input = row.children[0]!;
    expect(input.width).toBe(44);
    expect(input.height).toBe(52);
  });

  it('applies explicit w and h to buttons', () => {
    const dsl = `window:
  button "Submit" w=140 h=44`;
    const doc = parse(dsl);
    const laid = layout(doc, DEFAULT_THEME);
    const btn = laid.root.children[0]!;
    expect(btn.width).toBe(140);
    expect(btn.height).toBe(44);
  });

  it('applies explicit w and h to column container', () => {
    const dsl = `window:
  col 340 h=680:
    text "Top"
    spacer
    text "Bottom"`;
    const doc = parse(dsl);
    const laid = layout(doc, DEFAULT_THEME);
    const col = laid.root.children[0]!;
    expect(col.width).toBe(340);
    expect(col.height).toBe(680);
    expect(laid.canvasHeight).toBeGreaterThanOrEqual(680);
  });

  it('applies explicit w and h to combo and slider', () => {
    const dsl = `window:
  combo value="Option" w=200 h=40
  slider range=0-100 value=50 w=250 h=30`;
    const doc = parse(dsl);
    const laid = layout(doc, DEFAULT_THEME);
    const combo = laid.root.children[0]!;
    const slider = laid.root.children[1]!;
    expect(combo.width).toBe(200);
    expect(combo.height).toBe(40);
    expect(slider.width).toBe(250);
    expect(slider.height).toBe(30);
  });

  it('applies explicit w and h to chip and status', () => {
    const dsl = `window:
  row:
    chip "Tag" w=80 h=32
    status "Live" kind=success w=100 h=28`;
    const doc = parse(dsl);
    const laid = layout(doc, DEFAULT_THEME);
    const row = laid.root.children[0]!;
    const chip = row.children[0]!;
    const status = row.children[1]!;
    expect(chip.width).toBe(80);
    expect(chip.height).toBe(32);
    expect(status.width).toBe(100);
    expect(status.height).toBe(28);
  });

  it('supports string formatted lengths and px units', () => {
    const dsl = `window:
  row:
    input placeholder="Test" w="150px" h="40px"`;
    const doc = parse(dsl);
    const laid = layout(doc, DEFAULT_THEME);
    const row = laid.root.children[0]!;
    const input = row.children[0]!;
    expect(input.width).toBe(150);
    expect(input.height).toBe(40);
  });

  it('allows fixed-basis items to grow when grow is specified', () => {
    const dsl = `window w=400:
  row:
    button "A" w=100 grow=1
    button "B" w=100 grow=1`;
    const doc = parse(dsl);
    const laid = layout(doc, DEFAULT_THEME);
    const row = laid.root.children[0]!;
    const btnA = row.children[0]!;
    const btnB = row.children[1]!;
    expect(btnA.width).toBeGreaterThan(100);
    expect(btnB.width).toBeGreaterThan(100);
    expect(btnA.width).toBeCloseTo(btnB.width, 1);
  });
});
