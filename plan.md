Ich habe den Export durchgearbeitet — Parser, Layout, Emitter, Themes, Testkorpus. Unten die Analyse, sortiert nach Hebelwirkung, nicht nach Aufwand.

---

## 1. Kurzdiagnose: das Problem ist nicht die Primitive-Anzahl, sondern die Primitive-*Kosten*

Ein neues Primitive kostet dich heute Edits in **sechs Dateien**:

| Datei | Was du anfassen musst |
|---|---|
| `ast.ts` | Interface + Aufnahme in `ContainerChild` / `WindowChild` / `AnyNode` |
| `parser.ts` | `ATTR_RULES`-Eintrag, `parseX()`, Platzierungsregel, `CONTAINER_CHILD_PRIMITIVES`, Switch-Case, Fehlertext |
| `serializer.ts` | Positional-Case + ggf. `nodeChildren`-Sonderfall |
| `layout.ts` | `measureX` + `positionX` + zwei Switch-Cases |
| `svg.ts` | `emitX` + Switch-Case |
| `themes.ts` | ~10 Tokens × 2 Themes |

Das ist exakt die Reibung, die `CONTRIBUTING.md` als „deliberate friction" verkauft — nur ist sie hier nicht bewusst gewählt, sondern ein Nebeneffekt davon, dass es keinen Registry-Mechanismus gibt. Die Konsequenz siehst du im Changelog: v0.4 → v0.4.5 → v0.50 → v0.6 → v0.7 haben jeweils Vokabular hinzugefügt und dabei drei parallele Layout-Modelle (`align` vs. `spacer` vs. `justify`) entstehen lassen, die inzwischen einen dokumentierten **Präzedenz-Kaskaden-Absatz** brauchen und in v0.7 sogar einen Parse-Error für die Kombination `align=right` + `spacer`. Ein Parse-Error, weil zwei Layout-Modelle im selben Container kollidieren, ist ein Architektur-Signal, kein Grammatik-Problem.

Wenn du Wireloom für ein echtes Dashboard-Projekt tragfähig machen willst, ist die Reihenfolge: **erst Architektur, dann Vokabular.** Sonst zahlst du die sechs-Dateien-Steuer noch 20-mal.

---

## 2. Phase 0 — Primitive-Registry + Normalisierungs-Pass

### 2.1 Registry

Ein Modul pro Primitive, das seine gesamte Surface deklariert. Der Core wird ein generischer Walker.

```ts
export interface PrimitiveSpec<N extends AnyNode = AnyNode> {
  readonly name: string;

  // Grammatik
  readonly positionals: readonly PositionalSpec[];   // required/optional, kind
  readonly attrs: Readonly<Record<string, AttrSpec>>;
  readonly flags: readonly string[];
  readonly children: ChildPolicy;
  // ChildPolicy =
  //   | { kind: 'none' }
  //   | { kind: 'container' }                      // normaler Container-Child-Set
  //   | { kind: 'only'; allow: readonly string[] } // tabs→tab, grid→cell
  //   | { kind: 'slots'; slots: Record<string, SlotPolicy> } // navbar→leading/center/trailing
  readonly placement: PlacementPolicy;  // 'anywhere' | { onlyInside: [...] } | 'windowRoot'

  build(ctx: BuildCtx): N;              // Positionals → Node-Felder

  // Layout-Teilnahme, statt hartkodierter Sonderfälle
  readonly flex?: { grow?: (n: N) => number; consumesSlack?: boolean };
  measure(node: N, ctx: MeasureCtx): Size;
  position(node: N, box: Rect, ctx: PositionCtx): LaidOutNode;

  emit(laid: LaidOutNode, theme: Theme, out: string[]): void;
  readonly tokens?: ThemeTokenGroup;    // genamespaced, mit Defaults
}
```

Damit wird aus „add a primitive" ein neues File plus eine Registry-Zeile. Der Serializer wird generisch (er kann `positionals` und `attrs` aus dem Spec ableiten — der aktuelle 200-Zeilen-Switch entfällt komplett). `ATTR_RULES`, `CONTAINER_CHILD_PRIMITIVES`, `placementErrorFor`, `PRIMITIVE_LIST_HUMAN` und die „did you mean"-Kandidatenlisten leiten sich alle aus der Registry ab, statt manuell synchron gehalten zu werden.

Nebeneffekt, den ich für unterschätzt halte: die Fehlermeldungen werden *automatisch* konsistent. Aktuell steht z. B. `"spacer" may only appear inside "row", "col", or "footer"` an drei Stellen im Parser als String-Literal.

