/**
 * Wireloom 1D Flex Engine.
 *
 * Implements the CSS Flexible Box Layout §9.7 1D resolution algorithm.
 * Pure scalar mathematics with zero AST, SVG, or theme dependencies.
 */

/** Distribution of leftover main-axis space when nothing grows. */
export type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

/** Placement of an item across the container's cross axis. */
export type CrossAlign = 'start' | 'center' | 'end' | 'stretch';

/**
 * One participant in main-axis distribution.
 *
 * All fields are total (never optional). Callers normalise defaults at the
 * primitive boundary so the engine never has to guess what an absent value means.
 */
export interface AxisItem {
  /** Preferred main-axis extent before flexing. Finite, >= 0. */
  readonly basis: number;
  /** Share of positive free space. Finite, >= 0. 0 = never grows. */
  readonly grow: number;
  /** Weight for absorbing negative free space. Finite, >= 0. 0 = never shrinks. */
  readonly shrink: number;
  /** Hard floor. Finite, >= 0. */
  readonly min: number;
  /** Hard ceiling. >= min. `Infinity` permitted. */
  readonly max: number;
}

export interface AxisLayoutInput {
  readonly items: readonly AxisItem[];
  /** Content-box extent along the main axis. Finite, >= 0. */
  readonly available: number;
  /** Inter-item gap. Finite, >= 0. */
  readonly gap: number;
  readonly justify: Justify;
}

export interface AxisLayoutResult {
  /** Resolved extent per item, index-aligned with `input.items`. */
  readonly sizes: readonly number[];
  /** Main-axis offset per item, relative to the content-box origin. Strictly non-decreasing. */
  readonly offsets: readonly number[];
  /** sum(sizes) + gaps. Excludes justify padding. */
  readonly content: number;
  /** max(0, content - available). Non-zero means the caller must clip or report. */
  readonly overflow: number;
}

const EPS = 1e-9;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

function validateInput(input: AxisLayoutInput): void {
  if (!Number.isFinite(input.available) || input.available < 0) {
    throw new RangeError(`available must be a non-negative finite number, got ${input.available}`);
  }
  if (!Number.isFinite(input.gap) || input.gap < 0) {
    throw new RangeError(`gap must be a non-negative finite number, got ${input.gap}`);
  }
  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i]!;
    if (!Number.isFinite(item.basis) || item.basis < 0) {
      throw new RangeError(`items[${i}].basis must be finite and >= 0, got ${item.basis}`);
    }
    if (!Number.isFinite(item.grow) || item.grow < 0) {
      throw new RangeError(`items[${i}].grow must be finite and >= 0, got ${item.grow}`);
    }
    if (!Number.isFinite(item.shrink) || item.shrink < 0) {
      throw new RangeError(`items[${i}].shrink must be finite and >= 0, got ${item.shrink}`);
    }
    if (!Number.isFinite(item.min) || item.min < 0) {
      throw new RangeError(`items[${i}].min must be finite and >= 0, got ${item.min}`);
    }
    if (Number.isNaN(item.max) || item.max < item.min) {
      throw new RangeError(`items[${i}].max must be >= min (${item.min}), got ${item.max}`);
    }
  }
}

/**
 * Resolves main-axis sizes and offsets for a list of items within an available extent.
 */
