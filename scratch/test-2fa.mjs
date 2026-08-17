import { parse } from './src/parser/index.ts';
import { renderWireframe } from './src/renderer/index.ts';

const src = `window "2FA Verification":
  navbar:
    leading:
      backbutton "Anmelden"
    center:
      text "Sicherheitsprüfung" bold
    trailing:
      button "Hilfe"

  col 340 h=580:
    panel:
      row justify=center:
        icon name="lock" accent=research
      text "Code eingeben" bold size=large
      text "Öffne deine Authenticator-App und gib den 6-stelligen Sicherheitscode ein." muted size=small
      
      row gap=6 justify=center:
        input placeholder="8" type=text w=42 h=48
        input placeholder="4" type=text w=42 h=48
        input placeholder="2" type=text w=42 h=48
        input placeholder="9" type=text w=42 h=48
        input placeholder="0" type=text w=42 h=48
        input placeholder="1" type=text w=42 h=48

      row justify=between align=center:
        text "Neuer Code in 0:24" muted size=small
        status "Gültig" kind=success

    section "Andere Methoden":
      list:
        slot "SMS-Code anfordern" chevron:
          text "An •••• 8492 senden" muted size=small
        slot "Passkey / FIDO2" chevron:
          text "Face ID oder Sicherheitsschlüssel" muted size=small
        item "12-stelligen Backup-Code eingeben" chevron

    spacer

  footer:
    button "Bestätigen" primary accent=success w=100%
`;

try {
  const doc = parse(src);
  const svg = renderWireframe(doc);
  console.log("RENDER SUCCESS! SVG Length:", svg.length);
} catch (err) {
  console.error("PARSE ERROR:", err);
}
