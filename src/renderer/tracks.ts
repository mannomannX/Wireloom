/**
 * Pure scalar 2D track sizing engine for CSS Grid and Table layouts.
 *
 * Implements standard track resolution:
 *   1. Fixed tracks take explicit pixel sizes.
 *   2. Auto tracks size to max content (or min-content under squeeze).
 *   3. Flexible (`fr`) tracks distribute remaining slack proportionally.
 *   4. Under-constraint squeezes gracefully respect min-content floors.
 *
 * Zero external dependencies. Fail-fast validation.
 */

export interface TrackDef {
  sizing: 'auto' | 'fixed' | 'fr';
  value: number; // px for 'fixed', fr weight for 'fr' (e.g. 1, 2), 0 for 'auto'
}

export interface TrackInput {
  definitions: TrackDef[];
  available: number;
  gap: number;
  minSizes?: number[]; // min size per track computed from content
  maxSizes?: number[]; // max size per track computed from content
}

export interface TrackResult {
  sizes: number[];
  offsets: number[];
  total: number;
}

function validateTrackInput(input: TrackInput): void {
  if (!Number.isFinite(input.available) || input.available < 0) {
    throw new RangeError(`available must be a non-negative finite number, got ${input.available}`);
  }
  if (!Number.isFinite(input.gap) || input.gap < 0) {
    throw new RangeError(`gap must be a non-negative finite number, got ${input.gap}`);
  }
  for (let i = 0; i < input.definitions.length; i++) {
    const def = input.definitions[i]!;
    if (!Number.isFinite(def.value) || def.value < 0) {
      throw new RangeError(
        `track definition ${i} value must be a non-negative finite number, got ${def.value}`,
      );
    }
  }
}

/**
 * Resolves 1D track sizes and offsets along an axis (columns or rows).
 */
export function resolveTracks(input: TrackInput): TrackResult {
  validateTrackInput(input);

  const n = input.definitions.length;
  if (n === 0) {
    return { sizes: [], offsets: [], total: 0 };
  }

  const gapTotal = (n - 1) * input.gap;
  const availableTrackSpace = Math.max(0, input.available - gapTotal);

  const sizes = new Array<number>(n).fill(0);
  const minSizes = input.minSizes ?? new Array<number>(n).fill(0);
  const maxSizes = input.maxSizes ?? new Array<number>(n).fill(0);

  // Step 1: Resolve fixed and auto tracks.
  let nonFrSpace = 0;
  for (let i = 0; i < n; i++) {
    const def = input.definitions[i]!;
    if (def.sizing === 'fixed') {
      sizes[i] = def.value;
      nonFrSpace += sizes[i]!;
    } else if (def.sizing === 'auto') {
      const autoSize = Math.max(minSizes[i] ?? 0, maxSizes[i] ?? 0);
      sizes[i] = autoSize;
      nonFrSpace += sizes[i]!;
    }
  }

  // Step 2: Distribute remaining space to fr tracks.
  let remainingForFr = availableTrackSpace - nonFrSpace;
  const frIndices: number[] = [];
  let totalFr = 0;
  for (let i = 0; i < n; i++) {
    const def = input.definitions[i]!;
    if (def.sizing === 'fr') {
      frIndices.push(i);
      totalFr += Math.max(0, def.value);
    }
  }

  if (frIndices.length > 0) {
    if (remainingForFr > 0 && totalFr > 0) {
      // Free space distribution with iterative min clamp loop.
      const unconstrained = new Set<number>(frIndices);
      let spaceToDistribute = remainingForFr;
      let frSum = totalFr;

      let changed = true;
      while (changed && unconstrained.size > 0) {
        changed = false;
        const unit = frSum > 0 ? spaceToDistribute / frSum : 0;

        for (const i of Array.from(unconstrained)) {
          const def = input.definitions[i]!;
          const raw = def.value * unit;
          const min = minSizes[i] ?? 0;

          if (raw < min) {
            sizes[i] = min;
            spaceToDistribute -= min;
            frSum -= def.value;
            unconstrained.delete(i);
            changed = true;
          }
        }
      }

      if (unconstrained.size > 0 && frSum > 0) {
        const finalUnit = Math.max(0, spaceToDistribute) / frSum;
        for (const i of unconstrained) {
          const def = input.definitions[i]!;
          sizes[i] = Math.max(minSizes[i] ?? 0, def.value * finalUnit);
        }
      }
    } else {
      // Zero or negative space: fr tracks take their minSizes floor.
      for (const i of frIndices) {
        sizes[i] = minSizes[i] ?? 0;
      }
    }
  }

  // Step 3: Handle overall overflow squeeze if total allocated exceeds available.
  const totalAllocated = sizes.reduce((acc, s) => acc + s, 0);
  if (totalAllocated > availableTrackSpace && availableTrackSpace > 0) {
    // Squeeze auto tracks first down to minSize.
    let excess = totalAllocated - availableTrackSpace;
    for (let i = 0; i < n && excess > 0; i++) {
      const def = input.definitions[i]!;
      if (def.sizing === 'auto') {
        const min = minSizes[i] ?? 0;
        const reducible = Math.max(0, sizes[i]! - min);
        const reduction = Math.min(excess, reducible);
        sizes[i]! -= reduction;
        excess -= reduction;
      }
    }
  }

  // Step 4: Compute offsets and total.
  const offsets = new Array<number>(n).fill(0);
  let cursor = 0;
  for (let i = 0; i < n; i++) {
    offsets[i] = cursor;
    cursor += sizes[i]! + input.gap;
  }
  const total = cursor > 0 ? cursor - input.gap : 0;

  return { sizes, offsets, total };
}