export function layoutAxis(input: AxisLayoutInput): AxisLayoutResult {
  validateInput(input);

  const n = input.items.length;
  if (n === 0) {
    return { sizes: [], offsets: [], content: 0, overflow: 0 };
  }

  const totalGap = input.gap * Math.max(0, n - 1);
  const inner = input.available - totalGap;

  // Step 1 — hypothetical sizes
  const h: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const it = input.items[i]!;
    h[i] = clamp(it.basis, it.min, it.max);
  }

  // Step 2 — determine flex direction
  let sumHypothetical = 0;
  for (let i = 0; i < n; i++) sumHypothetical += h[i]!;
  const free = inner - sumHypothetical;

  const size: number[] = new Array(n);
  const frozen: boolean[] = new Array(n).fill(false);

  if (Math.abs(free) <= EPS) {
    for (let i = 0; i < n; i++) size[i] = h[i]!;
  } else {
    const growing = free > 0;

    // Step 3 — initial freeze
    for (let i = 0; i < n; i++) {
      const it = input.items[i]!;
      if (
        (growing && it.grow <= EPS) ||
        (!growing && it.shrink <= EPS) ||
        (growing && it.basis > h[i]!) ||
        (!growing && it.basis < h[i]!)
      ) {
        frozen[i] = true;
        size[i] = h[i]!;
      }
    }

    // Step 4 — flex loop
    const unclamped: number[] = new Array(n);
    const clampedArr: number[] = new Array(n);
    const violation: number[] = new Array(n).fill(0);

    while (true) {
      let unfrozenCount = 0;
      let sumFrozenSizes = 0;
      let sumUnfrozenBasis = 0;
      let totalFactor = 0;
      let totalScaledShrink = 0;

      for (let i = 0; i < n; i++) {
        if (frozen[i]) {
          sumFrozenSizes += size[i]!;
        } else {
          unfrozenCount++;
          const it = input.items[i]!;
          sumUnfrozenBasis += it.basis;
          if (growing) {
            totalFactor += it.grow;
          } else {
            totalScaledShrink += it.shrink * it.basis;
          }
        }
      }

      if (unfrozenCount === 0) break;

      const remaining = inner - sumFrozenSizes - sumUnfrozenBasis;
      if (Math.abs(remaining) <= EPS) {
        for (let i = 0; i < n; i++) {
          if (!frozen[i]) {
            size[i] = input.items[i]!.basis;
            frozen[i] = true;
          }
        }
        break;
      }

      if (growing) {
        if (totalFactor <= EPS) {
          for (let i = 0; i < n; i++) {
            if (!frozen[i]) {
              size[i] = input.items[i]!.basis;
              frozen[i] = true;
            }
          }
          break;
        }
        for (let i = 0; i < n; i++) {
          if (!frozen[i]) {
            const it = input.items[i]!;
            unclamped[i] = it.basis + (remaining * it.grow) / totalFactor;
          }
        }
      } else {
        if (totalScaledShrink <= EPS) {
          for (let i = 0; i < n; i++) {
            if (!frozen[i]) {
              size[i] = input.items[i]!.basis;
              frozen[i] = true;
            }
          }
          break;
        }
        for (let i = 0; i < n; i++) {
          if (!frozen[i]) {
            const it = input.items[i]!;
            unclamped[i] = it.basis + (remaining * (it.shrink * it.basis)) / totalScaledShrink;
          }
        }
      }

      let totalViolation = 0;
      for (let i = 0; i < n; i++) {
        if (!frozen[i]) {
          const it = input.items[i]!;
          clampedArr[i] = clamp(unclamped[i]!, it.min, it.max);
          violation[i] = clampedArr[i]! - unclamped[i]!;
          size[i] = clampedArr[i]!;
          totalViolation += violation[i]!;
        }
      }

      if (Math.abs(totalViolation) <= EPS) {
        for (let i = 0; i < n; i++) {
          if (!frozen[i]) frozen[i] = true;
        }
        break;
      }

      if (totalViolation > 0) {
        // Freeze min violations
        for (let i = 0; i < n; i++) {
          if (!frozen[i] && violation[i]! > EPS) {
            frozen[i] = true;
          }
        }
      } else {
        // Freeze max violations
        for (let i = 0; i < n; i++) {
          if (!frozen[i] && violation[i]! < -EPS) {
            frozen[i] = true;
          }
        }
      }
    }
  }

  // Step 5 — main-axis placement & justify
  let sumSizes = 0;
  for (let i = 0; i < n; i++) sumSizes += size[i]!;
  const content = sumSizes + totalGap;
  const slack = Math.max(0, input.available - content);
  const overflow = Math.max(0, content - input.available);

  let leading = 0;
  let between = 0;

  if (slack > EPS) {
    switch (input.justify) {
      case 'start':
        leading = 0;
        between = 0;
        break;
      case 'center':
        leading = slack / 2;
        between = 0;
        break;
      case 'end':
        leading = slack;
        between = 0;
        break;
      case 'between':
        leading = 0;
        between = n > 1 ? slack / (n - 1) : 0;
        break;
      case 'around':
        leading = n > 0 ? slack / (2 * n) : 0;
        between = n > 0 ? slack / n : 0;
        break;
      case 'evenly':
        leading = slack / (n + 1);
        between = slack / (n + 1);
        break;
    }
  }

  const offsets: number[] = new Array(n);
  offsets[0] = leading;
  for (let i = 1; i < n; i++) {
    offsets[i] = offsets[i - 1]! + size[i - 1]! + input.gap + between;
  }

  return {
    sizes: size,
    offsets,
    content,
    overflow,
  };
}

/**
 * Cross-axis placement for a single item within a line of known extent.
 */
export function alignCross(
  itemSize: number,
  lineSize: number,
  align: CrossAlign,
): { readonly offset: number; readonly size: number } {
  if (!Number.isFinite(itemSize) || itemSize < 0) {
    throw new RangeError(`itemSize must be finite and >= 0, got ${itemSize}`);
  }
  if (!Number.isFinite(lineSize) || lineSize < 0) {
    throw new RangeError(`lineSize must be finite and >= 0, got ${lineSize}`);
  }

  switch (align) {
    case 'start':
      return { offset: 0, size: itemSize };
    case 'center':
      return { offset: (lineSize - itemSize) / 2, size: itemSize };
    case 'end':
      return { offset: lineSize - itemSize, size: itemSize };
    case 'stretch':
      return { offset: 0, size: lineSize };
  }
}
