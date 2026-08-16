# Wireloom Grammar (v0.8.0 — Full Specification)

This document defines the formal grammar for Wireloom v0.8.0. It is the contract between the parser and the renderer. Any source file that conforms to this grammar must parse without error; any source file that doesn't must produce a parse error with a human-readable message and a line number.

v0.8.0 is a backward-compatible superset of all previous versions (v0.1 – v0.7.0) — adding 1D scalar flex sizing, shared 2D track resolution, the `table` primitive suite, `code` viewports, reusable component macros (`define` / `use`), and devtool enhancements (`chip variant=kbd`, vertical dividers, active tab content).

## Primitives

### Top-Level Declarations

| Primitive    | Position | Children? | Purpose |
|--------------|----------|-----------|---------|
| `define`     | Before `window` | Yes (template body) | Top-level reusable component macro definition (e.g. `define @Card title="Default":`). |
| `window`     | Root | Yes | Root wireframe container. Exactly one per source file. |
| `annotation` | After `window` | No (leaf) | User-manual-style callout pointing at an `id="…"` target element. Lives *outside* the window tree; see [Annotations](#annotations). |

### Structural Containers

| Primitive   | Children?     | Purpose |
|-------------|---------------|---------|
| `window`    | Yes           | Top-level container (the root of any wireframe). Exactly one per source. |
| `header`    | Yes           | Top chrome region inside a `window`. Supports `large` flag. |
| `footer`    | Yes           | Bottom chrome region inside a `window`, or optional last child of a `slot`. |
| `panel`     | Yes           | Bordered dashed content container. |
| `section`   | Yes           | Labeled container with a quiet caps-style title band. Supports optional `badge="…"`, `accent=`. |
| `tabs`      | Yes (`tab` only)| Tab-bar container. Active tab can optionally contain a nested content body. |
| `row`       | Yes           | Horizontal flow container. Supports `justify=`, `align=`, `gap=`. |
| `col`       | Yes           | Vertical flow container. Width is pixel-explicit, `fill`, or defaults to `fill`. Supports `justify=`, `align=`, `gap=`. |
| `list`      | Yes (item/slot only) | Vertical list container. |
| `slot`      | Yes           | Titled card, used inside `list` or as a standalone card. Supports `active`, `state=`, `accent=`, `chevron`, trailing `footer:`. |
| `grid`      | Yes (`cell` only) | Fixed `cols=N rows=M` grid. Supports `track=uniform\|auto`, `gap=`. |
| `table`     | Yes (`columns`/`tr`/`foot`) | 2D tabular data grid. Supports `striped`, `compact`, `bordered`. |
| `columns`   | Yes (`column` only) | Table column header definitions container. |
| `tr`        | Yes (`td` or child widgets) | Table row. Implicitly wraps non-`td` child widgets into cells. |
| `foot`      | Yes (`td` only) | Table summary footer row. |
| `code`      | Yes (optional text lines) | Monospace code block. Supports `lang="<name>"`, `lines` flag. |
| `resourcebar` | Yes (`resource` only) | Horizontal resource strip for game-UI headers. |
| `stats`     | Yes (`stat` only) | Terse inline stat strip (LABEL value). |
| `navbar`    | Yes (`leading:`/`trailing:`) | Top chrome band for mobile navigation. Mutually exclusive with `header`. |
| `tabbar`    | Yes (`tabitem` only) | Bottom navigation chrome for mobile. Mutually exclusive with `footer`. |
| `sheet`     | Yes           | Modal overlay (bottom sheet or centered modal). Supports `position=bottom\|center`, `title="…"`. |
| `segmented` | Yes (`segment` only) | Rounded-pill segmented control for mutual-exclusion filters. |
| `tree`      | Yes (`node` only) | Hierarchical collapsible file/node tree. |
| `menubar`   | Yes (`menu` only) | Horizontal application menubar. |
| `menu`      | Yes (`menuitem`/`separator`) | Menu dropdown container. |
| `breadcrumb`| Yes (`crumb` only) | Horizontal path strip with auto-inserted `›` separators. |

### Leaves (No Children)

| Primitive   | Positional args | Purpose |
|-------------|-----------------|---------|
| `tab`       | Required label string | A tab in a `tabs` bar. Supports `active` flag, `badge="…"`, and optional nested children. |
| `item`      | Required text string | A simple bulleted item in a `list`. Supports `chevron` flag. |
| `text`      | Required content string | Static text. Typography flags/attrs supported (`bold`, `italic`, `muted`, `size=`, `weight=`, `accent=`). |
| `button`    | Required label string | Clickable action. Optional `primary`, `disabled`, `badge="…"`, `accent=`, `icon="<name>"`. |
| `backbutton`| Required label string | Mobile chevron back button (e.g. `backbutton "Notes"`). Flag: `disabled`. |
| `input`     | None | Text input placeholder. Optional `placeholder=`, `type=`, `disabled`. |
| `combo`     | Optional label string | Dropdown placeholder. Optional `value=`, `options=`, `disabled`. |
| `slider`    | None | Horizontal range control. Required `range=N-M`, `value=K`. Optional `label=`. |
| `kv`        | Required label + value strings | Label/value row. Typography attrs on value. Optional `icon="<name>"`, `accent=`. |
| `image`     | None | Image placeholder. Optional `label=`, `width=`, `height=`. |
| `icon`      | None | Icon glyph from named library. Required `name=`, optional `accent=`. |
| `divider`   | None | Rule separator. Default horizontal; supports `orientation=vertical`. |
| `cell`      | Optional label string | Grid cell (inside `grid`). Supports `span=N`, `rows=N`, `row=`, `col=`, `state=`, `accent=`. |
| `column`    | Required title string | Table column header (inside `columns`). Supports `w=`, `align=left\|center\|right`. |
| `td`        | Optional content string | Table cell (inside `tr` or `foot`). Supports `span=N`, `align=left\|center\|right`, `accent=`. |
| `use`       | Required `@Name` | Instantiates a defined macro with attribute parameters. |
| `resource`  | None | Required `name=` + `value=`. Optional `icon=` override (inside `resourcebar`). |
| `stat`      | Required label + value strings | Inline LABEL value pair (inside `stats`). Supports `bold`, `muted`, `icon=`, `accent=`. |
| `progress`  | None | Horizontal bar. Required `value=`, `max=`. Optional `label=`, `accent=`. |
| `chart`     | None | Placeholder chart. `kind=bar\|line\|pie`, optional `label=`, `width=`, `height=`, `accent=`. |
| `spacer`    | None | Flex gap inside a `row` or `col`. Consumes slack so siblings anchor to opposite ends. |
| `tabitem`   | Required label string | Icon+label cell inside `tabbar`. Attributes: `icon=`, `badge=`. Flags: `selected`, `disabled`. |
| `segment`   | Required label string | Cell inside `segmented`. Flags: `selected`, `disabled`. |
| `checkbox`  | Required label string | Checkbox form control. Flags: `checked`, `disabled`, `label-right`. |
| `radio`     | Required label string | Radio button control. Flags: `selected`, `disabled`, `label-right`. Attribute: `group=`. |
| `toggle`    | Required label string | Switch toggle control. Flags: `on`, `off`, `disabled`, `label-right`. |
| `chip`      | Required label string | Standalone pill badge or keycap. Flags: `closable`, `selected`. Attributes: `accent=`, `icon=`, `variant=kbd`. |
| `avatar`    | Required initials string | User avatar circle. Attributes: `size=small\|medium\|large`, `accent=`. |
| `spinner`   | Optional label string | Loading spinner indicator. |
| `status`    | Required label string | Status badge indicator. Required attribute: `kind=success\|info\|warning\|error`. |
| `node`      | Required label string | Item in a `tree`. Flags: `collapsed`, `selected`. Attribute: `icon=`. |
| `menuitem`  | Required label string | Menu item inside `menu`. Flag: `disabled`. Attribute: `shortcut="…"`. |
| `separator` | None | Menu divider line inside `menu`. |
| `crumb`     | Required label string | Breadcrumb item inside `breadcrumb`. Attribute: `icon=`. |

Every Wireloom source file must have exactly one `window` root (optionally preceded by `define @Name:` macros). One or more `annotation` nodes may follow the `window` as siblings (see [Annotations](#annotations)).

## Structural Rules

- **`define`** may only appear at the top level, preceding the `window` root node.
- **`window`** is the root container of the wireframe. It must not be nested, and there must be exactly one per document.
- **`annotation`** may only appear at the top level, after the `window` node. Annotations are *not* children of `window`; they are siblings that reference into the window via `target="<id>"`.
- **`header`** / **`footer`** may only appear as direct children of `window`. `footer` may also appear as the optional trailing child of a `slot`.
- **`navbar`** / **`tabbar`** may only appear as direct children of `window`, mutually exclusive with `header` / `footer` respectively.
- **`sheet`** may only appear as a direct child of `window` (at most one per window).
- **`tabs`** may appear anywhere a container child is legal; its children must be only `tab` nodes. An active `tab` may optionally contain nested container/leaf children rendered as the tab body.
- **`tab`** may only appear inside a `tabs` container.
- **`table`** accepts only `columns`, `tr`, and `foot` children.
- **`columns`** accepts only `column` children.
- **`tr`** and **`foot`** accept `td` cells or auto-wrapped inline leaf widgets.
- **`grid`** accepts only `cell` children.
- **`tree`** accepts only `node` children (which can nest recursively).
- **`menubar`** accepts only `menu` children; **`menu`** accepts only `menuitem` or `separator` children.
- **`breadcrumb`** accepts only `crumb` children.
- **`segmented`** accepts only `segment` children.
- **`resourcebar`** accepts only `resource` children; **`stats`** accepts only `stat` children.
- **`list`** may appear anywhere a container child is legal; its children must be only `item` or `slot` nodes.
- **`item`** may only appear inside a `list`.
- All other containers (`panel`, `section`, `row`, `col`, `slot`, `cell`) accept the full container-child set: other containers (except `header`/`footer`/`window`/`navbar`/`tabbar`/`sheet`/`tab`/`item`) plus leaves.

## Universal Attributes

The following attributes are accepted on containers and leaf primitives, in addition to the primitive-specific attributes defined in [Node Syntax](#node-syntax):

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `id`      | string | Author-supplied identifier. Used as the `target=` of an `annotation` node. Ids are not validated for uniqueness; if duplicates exist, layout uses the first match. |
| `w`       | number / unit (`120`, `120px`, `50%`, `1fr`) | Target explicit width. |
| `h`       | number / unit (`40`, `40px`, `100%`, `1fr`) | Target explicit height. |
| `min-w` / `max-w` | number / unit (`100px`, `400px`) | Minimum / maximum width constraints. |
| `min-h` / `max-h` | number / unit (`50px`, `300px`) | Minimum / maximum height constraints. |
| `grow`    | number (`0`, `1`, `2`) | Flex grow factor along main axis when inside `row` / `col`. |
| `shrink`  | number (`0`, `1`) | Flex shrink factor along main axis when inside `row` / `col`. |
| `self-align` | identifier (`start`, `center`, `end`, `stretch`) | Cross-axis alignment override for an individual child inside `row` / `col`. |

## Annotations

`annotation` nodes are user-manual-style labels drawn in the canvas margin with a leader line pointing at an element in the `window`. They let a single Wireloom source produce a fully annotated mockup — mockup + call-outs in one artifact.

### Syntax

```
annotation "<body text>" target="<id>" position=<left|right|top|bottom>
```

- **body** (required positional string): label text. Literal `\n` in the string becomes a line break in the rendered box.
- **`target`** (required): the `id` of an element inside `window`. If no element has a matching id, the annotation is silently dropped during layout.
- **`position`** (required): which margin side the annotation box sits in. There is **no default** — authors must place annotations deliberately. Accepted values: `left`, `right`, `top`, `bottom`.

### Placement

For a given side, annotations are stacked along the window edge. Each box is nudged to align its center with the target element's center, then bumped along the axis just enough to avoid overlapping the previous box on the same side. If the resulting stack would overflow the canvas, the whole group is shifted inward.

### Example

```
window "Sign in":
  header:
    text "Welcome back" id="welcome"
  panel:
    input placeholder="Email" type=email id="email-field"
    button "Sign in" primary id="signin-btn"

annotation "Greeting — personalized after first sign-in" target="welcome" position=top
annotation "Email must be verified" target="email-field" position=right
annotation "Primary action.\nDisabled until form is valid." target="signin-btn" position=right
```

## Lexical Structure

### Line-oriented source

Wireloom source is processed line by line. Each non-blank, non-comment line is either a node declaration or a continuation of a node's children block.

### Indentation

- Indentation is **significant**.
- Each file uses **either 2 or 4 spaces** per level. The unit is detected from the first indented line and locked for the rest of the file. Mixing units within one file produces a parse error.
- **Tabs are forbidden** in leading whitespace. A tab in indentation produces a parse error.
- Blank lines and comment-only lines do not affect indentation level.
- The first node in a file must have zero indentation.
- Children of a node are indented exactly one level (one unit) deeper than their parent.

### Comments

- Line comments begin with `#` and extend to the end of the line.
- Comments may appear on their own line or at the end of a node line.
- Comment-only lines are treated as blank lines for indentation purposes.

### Blank lines

Blank lines (containing only whitespace) are ignored for all parsing purposes.

### String literals

- Enclosed in **double quotes** (`"`).
- Support the escape sequences: `\"` (literal double quote), `\\` (backslash), `\n` (newline in rendered text).
- Unterminated strings (missing closing `"` before end of line) produce a parse error.
- Single-quoted strings are **not** supported in v0.2.
- Multi-line strings are **not** supported in v0.2.

### Number literals

- Integer numbers (e.g., `340`, `16`, `0`).
- Optional unit suffixes: `px`, `%`, `fr` (e.g., `340px`, `50%`, `1fr`). Bare integers are treated as pixels.
- Negative numbers are not supported in v0.2.
- Decimal numbers are not supported in v0.2.

### Range literals (new in v0.2)

- Form: `N-M` where both are bare non-negative integers and M > N.
- Used exclusively as a value for the `range=` attribute on `slider`.
- Example: `range=0-100`.

### Identifiers

- Match the pattern `[a-zA-Z_][a-zA-Z0-9_-]*`.
- Used for primitive names, attribute keys, bare-flag attributes, and identifier-valued attributes.

## Node Syntax

Every node declaration has the form:

```
<primitive> [positional...] [attribute...] [:]
```

- `primitive` — one of the primitive identifiers in the tables above.
- `positional` — zero or more string, number, or range literals. Meaning depends on the primitive.
- `attribute` — zero or more `key=value` pairs or bare-flag identifiers. Must follow positionals.
- `:` — optional terminator. If present, the node has children indented one level deeper. Required for container primitives that must have children.

### Positional argument rules

| Primitive | Positional args |
|-----------|-----------------|
| `define`  | Required: one macro identifier `@Name`. |
| `use`     | Required: one macro identifier `@Name`. |
| `window`  | Optional: one string (the title). |
| `section` | Required: one string (the title). |
| `slot`    | Required: one string (the title). |
| `tab`     | Required: one string (the label). |
| `item`    | Required: one string (the text). |
| `text`    | Required: one string (the text content). |
| `button`  | Required: one string (the label). |
| `backbutton` | Required: one string (the label). |
| `kv`      | Required: two strings (label, value). |
| `col`     | Optional: one number (fixed pixel width) OR the bare identifier `fill`. Missing = `fill`. |
| `combo`   | Optional: one string (the label). |
| `slider`  | None (use `range=` / `value=` / `label=` attributes). |
| `image`, `icon` | None (use `label=` / `name=` attributes). |
| `column`  | Required: one string (column title). |
| `td`      | Optional: one string (cell content). |
| `cell`    | Optional: one string (cell label). |
| `stat`    | Required: two strings (label, value). |
| `tabitem` | Required: one string (the label). |
| `segment` | Required: one string (the label). |
| `checkbox`| Required: one string (the label). |
| `radio`   | Required: one string (the label). |
| `toggle`  | Required: one string (the label). |
| `chip`    | Required: one string (the label). |
| `avatar`  | Required: one string (initials, up to 2 characters). |
| `spinner` | Optional: one string (the label). |
| `status`  | Required: one string (the label). |
| `node`    | Required: one string (the label). |
| `menu`    | Required: one string (menu title). |
| `menuitem`| Required: one string (the label). |
| `crumb`   | Required: one string (the label). |
| `annotation` | Required: one string (body text). |
| `row`, `tabs`, `list`, `header`, `footer`, `panel`, `input`, `divider`, `table`, `columns`, `tr`, `foot`, `grid`, `resourcebar`, `stats`, `navbar`, `tabbar`, `sheet`, `segmented`, `tree`, `menubar`, `breadcrumb`, `spacer`, `separator`, `code` | None (or text lines as children). |

### Attribute syntax

Two forms:

- **Key=value**: `placeholder="Email"`, `width=340`, `type=password`, `range=0-100`, `badge="3 new"`, `w=120px`, `justify=between`.
- **Bare flag**: `primary`, `disabled`, `active`, `bold`, `italic`, `muted`, `striped`, `compact`, `bordered`, `lines`, `large`, `chevron`.

Values after `=` can be a string literal, a number literal, a range literal, or an identifier (unquoted single word).

### Recognized attributes

| Attribute     | Applies to                      | Value kind / flag | Notes |
|---------------|---------------------------------|-------------------|-------|
| `placeholder` | `input`                         | String            | Greyed placeholder text. |
| `type`        | `input`                         | Identifier: `text`, `password`, `email` | Cosmetic text field style. |
| `value`       | `combo`, `slider`, `resource`   | String / Number   | Current selected value or slider thumb position. |
| `options`     | `combo`                         | String (comma-separated) | Available options. |
| `range`       | `slider`                        | Range: `N-M`      | Required on `slider`. |
| `label`       | `slider`, `image`, `progress`, `chart`, `cell` | String | Optional label text. |
| `width`, `height` | `image`, `chart`            | Number (px)       | Overrides default placeholder dimensions. |
| `w`, `h`      | All containers & leaves         | Number / Unit (`px`, `%`, `fr`) | Target explicit dimension. |
| `min-w`, `max-w` | All containers & leaves      | Number (px)       | Width constraints. |
| `min-h`, `max-h` | All containers & leaves      | Number (px)       | Height constraints. |
| `grow`, `shrink` | Children of `row`/`col`       | Number (`0`, `1`, `2`) | Flex distribution factors. |
| `gap`         | `row`, `col`, `panel`, `section`, `grid` | Number (px) | Internal child gap. |
| `justify`     | `row`, `col`, `panel`, `section`, `grid` | Identifier: `start`, `center`, `end`, `between`, `around`, `evenly` | Alignment along container main axis. |
| `align`       | `row`, `col`, `panel`, `section`, `column`, `td` | Identifier: `start`, `center`, `end`, `stretch` (containers) or `left`, `center`, `right` (table) | Cross-axis container alignment or cell text alignment. |
| `self-align`  | Children of `row`/`col`         | Identifier: `start`, `center`, `end`, `stretch` | Child cross-axis override. |
| `orientation` | `divider`                       | Identifier: `horizontal`, `vertical` | Rule direction. |
| `variant`     | `chip`                          | Identifier: `kbd` | Keycap button styling. |
| `lines`       | `code`                          | Flag              | Line-number gutter. |
| `lang`        | `code`                          | String            | Language tag displayed in code viewport header. |
| `track`       | `grid`                          | Identifier: `uniform`, `auto` | Track dimension resolution mode. |
| `cols`, `rows`| `grid`                          | Number            | Required grid column and row dimensions. |
| `span`        | `cell`, `td`                    | Number            | Multi-column span. |
| `rows`        | `cell`                          | Number            | Multi-row span in grids. |
| `striped`     | `table`                         | Flag              | Zebra row striping. |
| `compact`     | `table`                         | Flag              | Tighter row padding and height. |
| `bordered`    | `table`                         | Flag              | Outer and cell border rules. |
| `name`        | `icon`, `resource`              | String            | Icon glyph name (named icon library). |
| `badge`       | `tab`, `section`, `button`, `tabitem` | String      | Small counter/status pill rendered next to label. |
| `accent`      | `slot`, `section`, `cell`, `button`, `icon`, `text`, `kv`, `stat`, `chip`, `avatar`, `td`, `progress`, `chart` | Identifier: `research`, `military`, `industry`, `wealth`, `approval`, `warning`, `danger`, `success` | Themed color applied to fills, borders, or text polarity. |
| `state`       | `slot`, `cell`                  | Identifier: `locked`, `available`, `active`, `purchased`, `maxed`, `growing`, `ripe`, `withering`, `cashed` | Themed card/cell state with optional badge icon. |
| `kind`        | `status`, `chart`               | Identifier: `success`, `info`, `warning`, `error` (status) or `bar`, `line`, `pie` (chart) | Shape or color classification. |
| `position`    | `sheet`, `annotation`           | Identifier: `bottom`, `center` (sheet) or `left`, `right`, `top`, `bottom` (annotation) | Modal anchor position or callout side. |
| `target`      | `annotation`                    | String            | Target element `id`. |
| `title`       | `sheet`                         | String            | Optional sheet header title. |
| `group`       | `radio`                         | String            | Visual radio grouping. |
| `shortcut`    | `menuitem`                      | String            | Keyboard shortcut string. |
| `weight`      | `text`, `kv` (applies to value) | Identifier: `light`, `regular`, `semibold`, `bold` | Default `regular`. |
| `size`        | `text`, `kv`, `avatar`          | Identifier: `small`, `regular`, `large` (text/kv) or `small`, `medium`, `large` (avatar) | Default `regular` / `medium`. |
| `primary`     | `button`                        | Flag              | Emphasizes the action. |
| `disabled`    | `button`, `backbutton`, `input`, `combo`, `slider`, `menuitem`, `tabitem`, `segment`, `checkbox`, `radio`, `toggle` | Flag | Renders reduced-contrast. |
| `active`      | `tab`, `slot`                   | Flag              | Marks the currently-selected tab or slot. |
| `selected`    | `tabitem`, `segment`, `chip`, `node`, `radio` | Flag | Marks active selection. |
| `checked`     | `checkbox`                      | Flag              | Marks checkbox checked. |
| `on`, `off`   | `toggle`                        | Flag              | Switch state. |
| `closable`    | `chip`                          | Flag              | Draws trailing × close glyph. |
| `collapsed`   | `node`                          | Flag              | Draws collapsed ▸ disclosure glyph. |
| `large`       | `header`                        | Flag              | Tall large-title header band. |
| `chevron`     | `slot`, `item`                  | Flag              | Trailing navigation chevron. |
| `label-right` | `checkbox`, `radio`, `toggle`   | Flag              | Places label to the right of the control. |
| `bold`        | `text`, `kv`, `stat`            | Flag              | Shorthand for `weight=bold`. |
| `italic`      | `text`, `kv`                    | Flag              | Italic text style. |
| `muted`       | `text`, `kv`, `stat`            | Flag              | Renders with the muted text color. |
| `fill`        | `col` (positional-style)        | Identifier        | Forces fill sizing. Bare `col` also defaults to fill. |

Unknown attributes (or flags used on primitives that don't accept them) produce parse errors.

## Column Width Semantics

`col` in v0.2 has three possible widths:

1. **Explicit pixel**: `col 340:` — fixed 340-pixel-wide column.
2. **Explicit fill**: `col fill:` — takes a share of any remaining horizontal space in the enclosing row.
3. **Default (bare)**: `col:` — treated as `fill` in v0.2.

**Behavior change from v0.1:** v0.1 bare `col` hugged content (intrinsic sizing). v0.2 bare `col` fills. This was deliberate — the most common case is "layout wants this column to take the rest of the row," which was awkward to express in v0.1. If the v0.1 intrinsic behavior is what you want, specify every column's width explicitly.

**Fill distribution** within a row:
- Let `available = row_width − sum(fixed col widths) − sum(inter-col gaps)`.
- `fill` columns each receive `available / count(fill cols)` pixels.
- If there are no `fill` cols and the explicit widths underflow the available width, extra space falls to the right of the last column (not distributed).

## Row Alignment

`row align=right:` positions children flush to the right edge of the row, with remaining space to the left. `align=center` centers them as a block. Default `align=left` packs them from the left.

Alignment applies to the row's inner box (after row padding).

## Typography

`text` and `kv` support four styling mechanisms:

- **Bare flags**: `bold` (≡ `weight=bold`), `italic`, `muted`.
- **Explicit `weight`**: `light` (300), `regular` (400, default), `semibold` (600), `bold` (700).
- **Explicit `size`**: `small` (~12px), `regular` (~14px, default), `large` (~18px).
- Flags and explicit attributes can be combined: `text "Heading" bold size=large`.

On `kv`, typography attributes apply to the **value** portion of the row. Labels use the theme's default body text.

## Formal EBNF

```ebnf
document       ::= (blank | comment_line | macro_define | node)*

macro_define   ::= "define" WS "@" IDENT (WS IDENT ("=" (STRING | IDENT))?)* ":" children

node           ::= indent primitive positional_args? attributes? terminator
                   children?

primitive      ::= "window" | "header" | "footer" | "panel"
                 | "section" | "tabs" | "tab"
                 | "row" | "col"
                 | "list" | "item" | "slot"
                 | "grid" | "cell"
                 | "table" | "columns" | "column" | "tr" | "foot" | "td"
                 | "code" | "resourcebar" | "resource" | "stats" | "stat"
                 | "navbar" | "tabbar" | "tabitem" | "backbutton" | "sheet"
                 | "segmented" | "segment" | "tree" | "node"
                 | "menubar" | "menu" | "menuitem" | "separator"
                 | "breadcrumb" | "crumb" | "checkbox" | "radio" | "toggle"
                 | "chip" | "avatar" | "spinner" | "status"
                 | "text" | "button" | "input"
                 | "combo" | "slider"
                 | "kv" | "image" | "icon" | "divider" | "spacer"
                 | "use"

positional_args ::= positional_arg (WS positional_arg)*
positional_arg ::= STRING
                 | NUMBER
                 | "@" IDENT              (* for macro define / use *)
                 | "fill"                 (* only valid on col *)

attributes     ::= WS attribute (WS attribute)*
attribute      ::= IDENT "=" value
                 | IDENT                  (* bare flag *)
value          ::= STRING | NUMBER | RANGE | IDENT

RANGE          ::= DIGIT+ "-" DIGIT+

terminator     ::= ":" line_end
                 | line_end

children       ::= INDENT (blank | comment_line | node)+ DEDENT

comment_line   ::= indent? "#" (any char except newline)* line_end
line_end       ::= inline_comment? NEWLINE
inline_comment ::= WS+ "#" (any char except newline)*
blank          ::= WS* NEWLINE

STRING         ::= '"' (ESCAPE | [^"\\\n])* '"'
ESCAPE         ::= "\\" ( '"' | '\\' | 'n' )
NUMBER         ::= DIGIT+ ("." DIGIT+)? UNIT?
UNIT           ::= "px" | "%" | "fr"
IDENT          ::= [a-zA-Z_@$] [a-zA-Z0-9_@$-]*
DIGIT          ::= [0-9]

WS             ::= (" ")+
NEWLINE        ::= "\r"? "\n"
indent         ::= ("  ")* | ("    ")*  (* 2 or 4 spaces per level, locked per file *)
INDENT         ::= <synthetic, emitted when leading spaces increase by 1 indentation unit>
DEDENT         ::= <synthetic, emitted when leading spaces decrease>
```

## Error Cases and Expected Messages

The parser produces human-readable errors with line and column information:

| Input problem | Expected error message |
|---------------|------------------------|
| Tab in leading whitespace | `Line {n}, col 1: tab in indentation (use 2 or 4 spaces, not tabs)` |
| First indented line uses neither 2 nor 4 spaces | `Line {n}, col 1: first indented line uses {k} spaces; Wireloom accepts 2 or 4 spaces per level (pick one and use it consistently)` |
| Indentation inconsistent with the detected unit | `Line {n}, col 1: indentation of {k} spaces is not a multiple of {u} (this file uses {u}-space indentation)` |
| Unknown primitive (with optional suggestion) | `Line {n}, col {c}: unknown primitive "{name}" (valid: …). Did you mean "{closest}"?` |
| Unknown attribute or flag with close typo | `Line {n}, col {c}: unknown attribute "{key}" on "{primitive}". Did you mean "{closest}"?` |
| Invalid enum value with close typo | `Line {n}, col {c}: "{value}" is not a valid {attr} on "{primitive}" (expected one of: …). Did you mean "{closest}"?` |
| `kv` given a single string with embedded `=` or `:` | `Line {n}, col {c}: "kv" needs two separate strings (label, value). Got only "{combined}" — if you meant to split on "{sep}", try: kv "{left}" "{right}"` |
| Missing required positional | `Line {n}, col {c}: "{primitive}" requires {expected}` |
| Unterminated string | `Line {n}, col {c}: unterminated string literal` |
| Unknown attribute on primitive | `Line {n}, col {c}: unknown attribute "{key}" on "{primitive}"` |
| Unknown bare flag on primitive | `Line {n}, col {c}: unknown flag "{flag}" on "{primitive}"` |
| Invalid enumerated value | `Line {n}, col {c}: "{value}" is not a valid {attr} (expected one of: {allowed})` |
| Invalid range format | `Line {n}, col {c}: range must be N-M with M > N, got "{got}"` |
| Undefined macro | `Line {n}, col {c}: undefined macro "{name}" (defined: …)` |
| `tab` outside `tabs` | `Line {n}, col {c}: "tab" may only appear inside "tabs"` |
| `item` outside `list` | `Line {n}, col {c}: "item" may only appear inside "list"` |
| `tr` outside `table` | `Line {n}, col {c}: "tr" may only appear inside "table"` |
| `column` outside `columns` | `Line {n}, col {c}: "column" may only appear inside "columns"` |
| `columns` outside `table` | `Line {n}, col {c}: "columns" may only appear inside "table"` |
| `foot` outside `table` | `Line {n}, col {c}: "foot" may only appear inside "table"` |
| `cell` outside `grid` | `Line {n}, col {c}: "cell" may only appear inside "grid"` |
| `menu` outside `menubar` | `Line {n}, col {c}: "menu" may only appear inside "menubar"` |
| `menuitem` outside `menu` | `Line {n}, col {c}: "menuitem" may only appear inside "menu"` |
| `node` outside `tree` | `Line {n}, col {c}: "node" may only appear inside "tree" or "node"` |
| `crumb` outside `breadcrumb` | `Line {n}, col {c}: "crumb" may only appear inside "breadcrumb"` |
| `segment` outside `segmented` | `Line {n}, col {c}: "segment" may only appear inside "segmented"` |
| `navbar` and `header` together | `Line {n}, col {c}: navbar and header cannot both appear in a window — pick one` |
| `tabbar` and `footer` together | `Line {n}, col {c}: tabbar and footer cannot both appear in a window — pick one` |
| `tabs` contains non-tab child | `Line {n}, col {c}: "tabs" accepts only "tab" children` |
| `list` contains non-item/slot child | `Line {n}, col {c}: "list" accepts only "item" or "slot" children` |
| Children under a leaf-only primitive | `Line {n}, col {c}: "{primitive}" cannot have children` |
| Multiple root nodes | `Line {n}, col {c}: only one root "window" node is allowed` |
| Root is not a window | `Line {n}, col {c}: root node must be "window"` |
| Colon on a leaf line with no children following | `Line {n}, col {c}: "{primitive}" ends with ":" but has no children` |
| Row align left/right deprecated | `Line {n}, col {c}: "align" on "row" no longer accepts left\|center\|right — v0.8 moved "align" to the cross axis.` |

## Design Rationale

- **Indentation over braces.** Wireframes nest deeply; braces at four levels look like soup. Indentation is readable and matches how people already write the DSL by hand.
- **Two or four spaces, consistent per-file.** Two spaces was the v0.2 hard rule; v0.3 relaxes it to accept 4-space indentation (common in code-heavy projects) while still enforcing consistency within a single file. YAML's full flexibility (any indent, mix at will) is still rejected — pick one of 2 or 4 and the file locks.
- **Tabs are errors.** Tabs in indentation are the classic invisible-bug generator. We fail fast and loudly.
- **No inline children syntax.** `row: a b c` saves typing but makes error messages terrible. Worth the verbosity.
- **`window` as required root.** Every wireframe depicts something, and that something has outer bounds.
- **`col fill` as the default.** The 80% case is "this column takes the remaining space." v0.2 makes that the default so simple layouts read naturally.
- **`kv` as first-class.** Data-heavy UIs (settings, ledgers, dashboards) are dominated by label/right-aligned-value rows. Giving them a dedicated primitive with correct alignment baked in is much cleaner than composing `row` + two `text`s with manual alignment.
- **Tabs / list / slot as constrained containers.** Limiting what they can contain (only `tab`, only `item`/`slot`) means the renderer can make strong layout assumptions and users get fast errors when they put the wrong thing in.
- **Typography as attributes, not primitives.** `text "Heading" bold` stays DSL-idiomatic instead of introducing a `heading` primitive with its own schema. Keeps the grammar small.
- **Known attributes only.** v0.2 still fails on unknown attributes so users get fast feedback on typos. A permissive mode may ship in v0.3 for forward compatibility with future primitives.