### 2.2 Normalisierungs-Pass (Lowering)

Aktuell ist Desugaring in den Parser geschmiert — sichtbar an `parseTopLevelPanel`, das ein `footer:` innerhalb eines Top-Level-Panels in einen Window-Footer umschreibt. Das gehört nicht in den Parser.

```
source → lex → parse → AST
       → normalize (Desugaring, Macro-Expansion, Default-Auflösung) → NAST
       → layout → LaidDocument → paint
```

Das kostet dich einen Tag und ist die Voraussetzung für Punkt 7 (`define`/`use`). Außerdem wird der Parser dadurch wieder dumm und testbar.

---

## 3. Layout: ein Flex-Modell statt sechs

Zähl mit, wie oft „verteile Kinder entlang einer Achse" im Code implementiert ist:

1. `positionRow` (fill-col → spacer → justify → align, Kaskade)
2. `positionCol` (spiegelbildlich, v0.7)
3. `positionHeaderOrFooter` (drei Branches: spacer / lone-anchoring-row / right-pack)
4. `positionNavbar` (left/center/right-Anker)
5. `positionTabBar` (Gleichverteilung)
6. `positionSlotFooter` (hartkodiert rechtsbündig)

Plus `positionStats`, `positionResourceBar`, `positionBreadcrumb`, `positionSegmented` als weitere lineare Verteilungen.

**Vorschlag:** genau *eine* Funktion.

```ts
interface AxisItem { basis: number; grow: number; shrink?: number }

function layoutAxis(
  items: readonly AxisItem[],
  available: number,
  opts: { gap: number; justify: Justify }
): { offsets: number[]; sizes: number[] };
```

`spacer` wird zu `{ basis: 0, grow: 1 }`. `col fill` zu `{ basis: intrinsic, grow: 1 }`. `tabbar` zu „alle Items `grow: 1`, `basis: 0`". `footer` zu „`justify: end`". Die Präzedenz-Kaskade verschwindet, weil es keine konkurrierenden Modelle mehr gibt: Grow-Faktoren verteilen Slack, `justify` verteilt was danach übrig ist (nämlich nichts, wenn irgendwas growt). Damit fällt auch der v0.7-Parse-Error `align=right + spacer` weg — die Kombination wird einfach sinnvoll definiert.

**Zweitens fehlt die Cross-Achse komplett.** Du kannst heute einen Button nicht vertikal neben einem hohen Panel zentrieren. Für Dashboards ist das ein täglicher Bedarf (Toolbar mit Titel links, Buttons rechts, alle auf einer Mittelachse). `row align=` belegt leider schon den Main-Axis-Namen. Zwei Wege:

- **Sauber:** `align=` bekommt Cross-Achsen-Semantik (`start|center|end|stretch`), `justify=` bleibt Main-Achse. Alte Werte `left|right` werden als Aliases auf `justify` gemappt + Deprecation-Warning im Diagnostics-Array. Das ist CSS-konform und für LLM-Autoren die geringste kognitive Last, weil sie Flexbox kennen.
- **Konservativ:** neues Attribut `cross=start|center|end|stretch`. Null Breakage, aber du schleppst zwei Namensschemata mit.

Ich würde den sauberen Weg gehen und in v0.8 als bewusstes Breaking Change ausweisen — pre-1.0, und `INTEGRATION.md` erlaubt Minor-Breaks bereits explizit.

---

## 4. Sizing: die schwächste Stelle für Dashboards

Heute hat **nur `col`** eine Breite, und die ist seit v0.3 auf Pixel oder `fill` beschränkt (`50%` und `1fr` werden explizit als Parse-Error abgewiesen, obwohl der Lexer sie tokenisiert). Alles andere ist intrinsisch. Ein `panel w=320` ist nicht ausdrückbar — du musst in `col 320` wrappen. Höhen gibt es gar nicht, außer bei `image`/`chart`.

**Vorschlag: universelles Sizing-Set auf jedem Container.**

```
w = <N> | <N>% | <N>fr | fill | hug     (default: hug bei Leaves, fill bei col)
h = <N> | <N>% | fill | hug
min-w= / max-w= / min-h= / max-h=
gap = <N>                                (überschreibt Theme-Gap)
```

