const fs = require('fs');
let code = fs.readFileSync('services/db.ts', 'utf8');

code = code.replace(/return \{\s*\.\.\.\(rest\.data \|\| \{\}\),\s*\.\.\.rest,/, 
`  if ((!rest.messages || rest.messages.length === 0) && rest.data && rest.data.messages) {
      rest.messages = rest.data.messages;
  }
  return {
    ...(rest.data || {}),
    ...rest,`);

fs.writeFileSync('services/db.ts', code);
console.log('Patched db.ts with regex');
