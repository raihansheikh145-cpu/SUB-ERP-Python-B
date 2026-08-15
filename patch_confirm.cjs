const fs = require('fs');
let code = fs.readFileSync('components/InvoiceManager.tsx', 'utf8');

// Patch editingId block
const editingIdBlock = `          let finalInvoice: any = updatedInvoice || { ...existingInvoice, ...updates, id: editingId };

          if (post) {
              const confirmedMessages = [...(finalInvoice.messages || []), {
                 id: crypto.randomUUID(),
                 authorId: store.currentUser?.id || 'user-1',
                 body: 'Invoice Confirmed and Posted.',
                 date: new Date().toISOString(),
                 type: 'notification'
              }];
              const newlyUpdated = await store.updateInvoice(editingId, { messages: confirmedMessages });
              finalInvoice = newlyUpdated || { ...finalInvoice, messages: confirmedMessages };
              
              const returned = await store.postInvoice({ ...finalInvoice, status: 'DRAFT' });
              if (returned) { finalInvoice = returned; finalInvoice.status = 'POSTED'; }
          }`;

code = code.replace(
  /let finalInvoice: any = updatedInvoice \|\| \{ \.\.\.existingInvoice, \.\.\.updates, id: editingId \};\s*if \(post\) \{\s*const returned = await store\.postInvoice\(\{ \.\.\.finalInvoice, status: 'DRAFT' \}\);\s*if \(returned\) \{ finalInvoice = returned; finalInvoice\.status = 'POSTED'; \}\s*\}/,
  editingIdBlock
);

// Patch new invoice block
const newInvoiceBlock = `        let finalInvoice: any = newInvoice;

        if (post) {
          const confirmedMessages = [...(finalInvoice.messages || []), {
               id: crypto.randomUUID(),
               authorId: store.currentUser?.id || 'user-1',
               body: 'Invoice Confirmed and Posted.',
               date: new Date().toISOString(),
               type: 'notification'
          }];
          await store.updateInvoice(finalInvoice.id, { messages: confirmedMessages });
          finalInvoice.messages = confirmedMessages;
          
          const returned = await store.postInvoice(finalInvoice);
          if (returned) { finalInvoice = returned; finalInvoice.status = 'POSTED'; }
        }`;

code = code.replace(
  /let finalInvoice: any = newInvoice;\s*if \(post\) \{\s*const returned = await store\.postInvoice\(newInvoice\);\s*if \(returned\) \{ finalInvoice = returned; finalInvoice\.status = 'POSTED'; \}\s*\}/,
  newInvoiceBlock
);

fs.writeFileSync('components/InvoiceManager.tsx', code);
console.log('Patched InvoiceManager confirm logic');
