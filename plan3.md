# Design: `table` — Column-Aligned Data Rows

> **Status:** proposal for v0.8
> **Scope:** new primitives `table` / `column` / `tr` / `td`; new shared module `src/renderer/tracks.ts`
> **Depends on:** [`layoutAxis`](./layout-axis.md), universal sizing (`w=`/`min-w=`/`max-w=`)
> **Breaking:** no

---

## 1. Why this cannot be composed

Everything else on the dashboard wishlist — sidebars, toolbars, cards, KPI strips, empty states —
composes from `row` / `col` / `panel` / `slot`. `table` cannot, and the reason is precise:

**Wireloom containers measure independently.** A stack of `row`s produces N independent measure
passes; nothing forces column *k* of row *i* to share an x-offset with column *k* of row *j*.
Cross-row alignment is not expressible in a tree of independently-measured containers. It requires
a two-pass measure over a 2D structure — which is exactly what no existing primitive does.

The current workarounds and what they cost:

| Workaround | Limit |
|---|---|
| `kv` | exactly two columns; value is always right-aligned; no header |
| `stats` | inline strip; no wrapping to rows; no per-column widths |
| `row` per record | columns visibly drift; unusable past ~3 records |
| `grid cols=N` | `preferredCellSize()` takes the max over **all** cells → every column as wide as the widest cell anywhere in the grid |

For a devtool dashboard — builds, runs, requests, deployments, log tables, dependency lists — this
is the single highest-frequency layout. It is the #1 gap.

### Non-goals

- **Sorting, filtering, pagination behaviour.** Wireloom is static SVG. `sort=asc` draws a chevron;
  it does not reorder rows.
- **Row spanning (`rowspan`).** Column spanning is in. Row spanning multiplies the track algorithm's
  complexity for a construct that appears in wireframes roughly never. Extension point noted in §3.4.
- **Virtual scrolling.** `h=` + `scroll` clips; there is no viewport model.
- **Nested tables.** Legal by accident (a `td` holds container children) but untested and undocumented.
  If it turns out to matter, it gets its own test file.

---

## 2. Grammar

### 2.1 Terse form — the common case

```wireloom
window "CI":
  table zebra:
    columns:
      column "Status"   w=96
      column "Build"    w=fill
      column "Branch"   w=140
      column "Duration" w=96  align=end
    tr:
      status "passed" kind=success
      text "#4821 · Add retry backoff"
      chip "main"
      text "2m 14s"
    tr:
      status "failed" kind=error
      text "#4820 · Bump deps"
      chip "renovate/deps"
      text "0m 48s"
```

Four lines of schema, four lines per record. Density matters here more than anywhere else in the
language: a table is the most repeated construct an author writes, and every extra token is paid
per row.

### 2.2 Explicit form — when a cell needs more

```wireloom
table:
  columns:
    column "" w=32                      # leading affordance column
    column "Endpoint" w=fill sort=asc
    column w=200:                       # rich header: children override the label
      row align=center:
        text "p95" bold
        icon name="warning" accent=warning
    column "Errors" w=96 align=end
  tr selected:
    td: icon name="check" accent=success
    td:
      text "POST /v1/messages" bold
      text "streaming · 4 regions" muted size=small
    td: text "148 ms"
    td: text "0.31%" accent=warning
  tr:
    td span=4 align=center:
      text "12 more endpoints" muted
  foot:
    tr:
      td: text ""
      td: text "Total" bold
      td: text "132 ms" bold
      td: text "0.44%" bold accent=danger
```

### 2.3 Headless form

`columns:` is optional. Without it the table has no header band and every column is `auto`;
the column count comes from the first `tr`.

```wireloom
table:
  tr:
    text "Node"
    text "22.11.0"
  tr:
    text "pnpm"
    text "9.4.0"
```

This is deliberate optional syntax, not a fallback for missing configuration: the author is
choosing a headless table, and the rendered result reflects exactly what was written.

### 2.4 Attribute reference

