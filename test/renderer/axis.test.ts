import { describe, expect, it } from 'vitest';
import { alignCross, layoutAxis, type AxisItem, type Justify } from '../../src/renderer/axis.js';

describe('layoutAxis — unit tests', () => {
  it('handles empty input gracefully', () => {
    const res = layoutAxis({ items: [], available: 100, gap: 10, justify: 'start' });
    expect(res).toEqual({
      sizes: [],
      offsets: [],
      content: 0,
      overflow: 0,
    });
  });

  it('handles single item without grow', () => {
    const items: AxisItem[] = [{ basis: 50, grow: 0, shrink: 0, min: 0, max: Infinity }];
    const res = layoutAxis({ items, available: 100, gap: 10, justify: 'start' });
    expect(res.sizes).toEqual([50]);
    expect(res.offsets).toEqual([0]);
    expect(res.content).toBe(50);
    expect(res.overflow).toBe(0);
  });

  it('distributes free space 1:1 among equal growers', () => {
    const items: AxisItem[] = [
      { basis: 20, grow: 1, shrink: 0, min: 0, max: Infinity },
      { basis: 20, grow: 1, shrink: 0, min: 0, max: Infinity },
    ];
    // available = 100, gap = 10 -> inner = 90. initial sum = 40. free = 50. Each gets 25 -> 45
    const res = layoutAxis({ items, available: 100, gap: 10, justify: 'start' });
    expect(res.sizes).toEqual([45, 45]);
    expect(res.offsets).toEqual([0, 55]);
    expect(res.content).toBe(100);
  });

  it('distributes free space 2:1 by grow factor', () => {
    const items: AxisItem[] = [
      { basis: 10, grow: 2, shrink: 0, min: 0, max: Infinity },
      { basis: 10, grow: 1, shrink: 0, min: 0, max: Infinity },
    ];
    // available = 110, gap = 20 -> inner = 90. initial = 20. free = 70.
    // 70 * (2/3) ~ 46.666..., 70 * (1/3) ~ 23.333...
    // sizes: [10 + 46.666..., 10 + 23.333...] -> [56.666..., 33.333...]
    const res = layoutAxis({ items, available: 110, gap: 20, justify: 'start' });
    expect(res.sizes[0]).toBeCloseTo(56.6666666, 5);
    expect(res.sizes[1]).toBeCloseTo(33.3333333, 5);
    expect(res.content).toBeCloseTo(110, 5);
  });

  it('redistributes excess when a grower is clamped by max', () => {
    const items: AxisItem[] = [
      { basis: 20, grow: 1, shrink: 0, min: 0, max: 40 }, // max clamped at 40
      { basis: 20, grow: 1, shrink: 0, min: 0, max: Infinity },
    ];
    // available = 110, gap = 10 -> inner = 100. sum = 40. free = 60.
    // Pass 1: item0 unclamped = 50 -> clamped to 40 (violation -10).
    // Loop freezes item0 at 40. Remaining for item1 = 100 - 40 - 20 = 40 -> item1 size = 20 + 40 = 60.
    const res = layoutAxis({ items, available: 110, gap: 10, justify: 'start' });
    expect(res.sizes).toEqual([40, 60]);
    expect(res.content).toBe(110);
  });

  it('handles multi-level clamping cascade', () => {
    const items: AxisItem[] = [
      { basis: 10, grow: 1, shrink: 0, min: 0, max: 30 },
      { basis: 10, grow: 1, shrink: 0, min: 0, max: 50 },
      { basis: 10, grow: 1, shrink: 0, min: 0, max: Infinity },
    ];
    // available = 180, gap = 0 -> inner = 180. sum = 30. free = 150.
    // iter 1: each would get +50 -> [60, 60, 60]. Violations: item0(-30), item1(-10). Total viols < 0 -> freezes max violations.
    // item0 clamped to 30.
    // iter 2: remaining free for 1,2 = 180 - 30 - 20 = 130. Each gets +65 -> item1 unclamped 75 -> clamped to 50.
    // iter 3: item2 gets remaining = 180 - 30 - 50 = 100.
    const res = layoutAxis({ items, available: 180, gap: 0, justify: 'start' });
    expect(res.sizes).toEqual([30, 50, 100]);
    expect(res.content).toBe(180);
  });

  it('weights negative free space shrink by basis', () => {
    const items: AxisItem[] = [
      { basis: 100, grow: 0, shrink: 1, min: 0, max: Infinity },
      { basis: 50, grow: 0, shrink: 1, min: 0, max: Infinity },
    ];
    // available = 120, gap = 0. inner = 120. sum = 150. free = -30.
    // scaled shrink = 100*1 + 50*1 = 150.
    // item0 gives up: 30 * (100/150) = 20 -> size 80.
    // item1 gives up: 30 * (50/150) = 10 -> size 40.
    const res = layoutAxis({ items, available: 120, gap: 0, justify: 'start' });
    expect(res.sizes).toEqual([80, 40]);
    expect(res.content).toBe(120);
  });

  describe('Justify distributions', () => {
    const items: AxisItem[] = [
      { basis: 20, grow: 0, shrink: 0, min: 0, max: Infinity },
      { basis: 30, grow: 0, shrink: 0, min: 0, max: Infinity },
    ];
    // content = 20 + 30 + 10 = 60. available = 100. slack = 40.

    it('justify=start', () => {
      const res = layoutAxis({ items, available: 100, gap: 10, justify: 'start' });
      expect(res.offsets).toEqual([0, 30]); // 0, 0 + 20 + 10
    });

    it('justify=center', () => {
      const res = layoutAxis({ items, available: 100, gap: 10, justify: 'center' });
      // slack/2 = 20
      expect(res.offsets).toEqual([20, 50]);
    });

    it('justify=end', () => {
      const res = layoutAxis({ items, available: 100, gap: 10, justify: 'end' });
      // slack = 40
      expect(res.offsets).toEqual([40, 70]);
    });

    it('justify=between with n=2', () => {
      const res = layoutAxis({ items, available: 100, gap: 10, justify: 'between' });
      // between = 40 / (2-1) = 40. offsets: 0, 0 + 20 + 10 + 40 = 70
      expect(res.offsets).toEqual([0, 70]);
    });

    it('justify=between with n=1 falls back to start', () => {
      const single: AxisItem[] = [{ basis: 40, grow: 0, shrink: 0, min: 0, max: Infinity }];
      const res = layoutAxis({ items: single, available: 100, gap: 10, justify: 'between' });
      expect(res.offsets).toEqual([0]);
    });

    it('justify=around', () => {
      const res = layoutAxis({ items, available: 100, gap: 10, justify: 'around' });
      // n=2, slack=40. leading = 40 / 4 = 10. between = 40 / 2 = 20.
      // offset 0: 10
      // offset 1: 10 + 20 + 10 + 20 = 60
      expect(res.offsets).toEqual([10, 60]);
    });

    it('justify=evenly', () => {
      const res = layoutAxis({ items, available: 100, gap: 10, justify: 'evenly' });
      // n=2, slack=40. unit = 40 / (2+1) = 13.3333333
      // offset 0: 13.3333333
      // offset 1: 13.3333333 + 20 + 10 + 13.3333333 = 56.6666666
      expect(res.offsets[0]).toBeCloseTo(13.3333333, 5);
      expect(res.offsets[1]).toBeCloseTo(56.6666666, 5);
    });
  });

  describe('Fail-fast input validation', () => {
    it('throws RangeError on negative available', () => {
      expect(() => layoutAxis({ items: [], available: -1, gap: 0, justify: 'start' })).toThrow(
        RangeError,
      );
    });

    it('throws RangeError on negative gap', () => {
      expect(() => layoutAxis({ items: [], available: 100, gap: -5, justify: 'start' })).toThrow(
        RangeError,
      );
    });

    it('throws RangeError on invalid item invariants', () => {
      const base: AxisItem = { basis: 10, grow: 0, shrink: 0, min: 0, max: 100 };
      expect(() =>
        layoutAxis({ items: [{ ...base, basis: -1 }], available: 100, gap: 0, justify: 'start' }),
      ).toThrow(RangeError);
      expect(() =>
        layoutAxis({ items: [{ ...base, grow: -1 }], available: 100, gap: 0, justify: 'start' }),
      ).toThrow(RangeError);
      expect(() =>
        layoutAxis({ items: [{ ...base, shrink: -1 }], available: 100, gap: 0, justify: 'start' }),
      ).toThrow(RangeError);
      expect(() =>
        layoutAxis({ items: [{ ...base, min: -1 }], available: 100, gap: 0, justify: 'start' }),
      ).toThrow(RangeError);
      expect(() =>
        layoutAxis({ items: [{ ...base, min: 50, max: 20 }], available: 100, gap: 0, justify: 'start' }),
      ).toThrow(RangeError);
      expect(() =>
        layoutAxis({ items: [{ ...base, basis: NaN }], available: 100, gap: 0, justify: 'start' }),
      ).toThrow(RangeError);
    });
  });
});

describe('alignCross', () => {
  it('alignCross start', () => {
    expect(alignCross(20, 60, 'start')).toEqual({ offset: 0, size: 20 });
  });

  it('alignCross center', () => {
    expect(alignCross(20, 60, 'center')).toEqual({ offset: 20, size: 20 });
  });

  it('alignCross end', () => {
    expect(alignCross(20, 60, 'end')).toEqual({ offset: 40, size: 20 });
  });

  it('alignCross stretch', () => {
    expect(alignCross(20, 60, 'stretch')).toEqual({ offset: 0, size: 60 });
  });

  it('throws on invalid inputs', () => {
    expect(() => alignCross(-1, 60, 'start')).toThrow(RangeError);
    expect(() => alignCross(20, -10, 'start')).toThrow(RangeError);
    expect(() => alignCross(NaN, 60, 'start')).toThrow(RangeError);
  });
});
