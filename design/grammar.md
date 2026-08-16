# Wireloom Grammar (v0.8.0 — Full Unified Grammar Specification)

This document defines the formal grammar for Wireloom v0.8.0. It is the contract between the parser and the renderer. Any source file that conforms to this grammar must parse without error; any source file that doesn't must produce a parse error with a human-readable message and a line number.

v0.8.0 is a backward-compatible superset of all previous versions (v0.1 – v0.7.0) — adding 1D scalar flex sizing, shared 2D track resolution, the `table` primitive suite, `code` viewports, reusable component macros (`define` / `use`), and devtool enhancements (`chip variant=kbd`, vertical dividers, active tab content).

---

## Primitives

### Top-Level Declarations

| Primitive | Position | Children? | Purpose |
|-----------|----------|-----------|---------|
| `define` | Before `window` | Yes (template body) | Top-level reusable component macro definition (e.g. `define @Card title="Default":`). |
| `window` | Root | Yes (containers/leaves) | Root wireframe container. Exactly one per source file. |
| `annotation` | After `window` | No (leaf) | User-manual-style callout pointing at an `id="…"` target element. |

---

### Structural Containers

| Primitive | Children? | Positional Args | Purpose |
|-----------|-----------|-----------------|---------|
| `window` | Yes | optional title string | Root container. Exactly one per source. |
| `header` | Yes | — | Top chrome band. Supports `large` flag. |
| `footer` | Yes | — | Bottom chrome band or trailing slot actions. |
| `panel` | Yes | — | Bordered dashed content container. |
| `section` | Yes | required title string | Labeled container with small-caps title band. Supports `badge="…"`, `accent=`. |
| `tabs` | Yes (`tab` only) | — | Tab-bar container. Active tab can have nested content body. |
| `row` | Yes | — | Horizontal flow container. Supports `justify=`, `align=`, `gap=`. |
| `col` | Yes | optional width or `fill` | Vertical flow container. Defaults to `fill`. Supports `justify=`, `align=`, `gap=`. |
| `list` | Yes (`item`/`slot`) | — | Vertical list container. |
| `slot` | Yes | required title string | Titled card. Supports `active`, `state=`, `accent=`, `chevron`, optional trailing `footer:`. |
| `grid` | Yes (`cell` only) | — | Grid container. Requires `cols=N rows=M`. Supports `track=uniform\|auto`, `gap=`. |
| `table` | Yes (`columns`/`tr`/`foot`) | — | 2D tabular data grid. Supports `striped`, `compact`, `bordered`. |
| `columns` | Yes (`column` only) | — | Header column definitions container inside `table`. |
| `tr` | Yes (`td` or child widgets) | — | Table row. Implicitly wraps non-`td` child widgets. |
| `foot` | Yes (`td` only) | — | Summary footer row inside `table`. |
| `code` | Yes (optional text lines) | optional string content | Monospace code block. `lang="<name>"`, `lines` flag. |
| `resourcebar` | Yes (`resource` only) | — | Horizontal resource strip for game-UI headers. |
| `stats` | Yes (`stat` only) | — | Terse inline stat strip (LABEL value). |
| `navbar` | Yes (`leading:`/`trailing:`) | — | Top chrome band for mobile. Mutually exclusive with `header`. |
| `tabbar` | Yes (`tabitem` only) | — | Bottom navigation chrome for mobile. Mutually exclusive with `footer`. |
| `sheet` | Yes | — | Modal overlay. Direct child of `window`. Supports `position=bottom\|center`, `title="…"`. |
| `segmented` | Yes (`segment` only) | — | Rounded-pill segmented control for mutual-exclusion filters. |
| `tree` | Yes (`node` only) | — | Hierarchical collapsible file/node tree. |
| `menubar` | Yes (`menu` only) | — | Horizontal application menubar. |
| `menu` | Yes (`menuitem`/`separator`) | required label string | Menu dropdown. |
| `breadcrumb` | Yes (`crumb` only) | — | Path navigation strip with automatic `›` chevrons. |

---

### Leaves (No Children)

