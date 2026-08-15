import { Project, SyntaxKind, VariableDeclaration } from 'ts-morph';
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
    Sales: ['Invoice', 'CreditNote', 'sales'],
    Purchasing: ['Bill', 'Expense', 'Payment', 'purchase'],
    Inventory: ['Product', 'Inventory', 'Warehouse', 'Cost'],
    HR: ['Payroll', 'Attendance', 'Loan', 'User', 'Employee', 'Role', 'Salary', 'Holiday', 'Commission'],
    CRM: ['Contact', 'Partner'],
    Settings: ['Brand', 'Category', 'Email', 'Config', 'Task', 'Company'],
    AccountingCore: ['Account', 'Journal', 'Ledger', 'Balance', 'Entry', 'entries']
};

const extractedModules: Record<string, string[]> = {};
for (const key of Object.keys(modules)) extractedModules[key] = [];

let unassigned: string[] = [];

varDecls.forEach(decl => {
    const name = decl.getName();
    let assigned = false;
    
    // Check if it's an array destructuring (like useState)
    let searchName = name;
    if (name.startsWith('[')) {
        searchName = decl.getText(); // e.g. [invoices, setInvoices]
    }

    for (const [modName, keywords] of Object.entries(modules)) {
        if (keywords.some(kw => searchName.toLowerCase().includes(kw.toLowerCase()))) {
            extractedModules[modName].push(decl.getText());
            assigned = true;
            break;
        }
    }
    
    if (!assigned) {
        unassigned.push(searchName);
    }
});

console.log("Unassigned variables:", unassigned.slice(0, 10), "...");

// Create modules directory
const modulesDir = path.join(process.cwd(), 'src/store/modules');
if (!fs.existsSync(modulesDir)) {
    fs.mkdirSync(modulesDir, { recursive: true });
}

// Generate Zustand Stores
for (const [modName, decls] of Object.entries(extractedModules)) {
    if (decls.length === 0) continue;
    
    let storeContent = `import { create } from 'zustand';\nimport { supabase } from '../../lib/supabase';\nimport * as Types from '../../types/index';\n\n`;
    
    storeContent += `export const use${modName}Store = create<any>((set, get) => ({\n`;
    
    decls.forEach(declText => {
        // Very basic transformation
        // Convert `const [var, setVar] = useState(init)` to `var: init, setVar: (val) => set({ var: val })`
        let transformed = declText;
        
        const useStateMatch = declText.match(/const \[(.*?),\s*(.*?)\]\s*=\s*(?:React\.)?useState(?:<.*?>)?\((.*?)\)/s);
        if (useStateMatch) {
            const [, stateVar, setter, initVal] = useStateMatch;
            storeContent += `  ${stateVar}: ${initVal || 'null'},\n`;
            storeContent += `  ${setter}: (val: any) => set((state: any) => ({ ${stateVar}: typeof val === 'function' ? val(state.${stateVar}) : val })),\n`;
            return;
        }
        
        const useDocMatch = declText.match(/const \[(.*?),\s*(.*?),\s*(.*?)\]\s*=\s*useDocumentState(?:<.*?>)?\((.*?),\s*'(.*?)'\)/s);
        if (useDocMatch) {
            const [, stateVar, setter, localSetter, initVal, table] = useDocMatch;
            storeContent += `  ${stateVar}: ${initVal || '[]'},\n`;
            storeContent += `  ${setter}: (val: any) => set((state: any) => ({ ${stateVar}: typeof val === 'function' ? val(state.${stateVar}) : val })),\n`;
            storeContent += `  ${localSetter}: (val: any) => set((state: any) => ({ ${stateVar}: typeof val === 'function' ? val(state.${stateVar}) : val })),\n`;
            return;
        }

        const useCallbackMatch = declText.match(/const (.*?)\s*=\s*useCallback\((.*?)\s*=>\s*\{(.*)\},\s*\[(.*?)\]\)/s);
        if (useCallbackMatch) {
            let [, funcName, args, body, deps] = useCallbackMatch;
            // Replace setVar(prev => ...) with get().setVar or direct set
            storeContent += `  ${funcName}: ${args} => { \n    const state = get();\n ${body} \n  },\n`;
            return;
        }
        
        // Generic fallback
        storeContent += `  // TODO: Fix manual migration\n  // ${declText.split('\\n')[0]}\n`;
    });
    
    storeContent += `}));\n`;
    
    fs.writeFileSync(path.join(modulesDir, `use${modName}Store.ts`), storeContent);
    console.log(`Generated ${modName} store with ${decls.length} declarations.`);
}