| Primitive | Positionals | Attributes | Flags |
|---|---|---|---|
| `table` | — | `layout=auto\|fixed`, `gap=`, `w=`, `h=`, `min-w=`, `max-w=` | `zebra`, `dense`, `bordered`, `sticky-head`, `scroll` |
| `column` | required label string (may be `""`) | `w=`, `min-w=`, `max-w=`, `align=start\|center\|end`, `sort=asc\|desc\|none` | — |
| `tr` | — | `accent=`, `id=` | `selected`, `disabled`, `muted` |
| `td` | — | `span=N`, `align=`, `id=` | — |
| `foot` | — | — | — |

- **`layout=auto`** (default) sizes `w`-less columns to their content.
  **`layout=fixed`** sizes them equally from the table width, ignoring content — the escape hatch
  for a table whose content varies wildly between mock states and whose geometry must stay put.
- **`align` on `column`** sets the default for every cell in that column; **`align` on `td`**
  overrides it for one cell. Column-level is where you want it 95 % of the time.
- **`sort=`** draws a chevron next to the header label. Static affordance only.
- **`sticky-head`** requires `h=` — see §6.3.
- `state=` is deliberately **not** accepted on `tr`. The existing nine-value `state` enum
  (`ripe`, `withering`, `cashed`, …) is game-UI vocabulary; reusing it here would be a false
  affordance. `accent=` covers row tinting with the palette that already means "semantic colour".

### 2.5 Naming: why `tr` / `td`

`row` is taken and means "horizontal flex container". Overloading it inside `table` would give a
keyword two meanings depending on ancestry — precisely the trap `AGENTS.md` already warns about
for `menuitem` vs `item` (⚠️ *"`menuitem` is its own token — don't write `item` inside a `menu`"*).
That warning exists because the collision was expensive once; repeating it deliberately would be
worse.

`cell` is taken by `grid`. Candidates considered:

| Option | Verdict |
|---|---|
| `row` / `cell` | ✗ two collisions, context-dependent meaning |
| `trow` / `tcell` | ✗ invented, ugly, still long |
| `record` / `field` | ✗ implies data semantics the DSL does not have |
| **`tr` / `td`** | ✓ zero collisions, universally understood, shortest — and shortness compounds over hundreds of rows |

### 2.6 Structural rules (parser-enforced)

1. `column` only inside `columns:`; `columns:` only inside `table:`, at most once, first child.
2. `tr` only inside `table:` or `foot:`; `td` only inside `tr:`.
3. `foot:` only inside `table:`, at most once, **last** child. (Mirrors the `slot` → `footer:` rule.)
4. A `tr` child that is not a `td` is wrapped into an implicit single-content `td` — see §5.1.
5. **Arity:** `Σ span` over a row's cells must equal the column count.
   Mismatch is an **error**, not silent padding:

```
Line 34, col 5: "tr" has 3 cells (total span 3) but the table declares 4 columns.
  Add a cell, or widen one with span=2.
```

Silently padding would produce a wireframe that looks fine and is wrong — the failure mode a
visual tool must not have. A hard error costs one edit and is unambiguous.

---

## 3. Shared module: track sizing

Column widths and row heights are the same problem on two axes. `grid track=auto` is the same
problem again. One module, three consumers.

### 3.1 API

```ts
// src/renderer/tracks.ts — imports axis.ts only.

export type TrackKind = 'fixed' | 'auto' | 'fraction';

export interface TrackSpec {
  readonly kind: TrackKind;
  /** px for 'fixed', fr-units for 'fraction', unused for 'auto'. */
  readonly value: number;
  readonly min: number;
  readonly max: number;                 // Infinity permitted
}

export interface TrackCell {
  /** Zero-based index of the first track this cell occupies. */
  readonly track: number;
  /** Number of tracks spanned. >= 1. */
  readonly span: number;
  /** Intrinsic extent of the cell's content along this axis. >= 0. */
  readonly size: number;
}

export interface TrackLayoutInput {
  readonly tracks: readonly TrackSpec[];
  readonly cells: readonly TrackCell[];
  readonly available: number;
  readonly gap: number;
}

export interface TrackLayoutResult {
  readonly sizes: readonly number[];
  readonly offsets: readonly number[];
  readonly content: number;
  readonly overflow: number;
  /** Cells whose span could not be satisfied; caller raises diagnostics. */
  readonly unsatisfied: readonly TrackCell[];
}

export function resolveTracks(input: TrackLayoutInput): TrackLayoutResult;
```