| Primitive | Positional Args | Key Attributes & Flags | Purpose |
|-----------|-----------------|------------------------|---------|
| `tab` | required string label | `active`, `badge="…"` | Tab in a `tabs` bar. Can optionally contain a content body. |
| `item` | required string text | `chevron` | Bulleted list item. |
| `text` | required string content | `bold`, `italic`, `muted`, `size=`, `weight=`, `accent=` | Static text with typography styling. |
| `button` | required string label | `primary`, `disabled`, `badge="…"`, `accent=`, `icon="<name>"` | Clickable action button. |
| `backbutton` | required string label | `disabled` | Mobile chevron back button (e.g. `backbutton "Notes"`). |
| `input` | — | `placeholder=`, `type=`, `disabled` | Text input field. |
| `combo` | optional string label | `value=`, `options=`, `disabled` | Dropdown control. |
| `slider` | — | required `range=N-M`, `value=K`, optional `label=` | Horizontal range slider. |
| `kv` | required label + value | `bold`, `italic`, `muted`, `icon=`, `accent=` | Key-value row with right-aligned value. |
| `image` | — | `label=`, `width=`, `height=` | Placeholder image. |
| `icon` | — | required `name="…"`, optional `accent=` | Vector glyph from icon library. |
| `divider` | — | `orientation=horizontal\|vertical` | Line separator. |
| `cell` | optional string label | `span=N`, `rows=N`, `row=N`, `col=M`, `state=`, `accent=` | Cell in a `grid`. |
| `column` | required string title | `w=`, `align=left\|center\|right` | Column definition in a `table`. |
| `td` | optional string content | `span=N`, `align=left\|center\|right`, `accent=` | Data cell in a `table`. |
| `use` | required `@Name` | attribute parameters (e.g. `title="..."`) | Instantiates a defined macro. |
| `resource` | — | required `name=`, `value=`, optional `icon=` | Resource entry in `resourcebar`. |
| `stat` | required label + value | `bold`, `muted`, `icon=`, `accent=` | Stat item in `stats`. |
| `progress` | — | required `value=`, `max=`, optional `label=`, `accent=` | Horizontal progress bar. |
| `chart` | — | `kind=bar\|line\|pie`, `label=`, `width=`, `height=`, `accent=` | Placeholder chart shape. |
| `spacer` | — | — | Flex gap consuming remaining slack in `row` or `col`. |
| `tabitem` | required string label | `icon=`, `badge=`, `selected`, `disabled` | Bottom bar tab item. |
| `segment` | required string label | `selected`, `disabled` | Pill item in `segmented`. |
| `checkbox` | required string label | `checked`, `disabled`, `label-right` | Checkbox form control. |
| `radio` | required string label | `selected`, `disabled`, `group=`, `label-right` | Radio button control. |
| `toggle` | required string label | `on`, `off`, `disabled`, `label-right` | Switch toggle control. |
| `chip` | required string label | `closable`, `selected`, `accent=`, `icon=`, `variant=kbd` | Standalone tag/pill or keycap. |
| `avatar` | required initials | `size=small\|medium\|large`, `accent=` | User avatar badge. |
| `spinner` | optional string label | — | Loading spinner indicator. |
| `status` | required string label | required `kind=success\|info\|warning\|error` | Status badge indicator. |
| `node` | required string label | `collapsed`, `selected`, `icon=` | Item in a `tree`. |
| `menuitem` | required string label | `disabled`, `shortcut="…"` | Menu entry. |
| `separator` | — | — | Menu divider line. |
| `crumb` | required string label | `icon=` | Breadcrumb segment. |

---

## Universal Sizing & Flex Attributes

Accepted across containers and leaves:

| Attribute | Values / Syntax | Purpose |
|-----------|-----------------|---------|
| `w=…` | `120`, `120px`, `50%`, `1fr` | Target explicit width |
| `h=…` | `40`, `40px`, `100%`, `1fr` | Target explicit height |
| `min-w=…` / `max-w=…` | `100px`, `400px` | Min/Max width constraints |
| `min-h=…` / `max-h=…` | `50px`, `300px` | Min/Max height constraints |
| `grow=…` | `0`, `1`, `2` | Flex grow factor along main axis |
| `shrink=…` | `0`, `1` | Flex shrink factor along main axis |
| `gap=…` | `8`, `12`, `16` | Spacing between children |
| `justify=…` | `start`, `center`, `end`, `between`, `around`, `evenly` | Alignment along container main axis |
| `align=…` | `start`, `center`, `end`, `stretch` | Alignment across cross axis |
| `self-align=…` | `start`, `center`, `end`, `stretch` | Child cross-axis alignment override |
| `id=…` | string | Identifier for annotation callout targets |

