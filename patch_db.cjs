const fs = require('fs');
let code = fs.readFileSync('services/db.ts', 'utf8');

const target = `  const mappedNumber = rest.invoice_number || rest.bill_number || rest.payment_number || 
                       rest.credit_note_number || rest.cn_number || rest.loan_number;
  return {
    ...(rest.data || {}),
    ...rest,`;

const replacement = `  const mappedNumber = rest.invoice_number || rest.bill_number || rest.payment_number || 
                       rest.credit_note_number || rest.cn_number || rest.loan_number;

  // Prefer messages from data if top-level messages is empty or missing
  if ((!rest.messages || rest.messages.length === 0) && rest.data && rest.data.messages) {
      rest.messages = rest.data.messages;
  }

  return {
    ...(rest.data || {}),
    ...rest,`;

code = code.replace(target, replacement);
fs.writeFileSync('services/db.ts', code);
console.log('Patched db.ts');