### 3.2 Algorithm

The genuinely new logic is only steps 1–2. Step 3 delegates to `layoutAxis`, so `fr` distribution,
min/max clamping and offset placement are **not reimplemented**.

```
Step 1 — content bases from single-span cells
  base[k] = tracks[k].kind === 'fixed' ? tracks[k].value : 0
  for each cell with span === 1:
    if tracks[cell.track].kind !== 'fixed':
      base[cell.track] = max(base[cell.track], cell.size)

Step 2 — distribute multi-span deficits
  // Ascending span order: a 2-span cell must settle before a 3-span cell
  // measures the extent it spans, or the 3-span cell over-reports its deficit.
  for each cell with span > 1, in ascending order of span:
    spanned   = tracks[cell.track .. cell.track+span-1]
    extent    = Σ base[k] over spanned + gap * (span - 1)
    deficit   = cell.size - extent
    if deficit <= EPS: continue

    growable = spanned tracks with kind === 'auto'
    if growable is empty:
      growable = spanned tracks with base[k] < max[k]      // any track with headroom
    if growable is empty:
      unsatisfied += cell                                   // record, do not clip silently
      continue

    // Equal share. CSS distributes equally among affected tracks; weighting by
    // current base would make wide columns wider still, which reads worse in
    // a wireframe than an even split.
    share = deficit / growable.length
    for k in growable: base[k] = min(base[k] + share, max[k])

Step 3 — delegate to layoutAxis
  items[k] = {
    basis:  base[k],
    grow:   tracks[k].kind === 'fraction' ? tracks[k].value : 0,
    shrink: 0,
    min:    max(tracks[k].min, base[k]),      // never below resolved content
    max:    tracks[k].max,
  }
  return layoutAxis({ items, available, gap, justify: 'start' })
```

`min: max(track.min, base[k])` is the load-bearing line: **a `fill` column never shrinks below
its content.** Setting `min` to `0` here is the single easiest way to produce a wireframe with
clipped text that nobody notices until review.

### 3.3 Complexity

- Step 1: `O(cells)`
- Step 2: `O(cells · maxSpan)` plus one sort, `O(cells log cells)`
- Step 3: `O(tracks²)` worst case, inherited from `layoutAxis`

Called twice per table (columns, then rows). For a 12-column, 200-row table that is ~2 400 cells —
microseconds. The existing perf test budget (Colonial Charter < 50 ms warm) is untouched.

### 3.4 Extension point: row spanning

`TrackCell` already carries `track` + `span` on a single axis. Row spanning needs cells to
participate in *both* axis resolutions with independent spans, which means a second `TrackCell`
per cell and an interleaved solve (a row-spanning cell's height contribution depends on the
already-resolved column widths, which may have wrapped its text). The API shape does not block
it; the algorithm would need one more pass. **Explicitly out of scope for v0.8.**

---

## 4. AST

```ts
export interface TableNode extends NodeBase {
  kind: 'table';
  /** Empty for a headless table. */
  readonly columns: readonly ColumnNode[];
  readonly rows: readonly TableRowNode[];
  readonly foot?: TableFootNode;
}

export interface ColumnNode extends NodeBase {
  kind: 'column';
  readonly label: string;
  /** Non-empty replaces the default label rendering (rich header). */
  readonly children: readonly ContainerChild[];
}

export interface TableRowNode extends NodeBase {
  kind: 'tr';
  readonly cells: readonly TableCellNode[];
}

export interface TableCellNode extends NodeBase {
  kind: 'td';
  /** Normalised at build time. Always >= 1 — never optional. */
  readonly span: number;
  readonly children: readonly ContainerChild[];
}

export interface TableFootNode extends NodeBase {
  kind: 'foot';
  readonly rows: readonly TableRowNode[];
}
```

