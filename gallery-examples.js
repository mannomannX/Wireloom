// Wireloom Examples Corpus Dictionary
export const EXAMPLES = {
  "01-minimal": {
    "id": "01-minimal",
    "file": "01-minimal.wireloom",
    "title": "01-minimal — Minimal",
    "code": "window:\r\n  text \"Hello, Wireloom\""
  },
  "02-login-form": {
    "id": "02-login-form",
    "file": "02-login-form.wireloom",
    "title": "02-login-form — Login Form",
    "code": "window \"Sign in\":\r\n  header:\r\n    text \"Welcome back\"\r\n  panel:\r\n    input placeholder=\"Email\" type=email\r\n    input placeholder=\"Password\" type=password\r\n    button \"Sign in\" primary\r\n  footer:\r\n    text \"Forgot your password?\""
  },
  "03-settings-dialog": {
    "id": "03-settings-dialog",
    "file": "03-settings-dialog.wireloom",
    "title": "03-settings-dialog — Settings Dialog",
    "code": "window \"Settings\":\r\n  header:\r\n    text \"Application Settings\"\r\n  panel:\r\n    text \"Appearance\"\r\n    row:\r\n      text \"Theme\"\r\n      input placeholder=\"Dark\"\r\n    row:\r\n      text \"Font size\"\r\n      input placeholder=\"14\"\r\n  panel:\r\n    text \"Privacy\"\r\n    row:\r\n      text \"Telemetry\"\r\n      input placeholder=\"Enabled\"\r\n  footer:\r\n    button \"Cancel\"\r\n    button \"Save\" primary"
  },
  "04-two-column": {
    "id": "04-two-column",
    "file": "04-two-column.wireloom",
    "title": "04-two-column — Two Column",
    "code": "window \"Split View\":\r\n  row:\r\n    col 240:\r\n      text \"Left column\"\r\n      text \"Sidebar content\"\r\n      text \"More items\"\r\n    col:\r\n      text \"Right column\"\r\n      text \"Main content here\"\r\n      text \"Lots of space\""
  },
  "05-nested-panels": {
    "id": "05-nested-panels",
    "file": "05-nested-panels.wireloom",
    "title": "05-nested-panels — Nested Panels",
    "code": "window:\r\n  panel:\r\n    text \"Outer panel\"\r\n    panel:\r\n      text \"Middle panel\"\r\n      panel:\r\n        text \"Inner panel\"\r\n        text \"Three levels deep\""
  },
  "06-footer-actions": {
    "id": "06-footer-actions",
    "file": "06-footer-actions.wireloom",
    "title": "06-footer-actions — Footer Actions",
    "code": "window \"Confirm\":\r\n  panel:\r\n    text \"Are you sure you want to continue?\"\r\n    text \"This action cannot be undone.\"\r\n  footer:\r\n    button \"Cancel\"\r\n    button \"Continue\" primary"
  },
  "07-button-variants": {
    "id": "07-button-variants",
    "file": "07-button-variants.wireloom",
    "title": "07-button-variants — Button Variants",
    "code": "window \"Button showcase\":\r\n  panel:\r\n    text \"Default button:\"\r\n    button \"Default\"\r\n    text \"Primary button:\"\r\n    button \"Save\" primary\r\n    text \"Disabled button:\"\r\n    button \"Unavailable\" disabled\r\n    text \"Primary and disabled:\"\r\n    button \"Submit\" primary disabled"
  },
  "08-input-placeholder": {
    "id": "08-input-placeholder",
    "file": "08-input-placeholder.wireloom",
    "title": "08-input-placeholder — Input Placeholder",
    "code": "window \"Sign up\":\r\n  panel:\r\n    input placeholder=\"Full name\"\r\n    input placeholder=\"Email address\" type=email\r\n    input placeholder=\"Password\" type=password\r\n    input placeholder=\"Confirm password\" type=password\r\n    button \"Create account\" primary"
  },
  "09-dividers": {
    "id": "09-dividers",
    "file": "09-dividers.wireloom",
    "title": "09-dividers — Dividers",
    "code": "window \"Divided layout\":\r\n  panel:\r\n    text \"Top section\"\r\n    text \"More top content\"\r\n    divider\r\n    text \"Middle section\"\r\n    text \"More middle content\"\r\n    divider\r\n    text \"Bottom section\"\r\n    text \"Final content\""
  },
  "10-whitespace-edges": {
    "id": "10-whitespace-edges",
    "file": "10-whitespace-edges.wireloom",
    "title": "10-whitespace-edges — Whitespace Edges",
    "code": "# Comment at the top of the file\r\n# Multi-line comment block\r\n# demonstrating that comments stack cleanly\r\n\r\nwindow \"Whitespace test\":\r\n\r\n  # Comment inside the window block\r\n  header:\r\n    text \"Header text\"\r\n\r\n  # Blank line above, comment here\r\n  panel:\r\n    text \"Main content\"\r\n\r\n    # Comment between leaf nodes\r\n\r\n    text \"More content below a blank line\"\r\n    # Inline-style comment before a leaf\r\n    text \"Last content item\"\r\n\r\n  footer:\r\n    # Comment before a leaf\r\n    button \"OK\" primary"
  },
  "11-colonial-charter": {
    "id": "11-colonial-charter",
    "file": "11-colonial-charter.wireloom",
    "title": "11-colonial-charter — Colonial Charter",
    "code": "# Colonial Charter screen from Galactic Civilizations IV.\r\n# Rewritten for v0.2 using real tabs, sections, kv rows, slots, and badges.\r\n# Compare against 11-colonial-charter.wireloom history in git for the\r\n# v0.1 workaround version that lived in panels of text+row children.\r\n\r\nwindow \"CIVILIZATION\":\r\n  header:\r\n    text \"Colonial Charter\" size=large\r\n\r\n  tabs:\r\n    tab \"Government\" active\r\n    tab \"Leaders\"\r\n    tab \"Ministers\"\r\n    tab \"Diplomats\"\r\n    tab \"Governors\"\r\n    tab \"Commanders\"\r\n    tab \"Institutions\"\r\n    tab \"Parties\"\r\n\r\n  row:\r\n\r\n    # Left column: fixed 340px\r\n    col 340:\r\n\r\n      section \"Economy\":\r\n        kv \"Tax Rate\" \"30%\"\r\n        slider range=0-100 value=30\r\n        kv \"Approval\" \"Content (72%)\"\r\n\r\n      section \"Gross Income\":\r\n        kv \"Colony Income\" \"+612\"\r\n        kv \"Trade Routes\" \"+145\"\r\n        kv \"Treaty Income\" \"+62\"\r\n        kv \"Tax Rate (30%)\" \"+28\"\r\n        divider\r\n        kv \"Total Income\" \"+847 bc\" bold\r\n\r\n      section \"Expenses\":\r\n        kv \"Ship Maintenance\" \"-245\"\r\n        kv \"Colony Maintenance\" \"-180\"\r\n        kv \"Starbase Maintenance\" \"-95\"\r\n        kv \"Treaty Maintenance\" \"-52\"\r\n        kv \"Policy Maintenance\" \"-40\"\r\n        divider\r\n        kv \"Total Expenses\" \"-612 bc\" bold\r\n\r\n      section \"Net\":\r\n        kv \"Net Income\" \"+235 bc\" bold size=large\r\n        kv \"Treasury\" \"4,250 bc\"\r\n\r\n      section \"Civilization\":\r\n        kv \"Government\" \"Colonial Charter\"\r\n        kv \"Colonies\" \"12\"\r\n        kv \"Citizens\" \"24.5B\"\r\n\r\n    # Center column: fill remaining space\r\n    col:\r\n      section \"Enacted Policies\" badge=\"4 / 7 slots filled\":\r\n        list:\r\n          slot \"Colonial Defense Pact\":\r\n            text \"+15% Planetary Defense\"\r\n            text \"All colonies gain defensive bonuses\" muted\r\n          slot \"Free Market Initiative\":\r\n            text \"+10% Income, -5% Approval\"\r\n            text \"Deregulated trade increases revenue\" muted\r\n          slot \"Research Subsidies\" active:\r\n            text \"+20% Research Output\"\r\n            text \"Government funded research programs\" muted\r\n            row justify=end:\r\n              button \"Revoke\"\r\n          slot \"Cultural Exchange\":\r\n            text \"+10% Influence, +5% Tourism\"\r\n            text \"Interstellar cultural programs\" muted\r\n          slot \"Empty Policy Slot\":\r\n            text \"Choose a policy from the available list\" muted italic\r\n          slot \"Empty Policy Slot\":\r\n            text \"Choose a policy from the available list\" muted italic\r\n          slot \"Empty Policy Slot\":\r\n            text \"Choose a policy from the available list\" muted italic\r\n\r\n    # Right column: fixed 360px\r\n    col 360:\r\n      section \"Available Policies\":\r\n        list:\r\n          slot \"Frontier Expansion\":\r\n            text \"+20% Colony Speed, +10% Growth\"\r\n            text \"Prioritize outward expansion\" muted\r\n            row justify=end:\r\n              text \"2 Admin\" muted size=small\r\n              button \"Enact\" primary\r\n          slot \"Militia Training\":\r\n            text \"+15% Planetary Defense, +10% Military\"\r\n            text \"Arm the colonists\" muted\r\n            row justify=end:\r\n              text \"3 Admin\" muted size=small\r\n              button \"Enact\" primary\r\n          slot \"Trade Agreements\":\r\n            text \"+20% Trade Route Income\"\r\n            text \"Establish favorable trade terms\" muted\r\n            row justify=end:\r\n              text \"2 Admin\" muted size=small\r\n              button \"Enact\" primary\r\n          slot \"Infrastructure Investment\":\r\n            text \"+15% Manufacturing, +10% Growth\"\r\n            text \"Build foundational industry\" muted\r\n            row justify=end:\r\n              text \"3 Admin\" muted size=small\r\n              button \"Enact\" primary\r\n          slot \"Diplomatic Corps\":\r\n            text \"+15% Influence, +10% Diplomacy\"\r\n            text \"Invest in foreign relations\" muted\r\n            row justify=end:\r\n              text \"2 Admin\" muted size=small\r\n              button \"Enact\" primary\r\n          slot \"Pioneer Spirit\":\r\n            text \"+15% Approval, +10% Morale\"\r\n            text \"Foster community and purpose\" muted\r\n\r\n  footer:\r\n    row:\r\n      button \"Change Government\"\r\n      row justify=end:\r\n        button \"Done\" primary"
  },
  "12-tabs": {
    "id": "12-tabs",
    "file": "12-tabs.wireloom",
    "title": "12-tabs — Tabs",
    "code": "window \"Colonial Charter\":\r\n  tabs:\r\n    tab \"Government\" active\r\n    tab \"Leaders\"\r\n    tab \"Ministers\"\r\n    tab \"Diplomats\" badge=\"3\"\r\n    tab \"Governors\"\r\n    tab \"Commanders\"\r\n  panel:\r\n    text \"Currently viewing Government settings.\"\r\n    text \"Switch tabs to see other sections.\""
  },
  "13-sections": {
    "id": "13-sections",
    "file": "13-sections.wireloom",
    "title": "13-sections — Sections",
    "code": "window \"Settings\":\r\n  section \"Appearance\":\r\n    kv \"Theme\" \"Dark\"\r\n    kv \"Font size\" \"14\"\r\n  section \"Notifications\" badge=\"2 new\":\r\n    kv \"Email\" \"Enabled\"\r\n    kv \"Push\" \"Disabled\"\r\n    kv \"SMS\" \"Disabled\"\r\n  section \"Privacy\":\r\n    kv \"Telemetry\" \"Anonymous\"\r\n    kv \"Crash reports\" \"Enabled\""
  },
  "14-kv-rows": {
    "id": "14-kv-rows",
    "file": "14-kv-rows.wireloom",
    "title": "14-kv-rows — Kv Rows",
    "code": "window \"Empire Overview\":\r\n  panel:\r\n    text \"ECONOMY\" bold size=small muted\r\n    kv \"Tax Rate\" \"30%\"\r\n    kv \"Approval\" \"Content (72%)\"\r\n    kv \"Colony Income\" \"+612\"\r\n    kv \"Trade Routes\" \"+145\"\r\n    kv \"Treaty Income\" \"+62\"\r\n    divider\r\n    kv \"Total Income\" \"+847 bc\" bold\r\n    kv \"Total Expenses\" \"-612 bc\" bold\r\n    kv \"Net Income\" \"+235 bc\" bold size=large"
  },
  "15-list-and-slot": {
    "id": "15-list-and-slot",
    "file": "15-list-and-slot.wireloom",
    "title": "15-list-and-slot — List And Slot",
    "code": "window \"Policies\":\r\n  section \"Enacted policies\" badge=\"4 / 7\":\r\n    list:\r\n      slot \"Colonial Defense Pact\":\r\n        text \"+15% Planetary Defense\"\r\n        text \"All colonies gain defensive bonuses\" muted\r\n      slot \"Free Market Initiative\":\r\n        text \"+10% Income, -5% Approval\"\r\n        text \"Deregulated trade increases revenue\" muted\r\n      slot \"Research Subsidies\" active:\r\n        text \"+20% Research Output\"\r\n        text \"Government funded research programs\" muted\r\n        button \"Revoke\"\r\n      slot \"Cultural Exchange\":\r\n        text \"+10% Influence, +5% Tourism\"\r\n        text \"Interstellar cultural programs\" muted\r\n  section \"Quick wins\":\r\n    list:\r\n      item \"Recruit a Governor on Vega IV\"\r\n      item \"Establish trade route with Terran Alliance\"\r\n      item \"Upgrade shipyard to tier 2\""
  },
  "16-media": {
    "id": "16-media",
    "file": "16-media.wireloom",
    "title": "16-media — Media",
    "code": "window \"Profile\":\r\n  header:\r\n    text \"Commander Profile\"\r\n  row:\r\n    col 200:\r\n      image label=\"Portrait\" width=160 height=160\r\n    col:\r\n      panel:\r\n        kv \"Name\" \"Admiral Kade Voss\"\r\n        kv \"Rank\" \"Fleet Admiral\"\r\n        kv \"Homeworld\" \"Arcturus Prime\"\r\n        row:\r\n          icon name=\"medal\"\r\n          icon name=\"star\"\r\n          icon name=\"shield\"\r\n  footer:\r\n    button \"Edit profile\"\r\n    button \"Close\" primary"
  },
  "17-controls": {
    "id": "17-controls",
    "file": "17-controls.wireloom",
    "title": "17-controls — Controls",
    "code": "window \"Preferences\":\r\n  section \"Economy\":\r\n    slider range=0-100 value=30 label=\"Tax Rate\"\r\n    slider range=0-100 value=72 label=\"Approval Weight\"\r\n  section \"Governance\":\r\n    row:\r\n      text \"Default government\"\r\n      combo value=\"Colonial Charter\" options=\"Colonial Charter,Autocracy,Federation\"\r\n    row:\r\n      text \"Difficulty\"\r\n      combo value=\"Challenging\" options=\"Easy,Normal,Challenging,Brutal\"\r\n    row:\r\n      text \"AI Personality\"\r\n      combo \"Select an AI trait\" options=\"Aggressive,Builder,Diplomat,Explorer\"\r\n  footer:\r\n    button \"Reset\"\r\n    button \"Apply\" primary"
  },
  "18-typography": {
    "id": "18-typography",
    "file": "18-typography.wireloom",
    "title": "18-typography — Typography",
    "code": "window \"Typography Showcase\":\r\n  panel:\r\n    text \"Headline weight and size\" bold size=large\r\n    text \"Subhead — medium emphasis\" weight=semibold\r\n    text \"Body text at the default weight and size.\"\r\n    text \"Muted caption reads quieter than body.\" muted size=small\r\n    text \"Italic text for inline emphasis.\" italic\r\n    divider\r\n    text \"LABEL IN SMALL CAPS\" bold size=small muted\r\n    kv \"Label\" \"Default value\"\r\n    kv \"Label\" \"Bold value\" bold\r\n    kv \"Label\" \"Large value\" size=large\r\n    kv \"Label\" \"Muted value\" muted\r\n    kv \"Label\" \"Italic value\" italic"
  },
  "19-fill-columns": {
    "id": "19-fill-columns",
    "file": "19-fill-columns.wireloom",
    "title": "19-fill-columns — Fill Columns",
    "code": "window \"Three-column app shell\":\r\n  row:\r\n    col 240:\r\n      panel:\r\n        text \"Sidebar\" bold\r\n        list:\r\n          item \"Home\"\r\n          item \"Search\"\r\n          item \"Library\"\r\n          item \"Settings\"\r\n    col:\r\n      panel:\r\n        text \"Main content fills remaining space\" bold\r\n        text \"This column has no explicit width, so it takes whatever is left after the fixed left and right columns claim theirs.\"\r\n        text \"Resize the viewport and it grows or shrinks.\"\r\n    col 280:\r\n      panel:\r\n        text \"Inspector\" bold\r\n        kv \"Type\" \"Document\"\r\n        kv \"Size\" \"42 KB\"\r\n        kv \"Modified\" \"Today, 14:32\""
  },
  "20-right-aligned-row": {
    "id": "20-right-aligned-row",
    "file": "20-right-aligned-row.wireloom",
    "title": "20-right-aligned-row — Right Aligned Row",
    "code": "window \"Confirm action\":\r\n  panel:\r\n    text \"Delete the selected project?\" bold\r\n    text \"This cannot be undone. All associated notes, tasks, and linked resources will be removed.\" muted\r\n  footer:\r\n    row justify=end:\r\n      button \"Cancel\"\r\n      button \"Delete\" primary"
  },
  "21-grid-matrix": {
    "id": "21-grid-matrix",
    "file": "21-grid-matrix.wireloom",
    "title": "21-grid-matrix — Grid Matrix",
    "code": "# 5×5 Optimization Matrix (Technocracy government)\r\nwindow \"Technocracy — Optimization Matrix\":\r\n  grid cols=5 rows=5:\r\n    cell \"Compute I\" state=purchased accent=research\r\n    cell \"Compute II\" state=purchased accent=research\r\n    cell \"Compute III\" state=available accent=research\r\n    cell \"Compute IV\" state=locked accent=research\r\n    cell \"Compute V\" state=locked accent=research\r\n\r\n    cell \"Tax I\" state=purchased accent=wealth\r\n    cell \"Tax II\" state=available accent=wealth\r\n    cell \"Tax III\" state=locked accent=wealth\r\n    cell \"Tax IV\" state=locked accent=wealth\r\n    cell \"Tax V\" state=locked accent=wealth\r\n\r\n    cell \"Fleet I\" state=available accent=military\r\n    cell \"Fleet II\" state=locked accent=military\r\n    cell \"Fleet III\" state=locked accent=military\r\n    cell \"Fleet IV\" state=locked accent=military\r\n    cell \"Fleet V\" state=locked accent=military\r\n\r\n    cell \"Prod I\" state=maxed accent=industry\r\n    cell \"Prod II\" state=maxed accent=industry\r\n    cell \"Prod III\" state=purchased accent=industry\r\n    cell \"Prod IV\" state=available accent=industry\r\n    cell \"Prod V\" state=locked accent=industry\r\n\r\n    cell \"Morale I\" state=purchased accent=approval\r\n    cell \"Morale II\" state=available accent=approval\r\n    cell \"Morale III\" state=locked accent=approval\r\n    cell \"Morale IV\" state=locked accent=approval\r\n    cell \"Morale V\" state=locked accent=approval"
  },
  "22-resourcebar": {
    "id": "22-resourcebar",
    "file": "22-resourcebar.wireloom",
    "title": "22-resourcebar — Resourcebar",
    "code": "# GC4 resource strip shown at the top of every government screen\r\nwindow \"Colonial Charter\":\r\n  resourcebar:\r\n    resource name=\"Credits\" value=\"1,500\"\r\n    resource name=\"Research\" value=\"240\"\r\n    resource name=\"Production\" value=\"88\"\r\n    resource name=\"Influence\" value=\"55\"\r\n    resource name=\"Approval\" value=\"72%\"\r\n    resource name=\"Faith\" value=\"12\"\r\n    resource name=\"Diplo\" value=\"4\"\r\n    resource name=\"Authority\" value=\"9\"\r\n  panel:\r\n    text \"Top-of-screen resource strip above.\""
  },
  "23-progress-and-chart": {
    "id": "23-progress-and-chart",
    "file": "23-progress-and-chart.wireloom",
    "title": "23-progress-and-chart — Progress And Chart",
    "code": "window \"Research Overview\":\r\n  section \"Progress\":\r\n    progress value=68 max=100 label=\"Computation Pool\" accent=research\r\n    progress value=4 max=10 label=\"Matrix Tier (Investment)\" accent=wealth\r\n    progress value=220 max=300 label=\"Institution XP\" accent=industry\r\n  section \"Charts\":\r\n    row:\r\n      chart kind=bar label=\"Maintenance ramp\" accent=warning\r\n      chart kind=line label=\"Approval over time\" accent=approval\r\n      chart kind=pie label=\"Equity split\" accent=wealth"
  },
  "24-stats-strip": {
    "id": "24-stats-strip",
    "file": "24-stats-strip.wireloom",
    "title": "24-stats-strip — Stats Strip",
    "code": "window \"Leader Card\":\r\n  panel:\r\n    text \"Admiral Kade Voss\" bold size=large\r\n    stats:\r\n      stat \"INT\" \"4\"\r\n      stat \"CHA\" \"3\"\r\n      stat \"MIL\" \"5\" bold\r\n      stat \"LOY\" \"75\"\r\n    text \"Fleet Admiral, Arcturus Prime\" muted size=small"
  },
  "25-slot-footer": {
    "id": "25-slot-footer",
    "file": "25-slot-footer.wireloom",
    "title": "25-slot-footer — Slot Footer",
    "code": "window \"Oligarchy — Investments\":\r\n  row:\r\n    slot \"Corellian Shipyards\" state=growing accent=industry:\r\n      stats:\r\n        stat \"Yield\" \"+12/turn\"\r\n        stat \"Ripens\" \"T+6\"\r\n      text \"Growing investment — pulls in shipyard revenue over time.\" muted size=small\r\n      footer:\r\n        button \"Sell\"\r\n        button \"Harvest\" primary accent=wealth\r\n    slot \"Arcturus Mining Guild\" state=ripe accent=wealth:\r\n      stats:\r\n        stat \"Yield\" \"+40/turn\"\r\n        stat \"Ripens\" \"NOW\"\r\n      text \"Ripe — cash out for a lump sum or let it mature further.\" muted size=small\r\n      footer:\r\n        button \"Sell\"\r\n        button \"Harvest\" primary accent=success"
  },
  "26-named-icons": {
    "id": "26-named-icons",
    "file": "26-named-icons.wireloom",
    "title": "26-named-icons — Named Icons",
    "code": "window \"Icon Library\":\r\n  section \"Economy\":\r\n    row:\r\n      icon name=\"credits\"\r\n      icon name=\"credits\" accent=wealth\r\n      icon name=\"industry\" accent=industry\r\n      icon name=\"research\" accent=research\r\n  section \"Military\":\r\n    row:\r\n      icon name=\"military\" accent=military\r\n      icon name=\"ship\"\r\n      icon name=\"warning\" accent=warning\r\n      icon name=\"warning\" accent=danger\r\n  section \"Governance\":\r\n    row:\r\n      icon name=\"authority\"\r\n      icon name=\"policy\"\r\n      icon name=\"leader\"\r\n      icon name=\"approval\" accent=approval\r\n  section \"Tech\":\r\n    row:\r\n      icon name=\"tech\"\r\n      icon name=\"computation\" accent=research\r\n      icon name=\"gear\"\r\n      icon name=\"planet\"\r\n  section \"UI chrome\":\r\n    row:\r\n      icon name=\"lock\"\r\n      icon name=\"check\" accent=success\r\n      icon name=\"star\"\r\n      icon name=\"plus\""
  },
  "27-annotations": {
    "id": "27-annotations",
    "file": "27-annotations.wireloom",
    "title": "27-annotations — Annotations",
    "code": "# User-manual-style annotations: a box with a leader line pointing at\r\n# a specific element in the mockup. Every `annotation` must specify a\r\n# `position=` side (left/right/top/bottom) — there is no default.\r\n\r\nwindow \"Sign in\":\r\n  header:\r\n    text \"Welcome back\" id=\"welcome\"\r\n  panel id=\"credentials\":\r\n    input placeholder=\"Email\" type=email id=\"email-field\"\r\n    input placeholder=\"Password\" type=password id=\"pw-field\"\r\n    button \"Sign in\" primary id=\"signin-btn\"\r\n  footer:\r\n    text \"Forgot your password?\" id=\"forgot-link\"\r\n\r\nannotation \"Greeting — changes to the user's name after first sign-in\" target=\"welcome\" position=top\r\nannotation \"Email must be verified before sign-in is enabled\" target=\"email-field\" position=right\r\nannotation \"Password field — masked by default\" target=\"pw-field\" position=right\r\nannotation \"Primary action.\\nDisabled until both fields are valid.\" target=\"signin-btn\" position=right\r\nannotation \"Recovery flow — sends a reset link via email\" target=\"forgot-link\" position=bottom"
  },
  "28-file-explorer": {
    "id": "28-file-explorer",
    "file": "28-file-explorer.wireloom",
    "title": "28-file-explorer — File Explorer",
    "code": "window \"Files\":\r\n  menubar:\r\n    menu \"File\":\r\n      menuitem \"New Folder\" shortcut=\"Ctrl+N\"\r\n      menuitem \"Open\" shortcut=\"Ctrl+O\"\r\n      separator\r\n      menuitem \"Quit\" shortcut=\"Ctrl+Q\"\r\n    menu \"Edit\":\r\n      menuitem \"Cut\" shortcut=\"Ctrl+X\"\r\n      menuitem \"Copy\" shortcut=\"Ctrl+C\"\r\n      menuitem \"Paste\" shortcut=\"Ctrl+V\"\r\n      separator\r\n      menuitem \"Delete\" disabled\r\n    menu \"View\":\r\n      menuitem \"Refresh\" shortcut=\"F5\"\r\n    menu \"Help\":\r\n      menuitem \"About\"\r\n\r\n  breadcrumb:\r\n    crumb \"This PC\" icon=\"authority\"\r\n    crumb \"Projects\"\r\n    crumb \"wireloom\"\r\n    crumb \"src\"\r\n\r\n  row:\r\n    col 200:\r\n      tree:\r\n        node \"wireloom\" icon=\"policy\":\r\n          node \"src\" selected:\r\n            node \"parser\":\r\n              node \"ast.ts\"\r\n              node \"lexer.ts\"\r\n              node \"parser.ts\"\r\n            node \"renderer\":\r\n              node \"layout.ts\"\r\n              node \"svg.ts\"\r\n              node \"themes.ts\"\r\n          node \"test\" collapsed:\r\n            node \"parser\"\r\n            node \"renderer\"\r\n          node \"examples\"\r\n          node \"README.md\"\r\n          node \"package.json\"\r\n\r\n    col fill:\r\n      panel:\r\n        row:\r\n          text \"parser.ts\" weight=semibold\r\n          text \"1,460 lines\" size=small muted\r\n        divider\r\n        text \"Recursive-descent parser producing a Document AST.\"\r\n        text \"Throws WireloomError with source position on failure.\" size=small muted"
  },
  "29-settings-controls": {
    "id": "29-settings-controls",
    "file": "29-settings-controls.wireloom",
    "title": "29-settings-controls — Settings Controls",
    "code": "window \"Settings\":\r\n  tabs:\r\n    tab \"General\" active\r\n    tab \"Appearance\"\r\n    tab \"Advanced\"\r\n\r\n  section \"Appearance\":\r\n    radio \"Light\" group=\"theme\" label-right\r\n    radio \"Dark\" group=\"theme\" selected label-right\r\n    radio \"System\" group=\"theme\" label-right\r\n\r\n  section \"Notifications\":\r\n    toggle \"Enable desktop notifications\" on\r\n    toggle \"Play sound on new message\" off\r\n    toggle \"Vibrate\" off disabled\r\n\r\n  section \"Privacy\":\r\n    checkbox \"Share anonymous usage data\" label-right\r\n    checkbox \"Allow crash reports\" checked label-right\r\n    checkbox \"Show online status to contacts\" checked label-right\r\n\r\n  footer:\r\n    button \"Cancel\"\r\n    button \"Apply\" primary"
  },
  "30-status-and-chips": {
    "id": "30-status-and-chips",
    "file": "30-status-and-chips.wireloom",
    "title": "30-status-and-chips — Status And Chips",
    "code": "window \"Dashboard\":\r\n  header:\r\n    row:\r\n      text \"Project Atlas\" weight=bold size=large\r\n      status \"Live\" kind=success\r\n\r\n  section \"Filters\":\r\n    row:\r\n      chip \"Active\" selected\r\n      chip \"Archived\"\r\n      chip \"Shared\" closable\r\n      chip \"Starred\" icon=\"star\" accent=warning\r\n\r\n  section \"Team\":\r\n    row:\r\n      avatar \"BW\" size=medium accent=research\r\n      avatar \"JD\" size=medium accent=military\r\n      avatar \"KM\" size=medium accent=wealth\r\n      avatar \"AL\" size=medium\r\n\r\n  section \"Recent activity\":\r\n    row:\r\n      status \"Deployed\" kind=success\r\n      text \"production · 2m ago\" size=small muted\r\n    row:\r\n      status \"Backup running\" kind=info\r\n      text \"nightly · started 14:02\" size=small muted\r\n    row:\r\n      status \"Disk 82%\" kind=warning\r\n      text \"db-primary\" size=small muted\r\n    row:\r\n      status \"Build failed\" kind=error\r\n      text \"ci #1042\" size=small muted\r\n    row:\r\n      spinner \"Syncing index…\"\r\n      text \"est. 4 min\" size=small muted"
  },
  "31-spacer-and-justify": {
    "id": "31-spacer-and-justify",
    "file": "31-spacer-and-justify.wireloom",
    "title": "31-spacer-and-justify — Spacer And Justify",
    "code": "window \"Spacer and Justify\":\r\n  section \"Dialog footer — spacer\":\r\n    row:\r\n      button \"Cancel\"\r\n      spacer\r\n      button \"Done\" primary\r\n  section \"justify=between\":\r\n    row justify=between:\r\n      text \"A\"\r\n      text \"B\"\r\n      text \"C\"\r\n  section \"justify=around\":\r\n    row justify=around:\r\n      text \"A\"\r\n      text \"B\"\r\n      text \"C\"\r\n  section \"justify=end\":\r\n    row justify=end:\r\n      button \"One\"\r\n      button \"Two\""
  },
  "32-navbar": {
    "id": "32-navbar",
    "file": "32-navbar.wireloom",
    "title": "32-navbar — Navbar",
    "code": "window \"Mobile Inbox\":\r\n  navbar:\r\n    leading:\r\n      button \"Back\"\r\n    trailing:\r\n      button \"Edit\"\r\n      button \"New\" primary\r\n  panel:\r\n    text \"Three unread messages.\"\r\n    list:\r\n      item \"Wren — spacer landed\"\r\n      item \"Tobin — back button on track\"\r\n      item \"Nyx — annotations refresh\""
  },
  "33-backbutton-and-large-header": {
    "id": "33-backbutton-and-large-header",
    "file": "33-backbutton-and-large-header.wireloom",
    "title": "33-backbutton-and-large-header — Backbutton And Large Header",
    "code": "# `backbutton` renders as a path-drawn chevron + parent label; it's legal\r\n# anywhere a button is. `header large:` turns the header band into a\r\n# prominent large-title header (the big bold title row used in Notes, Mail,\r\n# Settings on iOS; the oversized toolbar title on Android).\r\n\r\nwindow:\r\n  header large:\r\n    text \"Q2 Review\"\r\n\r\n  row:\r\n    backbutton \"Notes\"\r\n    backbutton \"Reports\" disabled\r\n\r\n  panel:\r\n    text \"Tap a parent to navigate back.\" muted\r\n\r\n  footer:\r\n    button \"Share\"\r\n    button \"Done\" primary"
  },
  "34-tabbar": {
    "id": "34-tabbar",
    "file": "34-tabbar.wireloom",
    "title": "34-tabbar — Tabbar",
    "code": "# Mobile `tabbar` — the docked bottom chrome band with primary navigation\r\n# tabs. Each `tabitem` is an icon + label column; one is usually `selected`\r\n# (current screen) and another may carry a `badge` (unread count, alerts).\r\n# `tabbar` is mutually exclusive with `footer` in the same `window`.\r\n\r\nwindow \"Explorer\":\r\n  header:\r\n    text \"Inbox\" weight=bold size=large\r\n\r\n  panel:\r\n    text \"3 new messages since last login.\" muted\r\n\r\n  list:\r\n    item \"Welcome\"\r\n    item \"Quarterly report\"\r\n    item \"Budget approval\"\r\n\r\n  tabbar:\r\n    tabitem \"Home\" icon=\"planet\" selected\r\n    tabitem \"Inbox\" icon=\"policy\" badge=\"3\"\r\n    tabitem \"Settings\" icon=\"gear\""
  },
  "35-tabbar-five-tabs": {
    "id": "35-tabbar-five-tabs",
    "file": "35-tabbar-five-tabs.wireloom",
    "title": "35-tabbar-five-tabs — Tabbar Five Tabs",
    "code": "# 5-tab bar exercise — proves label spacing holds up under crowding and\r\n# that unknown icon names (`zzz-not-real`) fall back to the boxed first\r\n# letter glyph instead of dropping the tab silently.\r\n\r\nwindow:\r\n  panel:\r\n    text \"Wide tab bar stress test\" weight=bold\r\n\r\n  tabbar:\r\n    tabitem \"Home\" icon=\"planet\"\r\n    tabitem \"Search\" icon=\"research\"\r\n    tabitem \"Post\" icon=\"zzz-not-real\"\r\n    tabitem \"Alerts\" icon=\"warning\" badge=\"12\"\r\n    tabitem \"Me\" icon=\"leader\" selected"
  },
  "36-bottom-sheet": {
    "id": "36-bottom-sheet",
    "file": "36-bottom-sheet.wireloom",
    "title": "36-bottom-sheet — Bottom Sheet",
    "code": "window \"Photos\":\r\n  header:\r\n    row:\r\n      text \"Vacation 2026\" weight=bold size=large\r\n  row:\r\n    image label=\"beach\"\r\n    image label=\"mountain\"\r\n  sheet title=\"Share\":\r\n    list:\r\n      item \"Messages\"\r\n      item \"Mail\"\r\n      item \"AirDrop\"\r\n      item \"Copy link\"\r\n    row justify=end:\r\n      button \"Cancel\""
  },
  "37-center-sheet": {
    "id": "37-center-sheet",
    "file": "37-center-sheet.wireloom",
    "title": "37-center-sheet — Center Sheet",
    "code": "window \"Documents\":\r\n  header:\r\n    text \"Budget 2026.xlsx\" weight=bold\r\n  row:\r\n    text \"Last modified 2 hours ago\" muted\r\n  sheet position=center title=\"Delete file?\":\r\n    text \"This action cannot be undone. The file will be moved to Trash.\"\r\n    row justify=end:\r\n      button \"Cancel\"\r\n      button \"Delete\" primary accent=danger"
  },
  "38-disclosure-chevron": {
    "id": "38-disclosure-chevron",
    "file": "38-disclosure-chevron.wireloom",
    "title": "38-disclosure-chevron — Disclosure Chevron",
    "code": "window \"Settings\":\r\n  section \"Account\":\r\n    list:\r\n      item \"Profile\" chevron\r\n      item \"Password\"\r\n      item \"Privacy\" chevron\r\n  section \"Subscriptions\":\r\n    list:\r\n      slot \"Billing\" chevron:\r\n        text \"Visa •••• 4242\"\r\n        text \"Renews Jan 1\" muted\r\n      slot \"Plan\":\r\n        text \"Pro\"\r\n        text \"50 GB included\" muted\r\n      slot \"Data export\" active chevron:\r\n        text \"Download your account data\""
  },
  "39-segmented-control": {
    "id": "39-segmented-control",
    "file": "39-segmented-control.wireloom",
    "title": "39-segmented-control — Segmented Control",
    "code": "window \"Calendar\":\r\n  panel:\r\n    text \"Scope\" muted\r\n    segmented:\r\n      segment \"Day\"\r\n      segment \"Week\" selected\r\n      segment \"Month\"\r\n      segment \"Year\"\r\n  panel:\r\n    text \"Filter\" muted\r\n    segmented:\r\n      segment \"All\"\r\n      segment \"Unread\" selected\r\n      segment \"Flagged\" disabled"
  },
  "40-polarity-and-inline-icons": {
    "id": "40-polarity-and-inline-icons",
    "file": "40-polarity-and-inline-icons.wireloom",
    "title": "40-polarity-and-inline-icons — Polarity And Inline Icons",
    "code": "window \"Planet — Earth\":\r\n  header:\r\n    text \"Earth — Class 28\" bold size=large\r\n  section \"Modifier list\":\r\n    kv \"Approval\" \"+15%\" icon=\"approval\" accent=success\r\n    kv \"Industry\"  \"+10%\" icon=\"industry\" accent=success\r\n    kv \"Crime\"     \"Low\"  icon=\"warning\"  accent=success\r\n    kv \"Loyalty\"   \"-10%\" icon=\"approval\" accent=danger\r\n    kv \"Research\"  \"-5%\"  icon=\"research\" accent=warning\r\n  section \"Quick stats\":\r\n    stats:\r\n      stat \"GDP\"     \"+12%\" icon=\"industry\" accent=success\r\n      stat \"POP\"     \"1.2B\" icon=\"leader\"\r\n      stat \"MIL\"     \"Strong\" icon=\"military\" accent=success\r\n      stat \"TECH\"    \"T7\"   icon=\"tech\"\r\n  row:\r\n    button \"\" icon=\"plus\"\r\n    button \"Search\" icon=\"search\"\r\n    spacer\r\n    button \"Recall fleet\" icon=\"ship\" accent=danger\r\n    button \"Govern\" primary icon=\"authority\"\r\n  text \"Status: Surplus\"   accent=success\r\n  text \"Status: Unrest\"    accent=danger\r\n  text \"Status: Inspecting\" accent=warning"
  },
  "41-simple-table": {
    "id": "41-simple-table",
    "file": "41-simple-table.wireloom",
    "title": "41-simple-table — Simple Table",
    "code": "window \"Pricing Plans\":\n  header:\n    text \"Subscription Tiers\" bold size=large\n\n  table striped bordered:\n    columns:\n      column \"Plan\" align=left w=120\n      column \"Users\" align=center w=80\n      column \"Storage\" align=center w=100\n      column \"Price\" align=right w=100\n    tr:\n      td \"Starter\"\n      td \"1\"\n      td \"10 GB\"\n      td \"Free\"\n    tr:\n      td \"Team\"\n      td \"Up to 10\"\n      td \"500 GB\"\n      td \"$29/mo\"\n    tr:\n      td \"Enterprise\"\n      td \"Unlimited\"\n      td \"5 TB\"\n      td \"$199/mo\"\n    foot:\n      td \"Annual Billing saves 20%\" span=4 align=center\n\n  footer:\n    button \"Contact Sales\"\n    button \"Get Started\" primary"
  },
  "42-data-grid": {
    "id": "42-data-grid",
    "file": "42-data-grid.wireloom",
    "title": "42-data-grid — Data Grid",
    "code": "window \"Order History\":\n  row:\n    input placeholder=\"Search orders...\"\n    spacer\n    button \"Export\" icon=\"policy\"\n    button \"New Order\" primary\n\n  table striped:\n    columns:\n      column \"Order #\" align=left w=90\n      column \"Customer\" align=left w=140\n      column \"Status\" align=center w=100\n      column \"Items\" align=right w=60\n      column \"Total\" align=right w=90\n    tr:\n      td \"ORD-9421\"\n      td \"Acme Corp\"\n      status \"Shipped\" kind=success\n      td \"8\"\n      td \"$1,420.00\"\n    tr:\n      td \"ORD-9422\"\n      td \"Cyberdyne Systems\"\n      status \"Processing\" kind=info\n      td \"3\"\n      td \"$450.50\"\n    tr:\n      td \"ORD-9423\"\n      td \"Wayne Enterprises\"\n      status \"Delayed\" kind=warning\n      td \"12\"\n      td \"$3,890.00\"\n    tr:\n      td \"ORD-9424\"\n      td \"Stark Industries\"\n      status \"Cancelled\" kind=error\n      td \"1\"\n      td \"$120.00\"\n    foot:\n      td \"Total Active\" span=3\n      td \"24\"\n      td \"$5,880.50\""
  },
  "43-matrix-view": {
    "id": "43-matrix-view",
    "file": "43-matrix-view.wireloom",
    "title": "43-matrix-view — Matrix View",
    "code": "window \"Feature Comparison Matrix\":\n  header:\n    text \"Plan Features & Capabilities\" bold\n\n  table compact bordered:\n    columns:\n      column \"Feature\" align=left w=180\n      column \"Free\" align=center w=70\n      column \"Pro\" align=center w=70\n      column \"Enterprise\" align=center w=90\n    tr:\n      td \"Multi-user collaboration\"\n      icon name=\"minus\"\n      icon name=\"check\" accent=success\n      icon name=\"check\" accent=success\n    tr:\n      td \"Custom domains\"\n      icon name=\"minus\"\n      icon name=\"check\" accent=success\n      icon name=\"check\" accent=success\n    tr:\n      td \"SSO / SAML 2.0\"\n      icon name=\"minus\"\n      icon name=\"minus\"\n      icon name=\"check\" accent=success\n    tr:\n      td \"Dedicated support manager\"\n      icon name=\"minus\"\n      icon name=\"minus\"\n      icon name=\"check\" accent=success\n    tr:\n      td \"Uptime SLA\"\n      td \"99.0%\"\n      td \"99.9%\"\n      td \"99.99%\"\n    foot:\n      td \"Contact support for custom feature requests\" span=4 align=center"
  },
  "44-developer-dashboard": {
    "id": "44-developer-dashboard",
    "file": "44-developer-dashboard.wireloom",
    "title": "44-developer-dashboard — Developer Dashboard",
    "code": "window \"API Explorer & Inspector\":\n  header:\n    row:\n      text \"GET /api/v2/deployments\" bold\n      spacer\n      chip \"Cmd+K\" variant=kbd\n      button \"Send Request\" primary\n\n  tabs:\n    tab \"Response\" active:\n      code lang=\"json\" lines:\n        text \"{\"\n        text \"  \\\"status\\\": \\\"healthy\\\",\"\n        text \"  \\\"version\\\": \\\"v0.8.2\\\",\"\n        text \"  \\\"nodes\\\": 12\"\n        text \"}\"\n    tab \"Headers\":\n      panel:\n        text \"Authorization: Bearer <token>\"\n        text \"Content-Type: application/json\"\n    tab \"History\":\n      table striped compact:\n        columns:\n          column \"Time\" w=70\n          column \"Method\" w=70\n          column \"Status\" w=80\n        tr:\n          td \"12:04:02\"\n          td \"GET\"\n          status \"200 OK\" kind=success\n        tr:\n          td \"12:01:15\"\n          td \"POST\"\n          status \"201 Created\" kind=success\n\n  footer:\n    row:\n      status \"Connected\" kind=success\n      divider orientation=vertical\n      text \"Latency: 42ms\" muted\n      spacer\n      button \"Clear Console\""
  },
  "45-macros-reusable-components": {
    "id": "45-macros-reusable-components",
    "file": "45-macros-reusable-components.wireloom",
    "title": "45-macros-reusable-components — Macros Reusable Components",
    "code": "define @StatCard:\n  panel:\n    row:\n      text \"$label\" muted\n      spacer\n      icon name=\"star\" accent=warning\n    text \"$value\" bold size=large\n    text \"$change\" accent=success\n\ndefine @ActionCard:\n  panel:\n    text \"$title\" bold\n    text \"$desc\"\n    row justify=end:\n      button \"Configure\"\n\nwindow \"System Overview\":\n  header:\n    text \"Cluster Analytics\" bold size=large\n\n  row:\n    use @StatCard label=\"Total Requests\" value=\"1.4M\" change=\"+18% vs last week\"\n    use @StatCard label=\"Avg Response\" value=\"84ms\" change=\"-12ms improvement\"\n\n  section \"Quick Actions\":\n    row:\n      use @ActionCard title=\"Backup Database\" desc=\"Snapshot current production state.\"\n      use @ActionCard title=\"Deploy Cluster\" desc=\"Roll out new container nodes.\"\n\n  footer:\n    button \"Refresh Dashboard\" primary"
  },
  "46-cloud-observability-hub": {
    "id": "46-cloud-observability-hub",
    "file": "46-cloud-observability-hub.wireloom",
    "title": "46-cloud-observability-hub — Cloud Observability Hub",
    "code": "define @MetricCard:\n  panel:\n    row:\n      icon name=\"$icon\" accent=$accent\n      spacer\n      text \"$trend\" accent=$accent\n    text \"$title\" muted\n    text \"$value\" bold size=large\n\ndefine @ActionCard:\n  panel:\n    row:\n      text \"$name\" bold\n      spacer\n      status \"$status\" kind=$kind\n    text \"$desc\" muted\n    row justify=end:\n      button \"$action\"\n\nwindow \"Cloud Platform & Cluster Observability\":\n  header:\n    row:\n      text \"Production Cluster: eu-central-1\" bold size=large\n      spacer\n      chip \"Cmd+K\" variant=kbd\n      divider orientation=vertical\n      button \"Deploy Service\" primary\n\n  row:\n    use @MetricCard title=\"Total QPS\" value=\"142.8k\" trend=\"+14% /hr\" icon=\"star\" accent=success\n    use @MetricCard title=\"Avg Latency\" value=\"18.4ms\" trend=\"-2.1ms\" icon=\"gear\" accent=research\n    use @MetricCard title=\"Error Rate\" value=\"0.04%\" trend=\"Optimal\" icon=\"check\" accent=approval\n    use @MetricCard title=\"Memory Usage\" value=\"84.2%\" trend=\"Warning\" icon=\"warning\" accent=warning\n\n  tabs:\n    tab \"Active Services\" active:\n      table striped compact:\n        columns:\n          column \"Service Name\" w=160 align=left\n          column \"Health Status\" w=120 align=center\n          column \"P99 Latency\" w=100 align=right\n          column \"Throughput\" w=100 align=right\n          column \"Runtime\" w=90 align=center\n        tr:\n          td \"auth-service\"\n          status \"Healthy\" kind=success\n          td \"12ms\"\n          td \"48.2k\"\n          chip \"Go\" variant=kbd\n        tr:\n          td \"billing-api\"\n          status \"Healthy\" kind=success\n          td \"24ms\"\n          td \"12.1k\"\n          chip \"Rust\" variant=kbd\n        tr:\n          td \"search-indexer\"\n          status \"Degraded\" kind=warning\n          td \"184ms\"\n          td \"32.0k\"\n          chip \"Java\" variant=kbd\n        tr:\n          td \"notification-hub\"\n          status \"Healthy\" kind=success\n          td \"9ms\"\n          td \"50.5k\"\n          chip \"Node\" variant=kbd\n        foot:\n          td \"4 Services Running (99.98% SLA)\" span=3 align=left\n          td \"142.8k req/s\" span=2 align=right\n\n    tab \"Config & Manifest\":\n      code lang=\"yaml\" lines:\n        text \"apiVersion: apps/v1\"\n        text \"kind: Deployment\"\n        text \"metadata:\"\n        text \"  name: cluster-ingress-v2\"\n        text \"spec:\"\n        text \"  replicas: 8\"\n        text \"  strategy:\"\n        text \"    type: RollingUpdate\"\n\n    tab \"Maintenance & Ops\":\n      row:\n        use @ActionCard name=\"DB Failover\" status=\"Standby\" kind=info desc=\"Switch active primary replica.\" action=\"Initiate\"\n        use @ActionCard name=\"Cache Purge\" status=\"Ready\" kind=success desc=\"Evict distributed Redis keys.\" action=\"Flush All\"\n\n  footer:\n    row:\n      status \"Cluster Healthy\" kind=success\n      divider orientation=vertical\n      text \"Nodes: 16/16 Active\" muted\n      divider orientation=vertical\n      text \"Region: Frankfurt\" muted\n      spacer\n      button \"Refresh Metrics\"\n      button \"Export Report\""
  }
};