Das subsumiert `col fill`, macht `panel h=320` möglich, und die Lexer-Arbeit ist bereits erledigt (`LengthUnit` kennt `px|percent|fr`). Der `ColWidth`-Typ, der in v0.3 bewusst auf `unit: 'px'` verengt wurde, wird durch einen generellen `SizeSpec` ersetzt.

`gap=` ist für Dashboards wichtiger als es klingt: Dichte-Kontrolle ist der Unterschied zwischen „sieht aus wie ein Wireframe" und „sieht aus wie ein Grafana-Klon".

**Zusätzlich:** `scroll`-Flag auf `panel`/`list`/`table`. Ein Dashboard hat immer Scroll-Regionen; heute wächst der Container unbegrenzt. `panel h=320 scroll:` → clippt auf 320px und zeichnet eine Scrollbar-Andeutung. Das ist billig (ein Clip-Rect + ein Balken) und macht Mockups auf einen Schlag realistisch.

---

## 5. Grid: aktuell eine Matrix, kein Layout-Grid

`preferredCellSize()` nimmt das Maximum über *alle* Zellen und macht daraus eine uniforme Zellgröße. Das ist für den Technocracy-Tech-Tree richtig und für ein Dashboard völlig unbrauchbar — dort willst du 12 Spalten, und ein Chart spannt 8, eine KPI-Karte 4.

**Vorschlag:**

```
grid cols=12 gap=16 track=auto:
  cell span=8 rows=2:
    chart kind=area label="Requests/s"
  cell span=4:
    stats: …
  cell span=12:
    table: …
```

- `track=uniform` (default, byte-identisch zu heute) vs. `track=auto` (Spaltenbreiten = Max pro Spalte, Zeilenhöhen = Max pro Zeile — Standard-Grid-Track-Sizing).
- `span=` / `rows=` für Colspan/Rowspan.
- Zusammen mit `w=Nfr` aus Punkt 4 kannst du auch `cols=1fr 2fr 1fr` erlauben — aber das würde ich erst in einem zweiten Schritt machen, `span` auf uniformen 12 Spalten deckt 90 % ab und ist für LLM-Autoren deutlich leichter korrekt zu schreiben.

---

## 6. Die tatsächlich fehlenden Primitives — und es sind wenige

Ich habe geprüft, was für ein Devtool-Dashboard *nicht* komponierbar ist. Das Ergebnis ist erfreulich kurz:

### Echt neu nötig

**`table` — das ist die #1-Lücke.** Spaltenausrichtung über mehrere Zeilen ist das eine, was Komposition prinzipiell nicht kann: ein Stapel von `row`s richtet nichts aneinander aus, weil jede Row unabhängig misst. Heute faken Autoren das mit `kv` (nur 2 Spalten) oder `stats` (inline). Für Builds/Runs/Requests/Logs ist eine Tabelle unverzichtbar.

```
table:
  columns:
    column "Status" w=80
    column "Build"  w=fill
    column "Duration" w=100 align=right
    column "" w=40                       # Action-Spalte
  rows:
    tr:
      td: status "passed" kind=success
      td: text "#4821 · main"
      td: text "2m 14s"
      td: button "" icon=gear
    tr selected:
      …
```

Implementierungsseitig: Zwei-Pass-Measure (Spaltenbreiten = Max über alle Zellen der Spalte, dann Zeilen-Position). Das ist im Kern derselbe Algorithmus wie `grid track=auto` — bau es einmal, nutz es zweimal. `header`/`footer`-Zeilen, `zebra`-Flag, `sticky`-Flag für den Kopf.

**`code` — die zweite echte Lücke.** Monospace-Block mit optionalen Zeilennummern, Gutter, Prompt. Nicht komponierbar (Font-Family und Zeilennummern-Gutter sind Renderer-Sache). Deckt vier Devtool-Bedürfnisse mit einem Primitive ab:

```
code kind=block lines:      # Codeblock mit Zeilennummern
code kind=terminal:         # $-Prompt-Styling
code kind=log:              # Timestamp-Gutter, monospace
code kind=diff:             # +/- Gutter mit Farbe
```

### Reine Enum-Erweiterungen (fast gratis, hoher Ertrag)