**`span` is total, not optional.** Every downstream consumer sees a number and never re-derives a
default. The alternative — `span?: number` with `?? 1` scattered across layout, emit and
serializer — is three places to get it wrong and the pattern this codebase already suffers from
(`getAttrNumber(…) ?? theme.someDefault` appears in eight `measure*` functions).

`table` uses named fields (`columns` / `rows` / `foot`) rather than a heterogeneous `children`
array, following the `SlotNode.slotFooter` and `NavbarNode.leading/center/trailing` precedent.
The serializer's `nodeChildren()` gets one more case; every other consumer gets a typed field
instead of a runtime `.filter(c => c.kind === 'tr')`.

### 4.1 Where implicit cells are wrapped

**In `build()`, not the normaliser.** The line:

> `build()` may shape a node's own children. The normaliser may move nodes across the tree.

Wrapping a bare `text` into a `td` shapes one node's own children — it is structural parsing.
Rewriting a panel-level `footer:` into a window-level `footer` moves a node across the tree — that
is desugaring. Keeping the line sharp matters here because it makes roundtrip idempotency fall out
for free: the raw AST is already canonical, so `parse(serialize(parse(src)))` compares equal
without the normaliser running.

---

## 5. Layout

```
measureTable(node, ctx):
  1. cells[i][j].content = measureStack(td.children, vertical)      // intrinsic, unconstrained
  2. colSpecs = columns.map(toTrackSpec)  |  all-auto when headless
  3. cols = resolveTracks({ tracks: colSpecs, cells: byColumn, available: w, gap })
  4. for each td: if content.width > colWidth → truncate (§5.2)
  5. rowSpecs = rows.map(() => AUTO)
     rowCells = rows.map(r => ({ track: i, span: 1, size: max(cellHeights) }))
     rows = resolveTracks({ tracks: rowSpecs, cells: rowCells, available: h, gap: 0 })
  6. size = { width: cols.content, height: headHeight + rows.content + footHeight }

positionTable(node, box, ctx):
  x[j] = box.x + cols.offsets[j]
  y[i] = box.y + headHeight + rows.offsets[i]
  for each td: position its children as a col, cross-aligned by column.align
```

Step 4 depends on step 3 — content must be measured before column widths are known, then
reconciled. This is the standard table two-pass and the reason a table cannot be a plain container.

### 5.1 Implicit cell wrapping

```
tr:
  status "passed" kind=success       →  td: status "passed" kind=success
  text "#4821"                       →  td: text "#4821"
  td:                                →  (already explicit, untouched)
    text "a"
    text "b"
```

One rule, both ergonomics: terse when you need one thing per cell, explicit when you need more.

### 5.2 Overflow inside a cell

A `td` whose content exceeds its column width is **ellipsised**, not clipped and not overflowing.
This is intended table behaviour, not an error, so it produces no diagnostic.

```
budget    = colWidth - 2·cellPaddingX
maxChars  = floor((budget - ellipsisWidth) / charWidth)
rendered  = maxChars >= 1 ? content.slice(0, maxChars) + '…' : ''
```

`charWidth` comes from `MeasureCtx`, so this sharpens automatically once the injectable text
measurer lands — the heuristic (`averageCharWidth = 7.2`) is documented as approximate here
because a table is where its error is most visible.

Only leaf `text` / `kv` / `chip` / `status` content ellipsises. A `td` containing a `row` or `col`
falls back to the container's own overflow behaviour (report, per `layoutAxis`).

### 5.3 `h=` on the table

Without `h=`, the table hugs its rows. With `h=`, rows are laid into the given extent; if content
exceeds it:

