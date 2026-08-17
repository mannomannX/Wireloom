import wireloom from '../dist/index.js';

const dsl = `window w=360 h=640:
  navbar:
    leading:
      backbutton "Anmelden"
    trailing:
      button "Hilfe"
  col 340 h=580:
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

const res = await wireloom.render('test', dsl);
const wMatch = res.svg.match(/width="([^"]+)"/);
const hMatch = res.svg.match(/height="([^"]+)"/);
console.log('SVG Dimensions:', wMatch?.[1], 'x', hMatch?.[1]);

