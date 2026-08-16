import { describe, expect, it } from 'vitest';
import { resolveTracks, type TrackDef } from '../../src/renderer/tracks.js';

describe('2D Track Engine (resolveTracks)', () => {
  it('handles empty definitions gracefully', () => {
    const res = resolveTracks({
      definitions: [],
      available: 500,
      gap: 10,
    });
    expect(res.sizes).toEqual([]);
    expect(res.offsets).toEqual([]);
    expect(res.total).toBe(0);
  });

  it('resolves fixed tracks with gaps', () => {
    const definitions: TrackDef[] = [
      { sizing: 'fixed', value: 100 },
      { sizing: 'fixed', value: 200 },
      { sizing: 'fixed', value: 150 },
    ];
    const res = resolveTracks({
      definitions,
      available: 600,
      gap: 10,
    });
    expect(res.sizes).toEqual([100, 200, 150]);
    expect(res.offsets).toEqual([0, 110, 320]);
    expect(res.total).toBe(470);
  });

  it('resolves fr tracks distributing available space evenly', () => {
    const definitions: TrackDef[] = [
      { sizing: 'fr', value: 1 },
      { sizing: 'fr', value: 1 },
    ];
    const res = resolveTracks({
      definitions,
      available: 210, // 210 - 10 gap = 200 => 100 each
      gap: 10,
    });
    expect(res.sizes).toEqual([100, 100]);
    expect(res.offsets).toEqual([0, 110]);
    expect(res.total).toBe(210);
  });

  it('resolves weighted fr tracks (1fr, 2fr, 1fr)', () => {
    const definitions: TrackDef[] = [
      { sizing: 'fr', value: 1 },
      { sizing: 'fr', value: 2 },
      { sizing: 'fr', value: 1 },
    ];
    const res = resolveTracks({
      definitions,
      available: 420, // 420 - 20 gaps = 400 => 100, 200, 100
      gap: 10,
    });
    expect(res.sizes).toEqual([100, 200, 100]);
    expect(res.offsets).toEqual([0, 110, 320]);
    expect(res.total).toBe(420);
  });

  it('resolves auto tracks sizing to content', () => {
    const definitions: TrackDef[] = [
      { sizing: 'auto', value: 0 },
      { sizing: 'auto', value: 0 },
    ];
    const res = resolveTracks({
      definitions,
      available: 500,
      gap: 10,
      minSizes: [40, 60],
      maxSizes: [120, 180],
    });
    expect(res.sizes).toEqual([120, 180]);
    expect(res.offsets).toEqual([0, 130]);
    expect(res.total).toBe(310);
  });

  it('resolves mixed fixed, auto, and fr tracks', () => {
    const definitions: TrackDef[] = [
      { sizing: 'fixed', value: 100 },
      { sizing: 'auto', value: 0 },
      { sizing: 'fr', value: 1 },
    ];
    const res = resolveTracks({
      definitions,
      available: 400, // 400 - 20 gaps = 380. fixed: 100, auto: 80 => fr gets 200
      gap: 10,
      minSizes: [0, 50, 0],
      maxSizes: [0, 80, 0],
    });
    expect(res.sizes).toEqual([100, 80, 200]);
    expect(res.offsets).toEqual([0, 110, 200]);
    expect(res.total).toBe(400);
  });

  it('respects min-content floors for fr tracks under squeeze', () => {
    const definitions: TrackDef[] = [
      { sizing: 'fr', value: 1 },
      { sizing: 'fr', value: 1 },
    ];
    const res = resolveTracks({
      definitions,
      available: 110, // 110 - 10 = 100. Fr split would give 50 each, but track 0 has min 70
      gap: 10,
      minSizes: [70, 20],
    });
    expect(res.sizes[0]).toBe(70);
    expect(res.sizes[1]).toBe(30);
  });

  it('squeezes auto tracks down to minSize when under extreme overflow', () => {
    const definitions: TrackDef[] = [
      { sizing: 'fixed', value: 100 },
      { sizing: 'auto', value: 0 },
    ];
    const res = resolveTracks({
      definitions,
      available: 160, // 160 - 10 gap = 150. fixed is 100. max auto is 80 (total 180). auto squeezed to 50
      gap: 10,
      minSizes: [0, 40],
      maxSizes: [0, 80],
    });
    expect(res.sizes[0]).toBe(100);
    expect(res.sizes[1]).toBe(50);
  });

  it('throws RangeError on negative available or gap', () => {
    expect(() =>
      resolveTracks({
        definitions: [{ sizing: 'fixed', value: 100 }],
        available: -10,
        gap: 0,
      }),
    ).toThrow(RangeError);

    expect(() =>
      resolveTracks({
        definitions: [{ sizing: 'fixed', value: 100 }],
        available: 100,
        gap: -5,
      }),
    ).toThrow(RangeError);
  });
});