- `scroll` present → clip at the boundary, draw a scrollbar affordance
- `scroll` absent → emit `table-overflow` diagnostic and render at natural height

Rendering at natural height rather than clipping is the honest choice: the author asked for a
height the content does not fit, and showing everything with a warning is more useful in a
*mockup* than showing a lie that looks correct.

---

## 6. Rendering

### 6.1 Paint order

```
1. table background + outer border          (bordered)
2. zebra row fills                          (zebra, odd body rows)
3. selected-row fill + left accent bar      (tr selected)
4. horizontal grid lines                    (bordered)
5. vertical grid lines                      (bordered)
6. header band fill + bottom border
7. header labels + sort chevrons
8. cell content
9. foot separator + foot content
```

Backgrounds before lines before content — the invariant that keeps a selected row's tint from
covering its own text. Stated because the current emitters carry this implicitly and the
`emitSegmented` divider-suppression logic exists precisely because paint order was not planned.

### 6.2 Visual language

Consistent with the existing wireframe aesthetic: 1 px lines, no shadows, no gradients.

- Header: `table.headBg` fill, 1 px `table.headBorderColor` bottom rule, small-caps-ish label at
  `sectionTitleFontSize` weight 700 — matching `section`'s title treatment so the two read as
  the same family.
- `zebra`: alternating `table.zebraFill` on odd body rows.
- `selected`: `table.selectedFill` plus a 2 px `table.selectedBorder` bar on the leading edge.
  A bar rather than a full border because a bordered row in a bordered table produces a double line.
- `disabled`: `opacity="0.55"`, matching every other disabled primitive.
- `dense`: `table.rowHeightDense` and reduced `cellPaddingY`.

### 6.3 `sticky-head`

Draws the header band with an opaque fill and a stronger bottom rule, suggesting it stays put
while the body scrolls. It only means anything with `h=` + `scroll`.

```
Line 8, col 3: "sticky-head" on "table" has no effect without "h=" and "scroll"
  — a header can only stick over a scrolling body. Add h=<px> scroll, or drop the flag.
```

An error rather than a silent no-op: a flag that does nothing is a flag the author believes is
working. This is the "missing configuration" case the fail-fast principle exists for.

### 6.4 Output hooks

Every `tr` emits `<g data-wl-kind="tr" data-wl-id="…">` when it carries `id=`; every `td` emits
`data-wl-col="<index>"`. Costs two attributes, makes hover/click/test targeting possible in a host
without touching the language. (Depends on the `data-wl-*` work in Phase A.)

---

## 7. Theme tokens

Namespaced under `table.*` per the theme-restructuring proposal; flat `tableRowHeight`-style names
if that lands later.

| Token | Default (light) | Default (dark) |
|---|---|---|
| `rowHeight` | `32` | `32` |
| `rowHeightDense` | `24` | `24` |
| `cellPaddingX` | `12` | `12` |
| `cellPaddingY` | `6` | `6` |
| `headHeight` | `30` | `30` |
| `headBg` | `#f5f6f8` | `#2a2a2a` |
| `headText` | `#3a3e44` | `#b8bcc4` |
| `headBorderColor` | `#c4c4c4` | `#555555` |
| `gridLineColor` | `#e2e5ea` | `#333333` |
| `gridLineWidth` | `1` | `1` |
| `zebraFill` | `#fafbfc` | `#232323` |
| `selectedFill` | `#e7edf5` | `#2f3a4c` |
| `selectedBorder` | `#3f7cc2` | `#6ba4e8` |
| `footSeparatorColor` | `#c4c4c4` | `#555555` |
| `sortGlyphColor` | `#8a9099` | `#8a9099` |

Contrast checked at WCAG AA for `headText` on `headBg` and body text on `zebraFill` /
`selectedFill` in both themes, matching the bar set in the v0.2 changelog.

---

## 8. Serializer

```
table zebra:
  columns:
    column "Status" w=96
    column "Build" w=fill
  tr:
    td:
      status "passed" kind=success
    td:
      text "#4821"
```