---

## Formal EBNF (v0.8.0)

```ebnf
document         ::= (blank | comment_line | macro_define)* window_root annotation*

macro_define     ::= "define" WS "@" IDENT (WS IDENT ("=" STRING)?)* ":" children

window_root      ::= "window" (WS STRING)? attributes? ":" children

node             ::= indent primitive positional_args? attributes? terminator
                     children?

primitive        ::= "window" | "header" | "footer" | "panel" | "section"
                   | "tabs" | "tab" | "row" | "col" | "list" | "item" | "slot"
                   | "grid" | "cell" | "table" | "columns" | "column" | "tr" | "foot" | "td"
                   | "code" | "resourcebar" | "resource" | "stats" | "stat"
                   | "navbar" | "tabbar" | "tabitem" | "backbutton" | "sheet"
                   | "segmented" | "segment" | "tree" | "node"
                   | "menubar" | "menu" | "menuitem" | "separator"
                   | "breadcrumb" | "crumb" | "checkbox" | "radio" | "toggle"
                   | "chip" | "avatar" | "spinner" | "status"
                   | "text" | "button" | "input" | "combo" | "slider"
                   | "kv" | "image" | "icon" | "divider" | "spacer"
                   | "use"

positional_args  ::= positional_arg (WS positional_arg)*
positional_arg   ::= STRING
                   | NUMBER
                   | "@" IDENT              (* for macro use / define *)
                   | "fill"                 (* for col *)

attributes       ::= WS attribute (WS attribute)*
attribute        ::= IDENT "=" value
                   | IDENT                  (* bare flag *)

value            ::= STRING | NUMBER | RANGE | IDENT

RANGE            ::= DIGIT+ "-" DIGIT+
NUMBER           ::= DIGIT+ ("." DIGIT+)? UNIT?
UNIT             ::= "px" | "%" | "fr"
STRING           ::= '"' (ESCAPE | [^"\\\n])* '"'
ESCAPE           ::= "\\" ( '"' | '\\' | 'n' )
IDENT            ::= [a-zA-Z_@$] [a-zA-Z0-9_@$-]*
DIGIT            ::= [0-9]

terminator       ::= ":" line_end
                   | line_end

children         ::= INDENT (blank | comment_line | node)+ DEDENT

comment_line     ::= indent? "#" (any char except newline)* line_end
line_end         ::= inline_comment? NEWLINE
inline_comment   ::= WS+ "#" (any char except newline)*
blank            ::= WS* NEWLINE

WS               ::= (" ")+
NEWLINE          ::= "\r"? "\n"
indent           ::= ("  ")* | ("    ")*  (* 2 or 4 spaces consistently locked *)
INDENT           ::= <synthetic token on indentation increase>
DEDENT           ::= <synthetic token on indentation decrease>
```

---

## Error Handling Standards

| Error Condition | Message Pattern |
|-----------------|-----------------|
| Tab in indentation | `Line {n}, col 1: tab in indentation (use 2 or 4 spaces, not tabs)` |
| Inconsistent indentation unit | `Line {n}, col 1: indentation of {k} spaces is not a multiple of {u}` |
| Unknown primitive | `Line {n}, col {c}: unknown primitive "{name}" (valid: …). Did you mean "{closest}"?` |
| Unknown attribute | `Line {n}, col {c}: unknown attribute "{key}" on "{primitive}". Did you mean "{closest}"?` |
| Invalid enum value | `Line {n}, col {c}: "{value}" is not a valid {attr} on "{primitive}" (expected one of: …)` |
| Missing required argument | `Line {n}, col {c}: "{primitive}" requires {expected}` |
| Undefined macro | `Line {n}, col {c}: undefined macro "{name}" (defined: …)` |
| Misplaced container child | `Line {n}, col {c}: "{child}" may only appear inside "{parent}"` |
| Direct window conflicts | `Line {n}, col {c}: navbar and header cannot both appear in a window — pick one` |
| Sheet position error | `Line {n}, col {c}: "{val}" is not a valid position on "sheet" (expected one of: bottom, center)` |
