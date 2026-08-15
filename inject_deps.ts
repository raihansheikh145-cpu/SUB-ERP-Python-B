import * as fs from 'fs';
import * as path from 'path';

const dir = path.join(process.cwd(), 'src/store/modules');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

const imports = `
import { useAccountingCoreStore } from './useAccountingCoreStore';
import { useSettingsStore } from './useSettingsStore';
import { useCRMStore } from './useCRMStore';
import { useHRStore } from './useHRStore';
import { useInventoryStore } from './useInventoryStore';
import { usePurchasingStore } from './usePurchasingStore';
import { useSalesStore } from './useSalesStore';
import { formatDateTime, getOpDateBST } from '../../utils/constants';

// Shared utilities extracted from monolith
const fetchCacheMap = new Map<string, { isFetching: boolean; lastFetched: number }>();
const generalLedgerPromiseCache = new Map<string, Promise<any>>();
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
const withRetry = async <T>(fn: () => Promise<T>, maxAttempts = 3, delay = 1000): Promise<T> => {
    let lastError: any;
    for (let i = 0; i < maxAttempts; i++) {
        try { return await fn(); } catch (err: any) { lastError = err; if (i < maxAttempts - 1) await new Promise(r => setTimeout(r, delay * Math.pow(2, i))); }
    }
    throw lastError;
};
`;

const depsBlock = `
    const activeCompanyIds = useSettingsStore.getState().activeCompanyIds || [];
    const companies = useSettingsStore.getState().companies || [];
    const allContacts = useCRMStore.getState().allContacts || [];
    const setAllContacts = useCRMStore.getState().setAllContacts;
    const currentUser = useHRStore.getState().currentUser || { id: 'user-1' };
    const allAccounts = useAccountingCoreStore.getState().allAccounts || [];
    const setLocalOnlyEntries = useAccountingCoreStore.getState().setLocalOnlyEntries;
    const ensureEntitiesMetadata = useSettingsStore.getState().ensureEntitiesMetadata || (async () => {});
    const emailSettings = useSettingsStore.getState().emailSettings;
    const allCreditNotes = useSalesStore.getState().allCreditNotes || [];
    const setLocalOnlyCreditNotes = useSalesStore.getState().setLocalOnlyCreditNotes;
    const allProducts = useInventoryStore.getState().allProducts || [];
    const targetMode = useSettingsStore.getState().targetMode || 'VALUE';
    const mergedRoles = useHRStore.getState().mergedRoles || [];
    const allInvoices = useSalesStore.getState().allInvoices || [];
    const paginatedInvoices = useSalesStore.getState().paginatedInvoices || [];
`;

files.forEach(file => {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    
    // Add imports
    content = content.replace(/import \* as Types from '\.\.\/\.\.\/types\/index';/, "import * as Types from '../../types/index';" + imports);
    
    // Inject dependencies into every action (where we have `const state = get();`)
    content = content.replace(/const state = get\(\);/g, `const state = get();${depsBlock}`);
    
    fs.writeFileSync(p, content);
});

console.log("Injected dependencies to all stores.");