Implicit cells always re-serialize as explicit `td:` blocks. Source text is not preserved
byte-for-byte — the existing roundtrip contract is AST equality, not source equality, and
comments and blank lines are already lost. Since wrapping happens in `build()` (§4.1), the two
forms produce identical ASTs and `serialize(parse(terse)) === serialize(parse(explicit))` holds,
which is the stronger and more useful property.

---

## 9. Test plan

### 9.1 `test/renderer/tracks.test.ts` — unit, no AST

- Single-span content max per track.
- Multi-span deficit split equally across `auto` tracks.
- Multi-span over `fixed`-only tracks → `unsatisfied`, no silent growth.
- Ascending-span processing order: a 2-span and a 3-span cell overlapping the same tracks resolve
  to the documented result and **not** to the reverse-order result.
- `fr` distribution with mixed `fixed`/`auto`/`fr`, including 2fr:1fr.
- `min` floor: a `fill` column never shrinks below its content.
- `available` smaller than the sum of fixed widths → `overflow > 0`, sizes unchanged.

### 9.2 `test/parser/v080-table.test.ts`

- Terse form, explicit form, mixed form, headless form.
- Arity error: too few cells, too many cells, `span` arithmetic.
- `column` outside `columns:`, `td` outside `tr`, `tr` outside `table`, `foot` not last.
- Two `columns:` blocks; two `foot:` blocks.
- `span=0`, `span=-1` → error naming the valid range.
- Roundtrip idempotency for all four forms.

### 9.3 `test/renderer/v080-table-layout.test.ts`

- **Column alignment invariant:** every `td` in column *k* has an identical x offset across all
  rows. This is the property the primitive exists for; it is asserted directly rather than left to
  a snapshot.
- `align=end` on a column right-aligns every cell in it, and a `td align=start` overrides it.
- `w=fill` column absorbs slack; two `fill` columns split 1:1; `w=2fr`/`w=1fr` split 2:1.
- Row height = tallest cell in that row.
- `span=4` cell spans the full width of a 4-column table exactly (offsets + gaps checked).
- Ellipsis triggers at the documented boundary and not one character earlier.
- `zebra` fills odd rows only; `selected` fill sits above zebra and below text.
- `dense` reduces total height by exactly `rows · (rowHeight - rowHeightDense)`.
- Dark-theme parity: every token in §7 appears in the dark output.

### 9.4 Corpus

Three new examples, all roundtrip-tested and golden-snapshotted:

- `41-build-table.wireloom` — terse form, zebra, status column, fill column
- `42-metrics-table.wireloom` — rich headers, `sort=`, `foot:` totals, `align=end`, `accent=`
- `43-table-spans.wireloom` — `span=`, headless table, `dense`, empty-state row

---

## 10. Worked example: the target dashboard

The construct this is all for — an app shell with a fixed sidebar, a KPI strip, a chart row and a
build table. Everything here is v0.8: `layoutAxis` (grow / justify / align), universal sizing
(`w=` / `h=` / `gap=`), `grid track=auto` + `span=`, and `table`.

