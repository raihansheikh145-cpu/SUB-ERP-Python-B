const fs = require('fs');
let code = fs.readFileSync('services/db.ts', 'utf8');
code = code.replace(
  /if \(\(\!rest\.messages \|\| rest\.messages\.length === 0\) && rest\.data && rest\.data\.messages\) \{/g,
  "if (rest.data && rest.data.messages) {"
);
fs.writeFileSync('services/db.ts', code);
console.log('patched');