- `chart kind=` → `+ area, donut, stacked, scatter, heatmap, sparkline`. Sparkline besonders: KPI-Karten brauchen die ständig, und es ist ein 6-Zeilen-Emitter.
- `progress kind=` → `+ ring, segmented` (Gauge/Quota-Anzeigen).
- `divider` → **`orientation=horizontal|vertical`**. Aktuell nur horizontal (`emitDivider` zeichnet eine Linie auf halber Höhe über die Breite). Für Side-by-Side-Panes im Dashboard brauchst du vertikal. Plus `handle`-Flag für Splitter-Affordanz.
- `status kind=` → `+ neutral, pending, running`.
- `chip` → `variant=kbd` für Shortcut-Anzeigen (`⌘K`). Devtool-Standard.
- `skeleton` als Leaf (Loading-Balken) — 15 Zeilen, aber macht „Empty/Loading State"-Mockups möglich.

### Bewusst *nicht* aufnehmen

`sidebar`, `toolbar`, `card`, `metric`, `empty-state`, `timeline` — alles komponierbar aus `row`/`col`/`panel`/`slot`. Die gehören in Punkt 7, nicht in die Grammatik.

### Ein Modellierungs-Fehler, den ich anmerken will

**`tabs` besitzt seinen Content nicht.** Aktuell ist `tabs:` nur eine Leiste; der Inhalt ist was zufällig danach als Geschwister steht. Für Dashboards mit getabten Panels ist das unbefriedigend. Rückwärtskompatible Erweiterung: `tab` darf Kinder haben, und wenn mindestens ein `tab` Kinder hat, rendert der Renderer den Content des `active` Tabs unter der Leiste. Ohne Kinder bleibt alles wie heute.

---

## 7. Der eigentliche „weniger rigide"-Hebel: `define` / `use`

Das ist der Punkt, der deine Ausgangsfrage direkt beantwortet. Statt die Grammatik unendlich wachsen zu lassen, gib Autoren die Möglichkeit, **projektspezifisches Vokabular** zu bauen:

```
define metric(label, value, delta, tone):
  slot $label:
    row align=center:
      text $value bold size=large
      spacer
      text $delta accent=$tone
    chart kind=sparkline accent=$tone

window "API Overview":
  grid cols=12 gap=16 track=auto:
    cell span=3: use metric("Requests", "1.2M", "+12%", success)
    cell span=3: use metric("p95",      "148ms", "-4%",  success)
    cell span=3: use metric("Errors",   "0.31%", "+0.1%", warning)
    cell span=3: use metric("Cost",     "$412",  "+8%",  danger)
```

Warum das der richtige Hebel ist:

- **Blast Radius = nur Parser + Normalizer.** Die Expansion passiert vor dem Layout; Layout, Emitter, Serializer bleiben unberührt.
- Es hält den Primitive-Core klein — genau das, was `CONTRIBUTING.md` als Philosophie postuliert, aber ohne Ausweichventil bisher nicht durchhalten kann.
- Für dein Dashboard-Projekt heißt das: du definierst einmal `metric`, `runrow`, `envbadge`, `logline` und schreibst danach Dashboards in *deinem* Vokabular statt in Wireframe-Primitiven.
- Für LLM-Autoren ist es ideal: du kannst dem Agent eine Bibliothek von `define`s mitgeben, und er schreibt danach hochsemantische, kurze Sources.

**Implementierungsdetails, die du nicht übersehen darfst:**

1. **Fehlermeldungen brauchen zwei Positionen.** Ein Fehler in einem expandierten Body muss sowohl auf die `define`-Zeile als auch auf die `use`-Zeile zeigen. `WireloomError` trägt nur ein `{line, column}`. Erweitere auf `notes: Array<{line, column, message}>` — das brauchst du sowieso für gute Diagnostics.
2. **Rekursionsgrenze** (`define a: use a`) mit klarer Fehlermeldung.
3. **Substitution auch *innerhalb* von Strings**: `text "Build $id failed"`. Sonst wird es schnell unhandlich. Ich würde `$name` nur außerhalb von Strings erlauben und für Strings eine explizite Interpolation `"Build {id}"` — sauberer zu parsen und zu erklären.
4. **Hygiene bei `id=`**: wenn ein `define`-Body ein `id="x"` enthält und du es zweimal verwendest, hast du Duplikate. Entweder id-Präfixing bei Expansion oder eine harte Diagnose (siehe Bug in Punkt 10).

---

## 8. Textmetrik, Wrap, Truncate

`averageCharWidth = 7.2` × `content.length` ist der Kern der gesamten Layout-Mathematik. Für Wireframes okay, für Tabellen und Code nicht — dort driftet der rechtsbündige `kv`-Wert oder eine Tabellenspalte sichtbar.

Drei Verbesserungen, aufsteigend nach Aufwand:

1. **Per-Font-Klasse-Breiten.** Monospace ist exakt vorhersagbar (`0.6 × fontSize` für die üblichen Stacks). Sobald du `code`/`table` hast, ist das kein Heuristik-mehr, sondern korrekt. Sofortiger Genauigkeitsgewinn ohne Aufwand.
2. **Injizierbare Messfunktion.** `render(id, src, { measureText })`. Browser-Integrationen liefern exakte Metriken über Canvas, Node bleibt beim Heuristik-Fallback. Das ist die architektonisch richtige Antwort und kostet einen Parameter, der durch den `MeasureCtx` gereicht wird — was du beim Registry-Refactor sowieso baust.
3. **`wrap` + `ellipsis`.** `text "…" wrap w=320` (Greedy-Wrap über die Messfunktion) und `ellipsis` für Tabellenzellen. Ohne das musst du in Dashboards jede Beschreibung von Hand mit `\n` brechen — und das funktioniert aktuell gar nicht (siehe Bug #2 unten).

---

## 9. Theme- und Output-API

**Theme-Interface auflösen.** 200 flache Tokens, die bei jedem Minor wachsen, sind exakt der Grund, warum „Custom Themes" laut `INTEGRATION.md` bis v1.0 blockiert sind. Namespacing plus `DeepPartial`-Merge löst das:

```ts
const theme = defineTheme(DEFAULT_THEME, {
  color:  { text: '#0f172a', accent: { danger: '#dc2626' } },
  button: { fill: '#fff', radius: 6 },
  table:  { rowHeight: 32, zebraFill: '#f8fafc' },
});
```

Neue Tokens in einem Minor brechen dann kein Structural Typing mehr, weil Nutzer nur Partials liefern. Nebeneffekt: die `as Theme`-Casts in `themes.ts` (die aktuell `exactOptionalPropertyTypes` aushebeln) können weg.

**SVG-Output braucht Hooks.** Der Output ist heute komplett anonym — keine IDs, keine Klassen, keine Data-Attribute. Für ein Devtool-Dashboard-Mockup willst du:

- `data-wl-kind="table-row"` und `data-wl-id="build-4821"` auf den `<g>`-Wrappern. Kostet fast nichts, macht Hover/Klick/Testing im Host möglich, ohne die Sprache anzufassen.
- Den `id → Rect`-Map öffentlich machen. `layout()` berechnet ihn bereits (`buildIdMap`) und wirft ihn weg. Exportiert bekommst du damit klickbare Hotspots gratis — für ein Doku-Tool oder einen Prototyp-Viewer ist das Gold.
- Optional: CSS-Custom-Properties statt eingebrannter Hex-Werte (`fill="var(--wl-text, #2d2d2d)"`), damit ein Host ohne Re-Render umthemen kann. Die Fallback-Syntax bewahrt die „safe für `innerHTML`, keine externen Refs"-Eigenschaft.

**Diagnostics-Array.** `parse()` gibt heute entweder ein Dokument oder wirft. Warnungen gehen per `console.warn` raus (`segmented` mit < 2 Kindern) oder verschwinden lautlos (nicht auflösbare Annotation-Targets werden **kommentarlos gedroppt**). Für ein Tool, das du in einer Pipeline betreibst, brauchst du:

```ts
const { doc, diagnostics } = parse(src);  // diagnostics: {severity, line, column, message}[]
```

Und darin: leere Container, unaufgelöste `target=`, doppelte `id=`, deprecated Attribute, Content-Overflow bei `scroll`-losen Fixed-Height-Containern.

---

## 10. Konkrete Findings aus dem Read-Through

Diese sind unabhängig von der Roadmap und teilweise echte Bugs:

**1. `buildIdMap` widerspricht der Dokumentation.** Die Grammatik-Doc sagt „if duplicates exist, layout uses the first match". Der Code nutzt einen Stack mit `pop()` und pusht Kinder in Vorwärtsreihenfolge — die Traversierung läuft also faktisch rechts-nach-links/DFS-reversed. Bei doppelten IDs gewinnt weder das erste noch das letzte Element deterministisch nachvollziehbar. Fix: bewusster Pre-Order-Walk **plus** eine Duplikat-Warnung im Diagnostics-Array.

**2. `\n` in `text` tut nichts.** `emitText` schiebt den Content in ein einzelnes `<text>`; SVG kollabiert das Newline zu einem Space. Gleichzeitig zählt `measureText` das `\n` als Zeichen mit voller Breite und gibt eine Zeilenhöhe zurück. Nur `emitAnnotation` splittet korrekt auf Zeilen. Das ist eine Inkonsistenz, die AGENTS.md-lesende Agents garantiert triggern. Fix: `text` auf `<tspan>`-Zeilen splitten und die Höhe entsprechend messen (fällt beim Wrap-Feature ohnehin an).

**3. `emitNode` hat kein `default: assertNever`.** Ein neuer Node-Kind rendert lautlos nichts, statt beim Compile zu failen. `measureChild`/`positionContainerChild` sind über den Return-Typ exhaustiv abgesichert, `emitNode` nicht. Ein `default: { const _x: never = kind; }` kostet zwei Zeilen und fängt genau die Klasse Fehler, die bei jedem Feature-Release entsteht.

**4. `positionSlotFooter` ist hartkodiert rechtsbündig.** Kein `align`/`justify` möglich. Verschwindet mit dem Flex-Refactor.

**5. `positionInput`:** `Math.min(width, Math.max(size.width, Math.min(width, inputMinWidth * 2)))` — funktioniert, aber ist ein Symptom dafür, dass Sizing ad hoc pro Primitive passiert. Verschwindet mit Punkt 4.

**6. Golden-Snapshot-Strategie.** 40+ byte-exakte SVG-Snapshots werden durch den Layout-Refactor komplett invalidiert. Bevor du anfängst: bau eine **semantische Invarianten-Schicht** (keine Überlappungen zwischen Geschwistern, Kinder innerhalb der Elternbox, rechtsbündig ⇒ rechte Kante identisch, Summe der Kindbreiten + Gaps ≤ Containerbreite). Damit kannst du den Refactor mit Vertrauen fahren und die Snapshots als zweite Verteidigungslinie neu generieren, statt sie als einzige zu haben.

---

## 11. Priorisierte Roadmap

**Phase A — Fundament (kein neues Vokabular, alle bestehenden Sources parsen weiter)**
1. Primitive-Registry + Normalisierungs-Pass
2. `layoutAxis()` — eine Flex-Engine ersetzt sechs
3. Universelles Sizing (`w`/`h`/`min`/`max`, `%`/`fr`) + `gap=` + `scroll`
4. Theme-Namespacing + `DeepPartial`-Merge + injizierbare Textmessung
5. Diagnostics-Array + `data-wl-*`-Attribute + öffentliche ID-Rect-Map
6. Invarianten-Tests vor dem Refactor, Snapshots danach neu

**Phase B — Dashboard-Vokabular (auf A billig)**
7. `table` (Zwei-Pass-Track-Sizing — teilt Code mit Grid)
8. `grid track=auto` + `span=`
9. `code` (block/terminal/log/diff)
10. Enum-Verbreiterung: chart kinds, progress kinds, `divider orientation=`, `chip variant=kbd`, `skeleton`
11. `tab` mit eigenem Content

**Phase C — die Anti-Rigiditäts-Auszahlung**
12. `define` / `use`
13. `wrap` / `ellipsis`
14. Anker-Overlays (`popover target="id"`) — nutzt den Annotation-Anchor-Resolver wieder
15. Cross-Achsen-`align` (Breaking, sauber in v0.8 ausweisen)

---

## 12. Wenn du morgen anfangen müsstest

Für dein konkretes Ziel — modernes Devtool-Dashboard planen — ist die minimale Kette, die dich am schnellsten dorthin bringt:

**`layoutAxis` + universelles Sizing + `grid track=auto/span` + `table` + `divider vertical` + `chart kind=sparkline|area`.**

Damit kannst du eine App-Shell (Topbar / fixe Sidebar / fluider Content), eine KPI-Reihe, eine Chart-Reihe und eine Build-Tabelle bauen — das ist ein vollständiges Devtool-Dashboard. `define`/`use` kommt direkt danach und macht die zweite bis zwanzigste Ansicht dann trivial.

Der Registry-Refactor ist streng genommen nicht *nötig* für diese Kette, aber wenn du ihn überspringst, zahlst du für `table` allein wieder die sechs-Dateien-Steuer plus ~15 neue Theme-Tokens × 2 Themes. Ich würde ihn vorziehen — er ist etwa ein bis zwei Tage und amortisiert sich beim zweiten Primitive.

Soll ich für einen dieser Punkte ein konkretes Design-Dokument schreiben — Grammatik-Spec, AST-Shape, Layout-Algorithmus und Migrationspfad? `table` und `layoutAxis` wären die beiden, bei denen sich die Detailarbeit am meisten lohnt.