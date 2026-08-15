import { Project, SyntaxKind, VariableDeclaration, CallExpression, ArrowFunction } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/store/useAccountingStore.ts');

const useAccountingStoreVar = sourceFile.getVariableDeclaration('useAccountingStore');
if (!useAccountingStoreVar) throw new Error("useAccountingStore not found");

const initializer = useAccountingStoreVar.getInitializerIfKindOrThrow(SyntaxKind.ArrowFunction);
const body = initializer.getBody();
if (!body) throw new Error("Body not found");

// Extract all variable declarations inside the hook
const varDecls: VariableDeclaration[] = [];
body.getDescendantsOfKind(SyntaxKind.VariableDeclaration).forEach(decl => {
    // Only get top-level declarations inside the hook
    if (decl.getParent().getParent().getParent() === body) {
        varDecls.push(decl);
    }
});

const modules = {
    SalesStore: ['Invoice', 'CreditNote', 'sales'],
    PurchasingStore: ['Bill', 'Expense', 'Payment', 'purchase'],
    InventoryStore: ['Product', 'Inventory', 'Warehouse', 'Cost'],
    HRStore: ['Payroll', 'Attendance', 'Loan', 'User', 'Employee', 'Role', 'Salary', 'Holiday', 'Commission'],
    CRMStore: ['Contact', 'Partner'],
    SettingsStore: ['Brand', 'Category', 'Email', 'Config', 'Task', 'Company'],
    AccountingCoreStore: ['Account', 'Journal', 'Ledger', 'Balance', 'Entry', 'entries']
};

const extractedModules: Record<string, VariableDeclaration[]> = {};
for (const key of Object.keys(modules)) extractedModules[key] = [];

let unassigned: VariableDeclaration[] = [];

varDecls.forEach(decl => {
    const name = decl.getName();
    let assigned = false;
    
    let searchName = name;
    if (name.startsWith('[')) {
        searchName = decl.getText().split('=')[0]; // e.g. [invoices, setInvoices]
    }

    for (const [modName, keywords] of Object.entries(modules)) {
        if (keywords.some(kw => searchName.toLowerCase().includes(kw.toLowerCase()))) {
            extractedModules[modName].push(decl);
            assigned = true;
            break;
        }
    }
    
    if (!assigned) {
        unassigned.push(decl);
    }
});

const modulesDir = path.join(process.cwd(), 'src/store/modules');
if (!fs.existsSync(modulesDir)) {
    fs.mkdirSync(modulesDir, { recursive: true });
}

for (const [modName, decls] of Object.entries(extractedModules)) {
    if (decls.length === 0) continue;
    
    let storeContent = `import { create } from 'zustand';\nimport { supabase } from '../../lib/supabase';\nimport * as Types from '../../types/index';\n\n`;
    
    storeContent += `export const use${modName} = create<any>((set, get) => ({\n`;
    
    decls.forEach(decl => {
        const name = decl.getName();
        const init = decl.getInitializer();

        if (init && init.getKind() === SyntaxKind.CallExpression) {
            const callExpr = init as CallExpression;
            const functionName = callExpr.getExpression().getText();

            if (functionName === 'useState' || functionName.includes('useState')) {
                const stateVars = decl.getText().split('=')[0].replace('[', '').replace(']', '').split(',').map(s => s.trim());
                if (stateVars.length >= 2) {
                    const stateVar = stateVars[0];
                    const setter = stateVars[1];
                    const initVal = callExpr.getArguments()[0]?.getText() || 'null';
                    
                    storeContent += `  ${stateVar}: ${initVal},\n`;
                    storeContent += `  ${setter}: (val: any) => set((state: any) => ({ ${stateVar}: typeof val === 'function' ? val(state.${stateVar}) : val })),\n`;
                    return;
                }
            }
            
            if (functionName === 'useDocumentState' || functionName.includes('useDocumentState')) {
                const stateVars = decl.getText().split('=')[0].replace('[', '').replace(']', '').split(',').map(s => s.trim());
                if (stateVars.length >= 3) {
                    const stateVar = stateVars[0];
                    const setter = stateVars[1];
                    const localSetter = stateVars[2];
                    const initVal = callExpr.getArguments()[0]?.getText() || '[]';
                    
                    storeContent += `  ${stateVar}: ${initVal},\n`;
                    storeContent += `  ${setter}: (val: any) => set((state: any) => ({ ${stateVar}: typeof val === 'function' ? val(state.${stateVar}) : val })),\n`;
                    storeContent += `  ${localSetter}: (val: any) => set((state: any) => ({ ${stateVar}: typeof val === 'function' ? val(state.${stateVar}) : val })),\n`;
                    return;
                }
            }

            if (functionName === 'useCallback') {
                const arrowFunc = callExpr.getArguments()[0];
                if (arrowFunc && arrowFunc.getKind() === SyntaxKind.ArrowFunction) {
                    const arrow = arrowFunc as ArrowFunction;
                    const isAsync = arrow.isAsync() ? 'async ' : '';
                    const params = arrow.getParameters().map(p => p.getText()).join(', ');
                    const bodyText = arrow.getBodyText() || '';
                    
                    storeContent += `  ${name}: ${isAsync}(${params}) => { \n    const state = get();\n    ${bodyText.replace(/\n/g, '\n    ')} \n  },\n`;
                    return;
                }
            }
            
            if (functionName === 'useMemo') {
                const arrowFunc = callExpr.getArguments()[0];
                if (arrowFunc && arrowFunc.getKind() === SyntaxKind.ArrowFunction) {
                    const arrow = arrowFunc as ArrowFunction;
                    const bodyText = arrow.getBodyText() || arrow.getBody().getText() || '';
                    // For Zustand, memos can just be functions that take no args or we just put the raw value if it's evaluated later.
                    // For now, convert to a getter function.
                    storeContent += `  get_${name}: () => { \n    const state = get();\n    return ${bodyText}; \n  },\n`;
                    return;
                }
            }
        }
        
        // Fallback for simple values
        if (!name.includes('[')) {
             storeContent += `  // TODO: Fix fallback\n  // ${name}: ${init ? init.getText() : 'null'},\n`;
        }
    });
    
    storeContent += `}));\n`;
    
    fs.writeFileSync(path.join(modulesDir, `use${modName}.ts`), storeContent);
    console.log(`Generated ${modName} with ${decls.length} declarations.`);
}
