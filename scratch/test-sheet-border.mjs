import wireloom from '../dist/index.js';

const source = `window:
  navbar:
    leading:
      button "Abbrechen"
    trailing:
      button "Hilfe"
  panel:
    text "Bestätigung" bold
    text "m.mustermann@acme.io"
  sheet:
    row justify=center:
      text "Andere Methode wählen" bold
    list:
      item "Security Key (WebAuthn)" chevron
      item "Authenticator-App" chevron
      item "SMS an •••• 4821" chevron
      item "Wiederherstellungscode" chevron
    row justify=end:
      button "Abbrechen"`;

// Let's test how it looks when window rect is painted last vs first
const res = await wireloom.render('test', source);

// Let's modify the SVG string so window rect is last and inspect
const svg = res.svg;
console.log('Original SVG ends with:', svg.slice(-200));
