import { parse } from './src/parser/index.ts';
import { layout } from './src/renderer/layout.ts';
import { DEFAULT_THEME } from './src/renderer/themes.ts';

const src = `window:
  navbar:
    leading:
      backbutton "Anmelden"
    trailing:
      button "Hilfe"
  panel:
    text "Code eingeben" bold size=large
    text "Aus deiner Authenticator-App." muted size=small
    row gap=6 justify=center:
      input placeholder="0" type=text w=44 h=52
      input placeholder="0" type=text w=44 h=52
      input placeholder="0" type=text w=44 h=52
      input placeholder="0" type=text w=44 h=52
      input placeholder="0" type=text w=44 h=52
      input placeholder="0" type=text w=44 h=52
    row justify=between align=center:
      text "Neuer Code in 0:27" muted size=small
      spinner "Prüfe…"
  section "Alternativen":
    list:
      item "SMS an ••• 42" chevron
      item "Wiederherstellungscode" chevron
  footer:
    row:
      spacer
      button "Bestätigen" primary accent=success`;

const doc = parse(src);
const laid = layout(doc, DEFAULT_THEME);
console.log('Current Layout Size: width =', laid.canvasWidth, 'px, height =', laid.canvasHeight, 'px');
