const fs = require('fs');
let code = fs.readFileSync('store/useAccountingStore.ts', 'utf8');
code = code.replace(/contact\.id \|\| generateUUID\(\)/g, (match, offset, str) => {
  // If we are inside addContact, keep it
  const before = str.substring(Math.max(0, offset - 200), offset);
  if (before.includes('const addContact = useCallback(async (contact: any)') || before.includes('newContact: Contact = {')) {
    return match;
  }
  return 'generateUUID()';
});
fs.writeFileSync('store/useAccountingStore.ts', code);
console.log('Patched UUID');
