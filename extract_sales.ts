import { Project, SyntaxKind } from 'ts-morph';
import * as fs from 'fs';

const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/store/useAccountingStore.ts');
const hook = sourceFile.getVariableDeclaration('useAccountingStore')?.getInitializerIfKindOrThrow(SyntaxKind.ArrowFunction);
if (!hook) throw new Error("Hook not found");
const body = hook.getBody();

const targetVars = [
    'allInvoices', 'paginatedInvoices', 'invoiceCount', 'isInvoicesLoading',
    'allCreditNotes', 'fetchInvoices', 'invoices', 'creditNotes',
    'deleteInvoice', 'deleteCreditNote', 'resetCreditNoteToDraft',
    'addInvoice', 'postInvoice', 'resetInvoiceToDraft', 'updateInvoice', 'payInvoice',
    'applyCreditToInvoice', 'addCreditNote', 'updateCreditNote', 'postCreditNote'
];

let output = '';
body.getDescendantsOfKind(SyntaxKind.VariableDeclaration).forEach(decl => {
    if (decl.getParent().getParent().getParent() === body) {
        let name = decl.getName();
        if (name.startsWith('[')) name = decl.getText().split('=')[0].trim();
        
        if (targetVars.some(v => name.includes(v))) {
            output += decl.getText() + '\n\n';
        }
    }
});

fs.writeFileSync('sales_logic.txt', output);
console.log("Extracted sales logic");
