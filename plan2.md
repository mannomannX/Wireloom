# Design: `layoutAxis` — One Flex Engine

> **Status:** proposal for v0.8
> **Scope:** `src/renderer/axis.ts` (new), all `position*` functions in `src/renderer/layout.ts`, `row`/`col` attribute grammar
> **Breaking:** yes — `align=left|center|right` is removed. See [§9 Migration](#9-migration).

---

## 1. Motivation

Wireloom currently implements "distribute children along an axis" **eleven times**. Six of them
are load-bearing container layouts, five are ad-hoc strips:

| Implementation | File | Model |
|---|---|---|
| `positionRow` | layout.ts | fill-col → spacer → justify → align (4-level cascade) |
| `positionCol` | layout.ts | spacer → justify (mirror of the above, added v0.7) |
| `positionHeaderOrFooter` | layout.ts | three branches: spacer / lone-anchoring-row / right-pack |
| `positionNavbar` + `positionNavbarSlot` | layout.ts | left/right anchoring, center absolute |
| `positionTabBar` | layout.ts | equal division |
| `positionSlotFooter` | layout.ts | hardcoded right-pack, no attributes accepted |
| `positionStats` | layout.ts | fixed gap strip |
| `positionResourceBar` | layout.ts | fixed gap strip |
| `positionBreadcrumb` | layout.ts | fixed gap + separator reservation |
| `positionSegmented` | layout.ts | equal division |
| `positionMenubar` | layout.ts | pack-from-start strip |

Three symptoms show this is structural, not incidental:

1. **A documented precedence cascade.** `AGENTS.md` has to teach authors that
   "a `fill` col wins over everything, then `spacer` wins over `justify`, then `justify` wins
   over `align=`". That is four competing models, not one language feature.

2. **A parse error for a layout combination.** v0.7 made `align=right` + `spacer` in the same
   `row` an error, because the two models express contradictory intent. A grammar that has to
   forbid attribute combinations is describing an implementation collision, not a design.

3. **No cross axis at all.** You cannot vertically centre a button next to a tall panel. For
   dashboard chrome (title left, actions right, all on one optical baseline) that is a daily need.

`layoutAxis` replaces all eleven with one pure function. It is also the substrate for
[track sizing](./table.md#3-shared-module-track-sizing), so it gets reused a twelfth and
thirteenth time by `table` and `grid track=auto`.

### Non-goals

- **Wrapping / multi-line flex.** One line per container. Text wrapping is a separate concern
  (`measureText` + `wrap` attribute), not flex-wrap.
- **Baseline alignment.** Deliberately deferred; the extension point is named in [§5.3](#53-extension-point-baseline).
- **Absolute positioning.** `sheet` and `annotation` keep their own placement code; they are
  overlays, not participants in a flow.

---

## 2. The model

CSS flexbox, reduced to the subset a wireframe DSL actually needs, with CSS's resolution
semantics preserved exactly (so behaviour is predictable to anyone who has used flexbox —
which includes every LLM author).

Two orthogonal axes:

- **Main axis** — the direction children flow. Controlled by `basis` / `grow` / `shrink` per
  item, and `justify` + `gap` per container.
- **Cross axis** — perpendicular. Controlled by `align` per container, overridable per item.

A container declares which physical direction is "main":

| Container | Main axis |
|---|---|
| `row`, `header` (band mode), `footer`, `navbar` slots, `tabbar`, `stats`, `resourcebar`, `breadcrumb`, `segmented`, `menubar`, table columns | horizontal |
| `col`, `panel`, `section`, `slot`, `list`, `window` body, `header` (title mode), table rows | vertical |

The engine itself is direction-agnostic: it operates on scalars. The caller maps
`main → x/width` or `main → y/height`.

---

## 3. Public API

```ts
// src/renderer/axis.ts — zero dependencies on AST, theme, or SVG.

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

export function layoutAxis(input: AxisLayoutInput): AxisLayoutResult;

/** Cross-axis placement for a single item within a line of known extent. */
export function alignCross(
  itemSize: number,
  lineSize: number,
  align: CrossAlign,
): { readonly offset: number; readonly size: number };
```

### 3.1 Fail-fast contract

`layoutAxis` throws `RangeError` on any of:

- `available < 0`, or non-finite
- `gap < 0`, or non-finite
- any `basis < 0`, `grow < 0`, `shrink < 0`, `min < 0`
- any `max < min`
- any `NaN` in any field

These are **internal invariant violations**, not author errors. If a primitive spec produces
them, the primitive is buggy. Silently clamping would hide the bug and produce a plausible-looking
but wrong wireframe — the worst failure mode for a tool whose entire output is visual.

`items.length === 0` is *valid* and returns `{ sizes: [], offsets: [], content: 0, overflow: 0 }`.
An empty container is a legitimate authoring state (`header large:` with no title is documented).

---

## 4. Main-axis algorithm

The CSS Flexible Box Layout §9.7 resolution algorithm, with the multi-line and
`align-content` machinery removed.

### 4.1 Notation

```
n        = items.length
totalGap = gap * max(0, n - 1)
inner    = available - totalGap        // space actually available to items
clamp(v, lo, hi) = min(max(v, lo), hi)
EPS      = 1e-9                        // used ONLY for zero-comparisons
```

### 4.2 Resolution

```
Step 1 — hypothetical sizes
  h[i] = clamp(basis[i], min[i], max[i])

Step 2 — determine flex direction
  free = inner - Σ h[i]
  if |free| <= EPS:            size[i] = h[i] for all i;  goto Step 5
  growing = free > 0

Step 3 — initial freeze
  For each i, frozen[i] = true when any of:
    (a) growing && grow[i]  == 0        // no growth factor
    (b) !growing && shrink[i] == 0      // no shrink factor
    (c) growing && basis[i] > h[i]      // basis was clamped DOWN by max → already maximal
    (d) !growing && basis[i] < h[i]     // basis was clamped UP by min  → already minimal
  size[i] = h[i] for every frozen i

Step 4 — flex loop
  while ∃ i with !frozen[i]:
    U = { i : !frozen[i] }
    remaining = inner - Σ_{frozen} size[j] - Σ_{i∈U} basis[i]

    if |remaining| <= EPS:
      size[i] = basis[i] for i ∈ U;  freeze all;  break

    if growing:
      totalFactor = Σ_{i∈U} grow[i]
      unclamped[i] = basis[i] + remaining * grow[i] / totalFactor
    else:
      // CSS weights shrink by basis, so wide items give up more absolute space.
      totalScaled = Σ_{i∈U} shrink[i] * basis[i]
      if totalScaled <= EPS:
        // Every unfrozen item has basis 0 → shrinking is a no-op.
        size[i] = basis[i] for i ∈ U;  freeze all;  break
      unclamped[i] = basis[i] + remaining * (shrink[i] * basis[i]) / totalScaled

    clamped[i]   = clamp(unclamped[i], min[i], max[i])
    violation[i] = clamped[i] - unclamped[i]
    size[i]      = clamped[i]                       for i ∈ U
    total        = Σ_{i∈U} violation[i]

    if |total| <= EPS:            freeze all of U;                       break
    if total > 0:                 freeze { i ∈ U : violation[i] > 0 }    // min violations
    else:                         freeze { i ∈ U : violation[i] < 0 }    // max violations

Step 5 — main-axis placement (see §4.4)
```

### 4.3 Termination and correctness

**Termination.** Each loop iteration either breaks or freezes at least one item: when
`|total| > EPS` at least one `violation[i]` is non-zero and shares its sign with `total`
(a sum whose magnitude exceeds `EPS` has a summand of the same sign). `|U|` therefore strictly
decreases. The loop runs at most `n` iterations. **Worst case is `O(n²)`, and `n` is the child
count of one container — single digits in practice, bounded by the source file otherwise.**

**Post-conditions** (asserted in debug builds, property-tested always):

1. `min[i] ≤ size[i] ≤ max[i]` for all `i`.
2. If no item was frozen by clamping and `Σ grow > 0` and `free > 0`, then
   `Σ size[i] + totalGap = available` (up to `EPS`) — space is exactly consumed.
3. `offsets` is non-decreasing, and `offsets[i] + sizes[i] ≤ offsets[i+1]` — **no sibling overlap**,
   which is the invariant the current fixture suite only checks accidentally.
4. `overflow > 0` ⟺ the items could not be shrunk to fit; the caller decides the response.

**Floating point.** The engine performs **no rounding**. `EPS` appears only in comparisons,
never as a snap target. Rounding to device pixels is an emit-time concern and would break
post-condition 2 if applied here. Accumulated error over a container's children is bounded by
`n · ulp(available)` — around `10⁻¹²` px for realistic canvases, far below SVG's rendering
resolution.

### 4.4 Justify distribution

```
content = Σ size[i] + totalGap
slack   = max(0, available - content)
```

If any item grew, `slack = 0` by construction — **`justify` and `grow` cannot conflict.**
This is the property that dissolves the v0.7 precedence cascade.

| `justify` | `leading` | `between` (added to `gap`) |
|---|---|---|
| `start` | `0` | `0` |
| `center` | `slack / 2` | `0` |
| `end` | `slack` | `0` |
| `between` | `0` | `slack / (n-1)` — falls back to `start` when `n < 2` |
| `around` | `slack / (2n)` | `slack / n` |
| `evenly` | `slack / (n+1)` | `slack / (n+1)` |

```
offsets[0] = leading
offsets[i] = offsets[i-1] + sizes[i-1] + gap + between
```

`between` with `n === 1` deliberately degrades to `start`, not to `center`: a single child
under "space between the items" has no gap to distribute, and `start` is the least surprising
of the two readings. This is stated because the current implementation guards `n > 1` silently.

`evenly` is new. It costs one table row and completes the set; CSS authors expect it.

---

## 5. Cross axis

```
alignCross(itemSize, lineSize, align):
  start   → { offset: 0,                        size: itemSize }
  center  → { offset: (lineSize - itemSize)/2,  size: itemSize }
  end     → { offset: lineSize - itemSize,      size: itemSize }
  stretch → { offset: 0,                        size: lineSize }
```

`lineSize` is the container's cross extent: for a `row`, `max(child heights)` unless the row
carries an explicit `h=`.

### 5.1 `stretch` and explicit cross sizes

`stretch` is ignored for an item that declares an explicit cross size (`h=` on a child of a
`row`). Explicit beats inherited; the item falls back to `start`. This is CSS behaviour and
prevents "why is my `h=120` panel 400px tall" bug reports.

### 5.2 Per-item override

Any container child may carry `self-align=start|center|end|stretch`, overriding the parent's
`align=`. One attribute, one rule, no new primitive. This is what lets a toolbar keep
`align=center` while one child pins to the bottom.

### 5.3 Extension point: baseline

`CrossAlign` deliberately excludes `'baseline'` in v0.8. Adding it requires
`Measured.baseline?: number` threaded through every `measure*` function, which is a bigger
change than it looks and not needed for dashboards. The type is a string union, so adding the
member later is additive. **The extension point is `MeasureCtx` returning `{ size, baseline }`
instead of `Size`** — noted here so nobody designs against `Size` in a way that blocks it.

---

## 6. Mapping the existing containers

Every container becomes: *build `AxisItem[]` → call `layoutAxis` → call `alignCross` per item.*
No container keeps bespoke distribution code.

| Container | `AxisItem` construction | default `justify` | default `align` |
|---|---|---|---|
| `row` | see §6.1 | from `justify=`, else `start` | `start` (see §9.3) |
| `col` | mirror of `row` on the vertical axis | from `justify=`, else `start` | `stretch` |
| `footer` | children | **`end`** — this *is* the right-pack | `center` |
| `header` (title mode) | children, vertical | `start` | `center` |
| `header` (band mode) | children, horizontal | `start` | `center` |
| `tabbar` | every item `{basis:0, grow:1, shrink:0, min:intrinsic, max:∞}` | `start` | `stretch` |
| `segmented` | every item `{basis:maxLabelW, grow:1, ...}` | `start` | `stretch` |
| `slotFooter` | children | **`end`** — replaces the hardcoding | `center` |
| `stats`, `resourcebar`, `breadcrumb`, `menubar` | children, `grow:0` | `start` | `center` |
| `navbar` | see §6.2 | — | `center` |

### 6.1 `spacer` and `fill` stop being special

```ts
function toAxisItem(child: LaidChild, main: 'x' | 'y'): AxisItem {
  // spacer: pure flex gap, contributes nothing intrinsic on either axis.
  if (child.kind === 'spacer') {
    return { basis: 0, grow: attrNumber(child, 'grow') ?? 1, shrink: 0, min: 0, max: Infinity };
  }
  const size = resolveSize(child, main);            // from w= / h= / intrinsic
  return {
    basis:  size.basis,
    grow:   size.mode === 'fill' ? size.factor : (attrNumber(child, 'grow') ?? 0),
    shrink: attrNumber(child, 'shrink') ?? 0,
    min:    size.min,
    max:    size.max,
  };
}
```

Neither `spacer` nor `col fill` appears anywhere in `layoutAxis`. They are ordinary items with
`grow > 0`. The three-branch cascade in `positionRow` and the special-case in
`positionHeaderOrFooter` (`spacerCount > 0 ? … : loneAnchoringRow ? … : rightPack`) both
collapse to a single call.

**New author-facing attribute:** `grow=N` on any container child, and on `spacer`. This is the
"less rigid, still simple" lever — `col grow=2` next to `col grow=1` gives a 2:1 split with no
new vocabulary and no percentage arithmetic.

### 6.2 `navbar` is an anchored-centre band, not plain justify

`navbar` centres its `center:` slot on the **container** midpoint, not on the midpoint of the
space left over by `leading:` and `trailing:`. Plain `justify=between` cannot express that, and
approximating it would visibly shift titles whenever the two side clusters differ in width — the
common case (back button left, one icon right).

It is therefore a documented **composite**, not an engine feature:

```
1. layoutAxis([leading, trailing], available, gap, justify: 'between')
2. centre.offset = (available - centre.size) / 2          // independent of 1
3. if centre overlaps leading or trailing → diagnostic 'navbar-center-collision'
```

Step 3 is new. Today the clusters silently overlap when the window is narrow; the measure pass
guarantees enough room only at the *minimum* window width. A diagnostic is the honest response —
the layout is still emitted, the author is told it is wrong.

---

## 7. Integration with the sizing system

`layoutAxis` consumes `basis` / `min` / `max`, which come from the universal sizing attributes:

| Author writes | `basis` | `grow` | `min` | `max` |
|---|---|---|---|---|
| *(nothing)* | intrinsic | `0` | intrinsic | intrinsic |
| `w=320` | `320` | `0` | `320` | `320` |
| `w=hug` | intrinsic | `0` | intrinsic | `∞` |
| `w=fill` / `w=1fr` | intrinsic | `1` | intrinsic | `∞` |
| `w=2fr` | intrinsic | `2` | intrinsic | `∞` |
| `w=50%` | `0.5 · parentContent` | `0` | same | same |
| `min-w=200 w=fill` | intrinsic | `1` | `200` | `∞` |
| `max-w=600 w=fill` | intrinsic | `1` | intrinsic | `600` |

Two notes:

- **`fill` sets `min` to the intrinsic size, not `0`.** A filling column never shrinks below its
  content. Authors who want real shrinking write `min-w=0` explicitly. Defaulting to `0` would
  silently produce clipped text, which is the failure mode a wireframe tool must never have.
- **Percentages resolve against the parent's *content box*** (after padding, before gaps). Stated
  because CSS has three plausible answers and picking silently invites disagreement.

`w=` on a `row`'s child feeds `basis` when the row is horizontal, and feeds the **cross** size
when the row is vertical. The mapping is `main = row ? w : h`; there is exactly one place in
`layout.ts` that decides this.

---

## 8. File layout and dependency direction

```
src/renderer/
  axis.ts        NEW   pure math. imports: nothing.
  tracks.ts      NEW   2D track resolution. imports: axis.ts.          (see table.md §3)
  sizing.ts      NEW   SizeSpec → {basis,grow,min,max}. imports: axis.ts (types only).
  layout.ts      MOD   imports: axis.ts, tracks.ts, sizing.ts, themes.ts, ast.
  svg.ts         —     unchanged by this work.
```

The arrow never points back. `axis.ts` is unit-testable without constructing an AST, a theme, or
a document — which is the property that makes the property tests in §10 cheap enough to be
exhaustive.

---

## 9. Migration

### 9.1 `align=left|center|right` is removed

`align` moves to the cross axis. The old main-axis values are deleted rather than remapped.

**Why not a compatibility shim.** A silent remap of `align=center` (main → cross) changes rendered
output with no signal. A "legacy mode" flag means `align` carries two meanings forever and every
future reader has to know which era a file is from. One mechanical edit per affected line, with an
exact error message, is cheaper than either.

```
Line 12, col 7: "align" on "row" no longer accepts left|center|right — v0.8 moved
  "align" to the cross axis.
  · to distribute children ALONG the row:   justify=start|center|end
  · to align them ACROSS the row:           align=start|center|end|stretch
```

**Affected corpus:** `11-colonial-charter`, `20-right-aligned-row`, `36-bottom-sheet`,
`37-center-sheet` use `align=right`; the `layout.test.ts` alignment cases and the
`31-spacer-and-justify` example need updating. All are `align=right` → `justify=end`.

### 9.2 `fill` no longer beats `spacer`

v0.50 declared "a `fill` col wins over `spacer`", giving the spacer zero width. Under a single
model both are `grow` items and split slack proportionally.

This is a real behaviour change and it is the correct one: "fill beats spacer" was never a design
decision, it was the order of two `if` branches. A source containing both was almost certainly
written by an author who expected them to cooperate.

The v0.50 test `fill col beats spacer when both appear on the same row` is deleted and replaced by
`fill and spacer split slack by grow factor`. A `info`-severity diagnostic fires when a container
holds both, pointing at the changed semantics — for one release, then dropped.

### 9.3 The v0.7 auto-stretch rule

v0.7 added: *"a `row` stretches `col` children that use vertical slack to the row's content
height."* Under the new model that is `align=stretch` on those children.

Keeping fixtures byte-identical, the rule is preserved as an **implicit promotion** in the
normaliser, not in the layout engine:

> A `col` child of a `row` whose own layout consumes vertical slack (contains a `spacer`, or
> carries `justify≠start`) is promoted to `self-align=stretch` unless it declares `self-align=`
> explicitly.

Marked deprecated in the v0.8 changelog with the replacement (`align=stretch` on the row, or
`self-align=stretch` on the child) and removed in v1.0. It is one rule, in one place, with an
expiry date — as opposed to today, where it is a `colUsesVerticalSlack()` predicate wired into
`positionRow`'s second pass.

### 9.4 The v0.7 `align=right` + `spacer` parse error is deleted

It has well-defined semantics now: the spacer grows, slack is zero, `justify` is a no-op. The rule
existed only to forbid a collision that no longer exists.

---

## 10. Test plan

The refactor invalidates every golden SVG snapshot. **Semantic invariants must land before the
refactor starts**, or the snapshots are the only safety net and they cannot distinguish "layout
improved" from "layout broke".

### 10.1 `test/renderer/axis.test.ts` — unit, no AST

- Empty input; single item; all-frozen input.
- Grow: single grower takes all slack; two growers split 1:1 and 2:1.
- Shrink: basis-weighted distribution matches CSS reference values.
- Clamping: a `max`-clamped grower redistributes its excess to the others in one further pass.
- Clamping cascade: three items where freezing item A pushes item B past *its* max — asserts the
  loop iterates, not just runs once.
- Every `justify` value against a known slack, including `n === 1` for `between`.
- Fail-fast: each `RangeError` precondition, one test each.

### 10.2 Property tests (fast-check or hand-rolled generator)

For random `AxisItem[]`, `available`, `gap`:

1. `min[i] ≤ sizes[i] ≤ max[i]` — always.
2. `offsets` non-decreasing and non-overlapping — always.
3. `Σ sizes + gaps ≤ available + overflow` — always.
4. `Σ grow > 0 ∧ free > 0 ∧ no clamping ⟹ Σ sizes + gaps = available ± EPS`.
5. Permuting items permutes `sizes` identically (order-independence of the size solve).

### 10.3 `test/renderer/invariants.test.ts` — whole-document, pre-refactor

Runs over the entire `examples/` corpus in both themes, asserting structural properties instead
of bytes:

- No two siblings overlap on the main axis.
- Every child's box is contained in its parent's content box, or `overflow > 0` is reported.
- `justify=end` ⟹ last child's trailing edge equals the container's trailing edge.
- `justify=start` ⟹ first child's leading edge equals the container's leading edge.
- Canvas dimensions are finite and positive.

These pass against v0.7 **before** any code moves. They are the regression harness; snapshots are
regenerated afterwards as the second line of defence.

### 10.4 Snapshot policy

Regenerate in one commit, separate from the code change, with the diff reviewed container by
container. Any fixture whose geometry changes must be explainable by exactly one entry in §9.

---

## 11. Sequencing

`layoutAxis` is the first item of Phase A and blocks the rest:

```
axis.ts + property tests
  └─ sizing.ts  (w=/h=/min/max/gap → AxisItem)
       ├─ port row / col                       → delete the 4-level cascade
       ├─ port header / footer / slotFooter    → delete footerHorizontal()
       ├─ port navbar / tabbar / segmented     → delete 3 bespoke distributions
       ├─ port stats / resourcebar / breadcrumb / menubar
       └─ tracks.ts → grid track=auto, table   (see table.md)
```

Estimated: engine + tests ~1 day; porting the eleven callers ~1–2 days, mechanical and
individually verifiable against §10.3.

---

## 12. Open decisions

1. **`shrink` default: `0` or `1`?** CSS defaults to `1`. Wireloom containers hug their content,
   so shrinking almost never triggers — but with `w=` on a container it can. `0` means overflow is
   *reported* rather than silently absorbed, which suits a wireframe tool. **Recommendation: `0`**,
   with `shrink=1` opt-in. Revisit if dashboard authoring shows overflow diagnostics are noisy.

2. **Should `align` default to `stretch` on `row`?** CSS does. Wireloom does not today (children
   keep intrinsic height, top-aligned). `stretch` would change every existing row fixture with
   mixed-height children. **Recommendation: `start`** for v0.8, revisit for v1.0 with data.

3. **Author-facing `shrink=`?** `grow=` clearly earns its place. `shrink=` is harder to reason
   about and rarely needed at wireframe fidelity. **Recommendation: engine-internal only in v0.8**;
   promote to grammar if a real use case appears.

4. **`self-align=` naming.** CSS calls it `align-self`. Wireloom attributes are single-token
   elsewhere (`badge`, `accent`, `chevron`). `self-align` reads better in the DSL's hyphenated
   style (`label-right` sets the precedent). Low-stakes; confirm before it ships.