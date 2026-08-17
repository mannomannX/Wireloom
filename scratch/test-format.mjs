import wireloom from '../dist/index.js';

const messy = `window "Unformatted Mockup":
    header:
        row:
            text     "Title"      bold    size=large
            spacer
            button       "Action"       primary
    panel:
      text   "Line 1"
      text   "Line 2"
`;

const ast = wireloom.parse(messy);
const formatted = wireloom.serialize(ast);

console.log('--- BEFORE ---');
console.log(messy);
console.log('--- AFTER ---');
console.log(formatted);
