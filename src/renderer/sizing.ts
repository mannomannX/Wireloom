/**
 * Universal Sizing System for Wireloom.
 *
 * Resolves node attributes (w=, h=, min-w=, max-w=, grow=, shrink=, etc.)
 * into AxisItem descriptions consumed by the layoutAxis engine.
 */

import type { AnyNode, Attribute } from '../parser/ast.js';
import type { AxisItem } from './axis.js';

export type SizingMode = 'hug' | 'fixed' | 'percent' | 'fraction' | 'fill';

export interface ResolvedLength {
  readonly mode: SizingMode;
  /** Value: pixels for fixed, 0-100 for percent, factor for fraction/fill, 0 for hug. */
  readonly value: number;
}

export function getAttrString(attrs: Attribute[], key: string): string | undefined {
  for (const a of attrs) {
    if (a.kind === 'pair' && a.key === key && a.value.kind === 'string') {
      return a.value.value;
    }
  }
  return undefined;
}

export function getAttrNumber(attrs: Attribute[], key: string): number | undefined {
  for (const a of attrs) {
    if (a.kind === 'pair' && a.key === key) {
      if (a.value.kind === 'number') return a.value.value;
      if (a.value.kind === 'string') {
        const num = parseFloat(a.value.value.trim().replace(/px$/, ''));
        if (!Number.isNaN(num)) return num;
      }
    }
  }
  return undefined;
}

export function getAttrIdentifier(attrs: Attribute[], key: string): string | undefined {
  for (const a of attrs) {
    if (a.kind === 'pair' && a.key === key) {
      if (a.value.kind === 'identifier') return a.value.value;
      if (a.value.kind === 'string') return a.value.value;
    }
  }
  return undefined;
}

export function hasFlagAttr(attrs: Attribute[], flag: string): boolean {
  return attrs.some((a) => a.kind === 'flag' && a.flag === flag);
}

/**
 * Parses length specification from an attribute pair or identifier (e.g. w=320, w=50%, w=2fr, w=fill, w=hug).
 */
export function parseLengthAttr(attrs: Attribute[], key: string): ResolvedLength | undefined {
  for (const a of attrs) {
    if (a.kind !== 'pair' || a.key !== key) continue;
    if (a.value.kind === 'number') {
      if (a.value.unit === 'percent') {
        return { mode: 'percent', value: a.value.value };
      }
      if (a.value.unit === 'fr') {
        return { mode: 'fraction', value: a.value.value };
      }
      return { mode: 'fixed', value: a.value.value };
    }
    if (a.value.kind === 'identifier') {
      if (a.value.value === 'fill') return { mode: 'fill', value: 1 };
      if (a.value.value === 'hug') return { mode: 'hug', value: 0 };
    }
    if (a.value.kind === 'string') {
      const s = a.value.value.trim();
      if (s === 'fill') return { mode: 'fill', value: 1 };
      if (s === 'hug') return { mode: 'hug', value: 0 };
      if (s.endsWith('%')) {
        const num = parseFloat(s.slice(0, -1));
        if (!Number.isNaN(num)) return { mode: 'percent', value: num };
      }
      if (s.endsWith('fr')) {
        const num = parseFloat(s.slice(0, -2));
        if (!Number.isNaN(num)) return { mode: 'fraction', value: num };
      }
      if (s.endsWith('px')) {
        const num = parseFloat(s.slice(0, -2));
        if (!Number.isNaN(num)) return { mode: 'fixed', value: num };
      }
      const num = parseFloat(s);
      if (!Number.isNaN(num)) return { mode: 'fixed', value: num };
    }
  }
  return undefined;
}

export interface ResolveAxisItemOptions {
  readonly node: AnyNode;
  readonly intrinsic: number;
  readonly parentExtent: number;
  readonly axis: 'x' | 'y';
  readonly defaultMode?: SizingMode;
}

/**
 * Translates a child node's sizing attributes and intrinsic extent into an AxisItem.
 */
export function resolveToAxisItem(opts: ResolveAxisItemOptions): AxisItem {
  const { node, intrinsic, parentExtent, axis } = opts;
  const attrs = node.attributes ?? [];

  if (node.kind === 'spacer') {
    const grow = getAttrNumber(attrs, 'grow') ?? 1;
    return {
      basis: 0,
      grow,
      shrink: 0,
      min: 0,
      max: Infinity,
    };
  }

  const lengthKey = axis === 'x' ? 'w' : 'h';
  const minKey = axis === 'x' ? 'min-w' : 'min-h';
  const maxKey = axis === 'x' ? 'max-w' : 'max-h';

  const len = parseLengthAttr(attrs, lengthKey);
  const minVal = getAttrNumber(attrs, minKey);
  const maxVal = getAttrNumber(attrs, maxKey);

  const customGrow = getAttrNumber(attrs, 'grow');
  const customShrink = getAttrNumber(attrs, 'shrink');

  // col has legacy positional width
  if (node.kind === 'col' && axis === 'x' && !len) {
    if (node.width.kind === 'fill') {
      const min = Math.max(0, minVal ?? intrinsic);
      const max = Math.max(min, maxVal ?? Infinity);
      return {
        basis: intrinsic,
        grow: customGrow ?? 1,
        shrink: customShrink ?? 0,
        min,
        max,
      };
    }
    if (node.width.kind === 'length' && node.width.unit === 'px') {
      const fixed = node.width.value;
      const min = Math.max(0, minVal ?? (customShrink ? 0 : fixed));
      const max = Math.max(min, maxVal ?? (customGrow ? Infinity : fixed));
      return {
        basis: fixed,
        grow: customGrow ?? 0,
        shrink: customShrink ?? 0,
        min,
        max,
      };
    }
  }

  const mode = len?.mode ?? opts.defaultMode ?? 'hug';

  let basis = intrinsic;
  let grow = customGrow ?? 0;
  let shrink = customShrink ?? 0;
  let min = Math.max(0, minVal ?? (mode === 'fixed' || mode === 'percent' ? 0 : intrinsic));
  let max = Math.max(min, maxVal ?? (mode === 'fixed' || mode === 'percent' ? 0 : Infinity));

  if (mode === 'fixed') {
    basis = len!.value;
    min = Math.max(0, minVal ?? (shrink > 0 ? 0 : basis));
    max = Math.max(min, maxVal ?? (grow > 0 ? Infinity : basis));
  } else if (mode === 'percent') {
    basis = Math.max(0, (parentExtent * len!.value) / 100);
    min = Math.max(0, minVal ?? (shrink > 0 ? 0 : basis));
    max = Math.max(min, maxVal ?? (grow > 0 ? Infinity : basis));
  } else if (mode === 'fraction') {
    basis = intrinsic;
    grow = customGrow ?? len!.value;
    min = Math.max(0, minVal ?? intrinsic);
    max = Math.max(min, maxVal ?? Infinity);
  } else if (mode === 'fill') {
    basis = intrinsic;
    grow = customGrow ?? 1;
    min = Math.max(0, minVal ?? intrinsic);
    max = Math.max(min, maxVal ?? Infinity);
  } else {
    // hug
    basis = intrinsic;
    min = Math.max(0, minVal ?? intrinsic);
    max = Math.max(min, maxVal ?? Infinity);
  }

  return {
    basis,
    grow,
    shrink,
    min,
    max,
  };
}