```wireloom
window "Deploybase":
  navbar:
    leading:
      text "deploybase" bold
    center:
      segmented:
        segment "Overview" selected
        segment "Builds"
        segment "Logs"
    trailing:
      chip "prod" accent=danger
      avatar "BW" size=small

  row gap=0 h=fill:
    col w=220:
      panel h=fill:
        list:
          item "Overview" chevron
          item "Builds" chevron
          item "Environments"
          item "Settings" chevron
        spacer
        status "All systems go" kind=success

    divider orientation=vertical

    col w=fill:
      panel gap=16:
        grid cols=12 gap=16 track=auto:
          cell span=3:
            slot "Requests":
              row align=center:
                text "1.2M" bold size=large
                spacer
                text "+12%" accent=success
              chart kind=sparkline accent=research
          cell span=3:
            slot "p95":
              row align=center:
                text "148ms" bold size=large
                spacer
                text "-4%" accent=success
              chart kind=sparkline accent=research
          cell span=3:
            slot "Error rate":
              row align=center:
                text "0.31%" bold size=large
                spacer
                text "+0.1%" accent=warning
              chart kind=sparkline accent=warning
          cell span=3:
            slot "Spend":
              row align=center:
                text "$412" bold size=large
                spacer
                text "+8%" accent=danger
              chart kind=sparkline accent=danger

          cell span=8:
            chart kind=area label="Requests / second" accent=research h=220
          cell span=4:
            chart kind=donut label="By region" accent=industry h=220

        section "Recent builds" badge="6":
          table zebra h=280 scroll sticky-head:
            columns:
              column ""         w=28
              column "Build"    w=fill
              column "Branch"   w=160
              column "Duration" w=96 align=end
              column "When"     w=96 align=end
            tr selected:
              td: icon name="check" accent=success
              td: text "#4821 · Add retry backoff"
              td: chip "main"
              td: text "2m 14s"
              td: text "4m ago"
            tr:
              td: icon name="warning" accent=danger
              td: text "#4820 · Bump dependencies"
              td: chip "renovate/deps"
              td: text "0m 48s"
              td: text "31m ago"
            tr muted:
              td span=5 align=center:
                text "Showing 2 of 148" muted size=small
```

Two things worth reading off this:

- Nothing here reaches for a `sidebar`, `toolbar`, `card`, `metric` or `kpi` primitive. The shell
  is `row` + `col` + `w=fill`; the cards are `slot` + `grid span=`. That is the composition budget
  working as intended, and it is why the primitive count stays flat while the expressive range
  grows.
- The four KPI cards are near-identical, ~7 lines each. That repetition is the exact motivation for
  `define` / `use` in Phase C — one `define metric(label, value, delta, tone)` collapses 28 lines
  to 4 without touching the grammar again.

---

## 11. Sequencing

```
layoutAxis            (blocking — layout-axis.md)
  └─ sizing.ts        (blocking — w= / min-w= / max-w=)
       └─ tracks.ts   + unit tests                          ~0.5 day
            ├─ grid track=auto + span=                      ~0.5 day
            └─ table  parser → AST → layout → emit → theme  ~2 days
                 └─ examples 41–43 + goldens                ~0.5 day
```

`grid track=auto` lands **before** `table` deliberately: it exercises `tracks.ts` against an
existing primitive with existing fixtures, so any track-sizing bug surfaces against known-good
output before the larger `table` work builds on top of it.

---

## 12. Open decisions

1. **Is `layout=fixed` worth shipping in v0.8?** It exists in HTML for performance, which is
   irrelevant here; the design rationale is geometric stability across mock variants. Cheap to add
   (one `TrackSpec` mapping), but it is one more concept to document. **Recommendation: ship it** —
   dashboards get regenerated with different mock data constantly, and drifting column widths
   between renders undermines the diff-in-git story that motivates a text-first tool.

2. **Should `column` accept `w=Nfr` in addition to `w=fill`?** They are the same mechanism
   (`fill` ≡ `1fr`). Two spellings for one concept is a documentation cost; but `2fr`/`1fr` is the
   only way to express a ratio. **Recommendation: accept both**, document `fill` as the shorthand
   for `1fr`, and use only `fill` in every example so the common case stays obvious.

3. **Per-cell vertical alignment.** `td` currently lays children out as a top-aligned `col`.
   A `valign=top|center|bottom` would matter for tables mixing one-line and two-line cells.
   **Recommendation: defer** — `self-align=` from the cross-axis work may already cover it once
   `td` is a proper container. Confirm during implementation rather than pre-deciding.

4. **`bordered` granularity.** One flag currently means "outer border + all grid lines". Real
   tables often want horizontal rules only. Options: `bordered=all|rows|cols|none`, or a separate
   `rules=` attribute. **Recommendation: `bordered=all|rows|none`**, default `rows` when the flag
   is present — full grids read as noisy at wireframe fidelity.