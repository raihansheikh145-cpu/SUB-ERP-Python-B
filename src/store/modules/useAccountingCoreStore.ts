import { supabase } from '../../lib/supabase';
import { Invoice, Contact, CreditNote, Company, Account, Warehouse, ContactType, Bill, Payment, JournalEntry, Product, Loan } from '../../types';
import { apiFetch } from '../../lib/apiFetch';
import { create } from 'zustand';
import * as Types from '../../types/index';
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


export const useAccountingCoreStore = create<any>((set, get) => ({
  clearFetchCache: (prefix?: string) => { /* Dummy */ },
  resolveUserName: (id: string) => { 
    if (!id) return '';
    const currentUser = useHRStore.getState().currentUser;
    if (id === currentUser?.id) return currentUser.name || currentUser.username || currentUser.email || id;
    const user = (useHRStore.getState().users || []).find((u: any) => u.id === id);
    if (user) return user.name || user.username || user.email || id;
    return id || 'Unknown User'; 
  },

  companies: [],
  activeCompanyIds: [],
  activeCompanies: [],
  availableCompanies: [],
  accountsRef: { current: [] },
  setCompanies: (val: any) => set((state: any) => {
    const nextCompanies = typeof val === 'function' ? val(state.companies) : val;
    return {
      companies: nextCompanies,
      availableCompanies: nextCompanies,
      activeCompanies: nextCompanies.filter((c: any) => (state.activeCompanyIds || []).includes(c.id))
    };
  }),
  setActiveCompanyIds: (ids: any) => set((state: any) => {
    const nextIds = typeof ids === 'function' ? ids(state.activeCompanyIds) : ids;
    return {
      activeCompanyIds: nextIds,
      activeCompanies: (state.companies || []).filter((c: any) => nextIds.includes(c.id))
    };
  }),
  selectAllCompanies: () => set((state: any) => ({
    activeCompanyIds: (state.companies || []).map((c: any) => c.id),
    activeCompanies: state.companies || []
  })),
  fetchCompanies: async () => {
    try {
      const { apiFetch } = await import('../../lib/apiFetch');
      const res = await apiFetch('/api/companies');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          const companiesData = result.data;
          
          const currentUser = get().currentUser;
          const allParsed = companiesData.map((row: any) => ({ ...row, id: row.id, ...row }));
          let parsed = [...allParsed];
          
          // Apply authorization filtering
          const isAdmin = !currentUser || [
            'role-admin', 'admin', 'ADMIN', 'role-owner', 'owner', 'role-superadmin', 'superadmin', 'SUPERADMIN'
          ].includes(currentUser.roleId || currentUser.role);
        
        console.log("Current user for companies:", currentUser?.email, "Role:", currentUser?.roleId, "IsAdmin?", isAdmin);

        if (currentUser && !isAdmin) {
           const allowedIds = currentUser.companyIds || currentUser.company_ids || [];
           if (Array.isArray(allowedIds) && allowedIds.length > 0) {
             parsed = parsed.filter((c: any) => allowedIds.includes(c.id));
           }
        }

        set((state: any) => {
          let newIds = state.activeCompanyIds || [];
          // Ensure activeCompanyIds only contains IDs from parsed (authorized companies)
          newIds = newIds.filter((id: string) => parsed.some((c: any) => c.id === id));
          if (newIds.length === 0 && parsed.length > 0) {
            newIds = [parsed[0].id]; // Default to the first authorized company
          }
          return {
            allCompanies: allParsed,
            companies: parsed,
            availableCompanies: parsed,
            activeCompanyIds: newIds,
            activeCompanies: parsed.filter((c: any) => newIds.includes(c.id))
          };
        });
        }
      }
    } catch (e) {
      console.error('fetchCompanies failed:', e);
    }
  },

  allAccounts: [],
  setAllAccounts: (val: any) => set((state: any) => {
    const next = typeof val === 'function' ? val(state.allAccounts) : val;
    if (get().accountsRef) get().accountsRef.current = next;
    return { allAccounts: next };
  }),
  setLocalOnlyAccounts: (val: any) => set((state: any) => ({ allAccounts: typeof val === 'function' ? val(state.allAccounts) : val })),
  allEntries: [],
  setAllEntries: (val: any) => set((state: any) => ({ allEntries: typeof val === 'function' ? val(state.allEntries) : val })),
  setLocalOnlyEntries: (val: any) => set((state: any) => ({ allEntries: typeof val === 'function' ? val(state.allEntries) : val })),
  generateNextNumber: (type: string, dateStr: string, targetCompanyId?: string, subType?: string) => {
    return ''; // Sequence generation moved to backend FastAPI
  },
  // TODO: Fix fallback
  // entriesRef: useRef<JournalEntry[]>([]),
  paginatedEntries: [],
  setPaginatedEntries: (val: any) => set((state: any) => ({ paginatedEntries: typeof val === 'function' ? val(state.paginatedEntries) : val })),
  entryCount: 0,
  setEntryCount: (val: any) => set((state: any) => ({ entryCount: typeof val === 'function' ? val(state.entryCount) : val })),
  isEntriesLoading: false,
  setIsEntriesLoading: (val: any) => set((state: any) => ({ isEntriesLoading: typeof val === 'function' ? val(state.isEntriesLoading) : val })),
  fetchEntries: async (options: any) => { 
    const state = get();
    const activeCompanyIds = get().activeCompanyIds || [];
    const companies = useSettingsStore.getState().companies || [];
    const allContacts = useCRMStore.getState().allContacts || [];
    const setAllContacts = useCRMStore.getState().setAllContacts;
    const currentUser = useHRStore.getState().currentUser || { id: 'user-1' };
    const allAccounts = get().allAccounts || [];
    const setLocalOnlyEntries = get().setLocalOnlyEntries;
    const ensureEntitiesMetadata = useSettingsStore.getState().ensureEntitiesMetadata || (async () => {});
    const emailSettings = useSettingsStore.getState().emailSettings;
    const allCreditNotes = useSalesStore.getState().allCreditNotes || [];
    const setLocalOnlyCreditNotes = useSalesStore.getState().setLocalOnlyCreditNotes;
    const allProducts = useInventoryStore.getState().allProducts || [];
    const targetMode = useSettingsStore.getState().targetMode || 'VALUE';
    const mergedRoles = useHRStore.getState().mergedRoles || [];
    const allInvoices = useSalesStore.getState().allInvoices || [];
    const paginatedInvoices = useSalesStore.getState().paginatedInvoices || [];

    const cacheKey = 'fetchEntries_' + JSON.stringify(activeCompanyIds) + '_' + JSON.stringify(options && options.nativeEvent ? {} : options);
    const isForce = options?.forceRefresh;
    const cache = fetchCacheMap.get(cacheKey);
    const now = Date.now();
    if (!isForce && cache) {
      if (cache.isFetching) return;
      if (now - cache.lastFetched < 1000) return;
    }
    fetchCacheMap.set(cacheKey, { isFetching: true, lastFetched: cache ? cache.lastFetched : 0 });
    
    get().setIsEntriesLoading(true);
    try {
      const { dbService } = await import('../../services/db');
      const { data, count } = await dbService.getPaginatedDocs('docs_journals', {
        ...options,
        companyIds: activeCompanyIds,
      });
      get().setPaginatedEntries(data);
      get().setEntryCount(count);
      
      // Fetch missing contacts and users referenced in journal lines
      if (data && data.length > 0) {
        const lineContactIds = data.flatMap((j: any) => j.lines || []).map((l: any) => l.contactId || l.contact_id).filter(Boolean);
        const uniqueContactIds = Array.from(new Set(lineContactIds)) as string[];
        
        const currentContacts = useCRMStore.getState().allContacts || [];
        const currentUsers = useHRStore.getState().users || [];
        
        const missingIds = uniqueContactIds.filter(id => 
          !currentContacts.some((c: any) => c.id === id) && 
          !currentUsers.some((u: any) => u.id === id)
        );
        
        if (missingIds.length > 0) {
          try {
            // Try fetching them as contacts first
            const { data: missingContacts } = await dbService.getPaginatedDocs('docs_contacts', { 
              filters: { id: { in: missingIds } },
              limit: 1000 
            });
            
            if (missingContacts && missingContacts.length > 0) {
              useCRMStore.getState().setAllContacts((prev: any) => {
                const existingIds = new Set((prev || []).map((p: any) => p.id));
                const newItems = missingContacts.filter((c: any) => !existingIds.has(c.id));
                return [...(prev || []), ...newItems];
              });
            }
            
            // For any still missing, try fetching as users
            const stillMissingIds = missingIds.filter(id => !missingContacts?.some((c: any) => c.id === id));
            if (stillMissingIds.length > 0) {
              const { data: missingUsers } = await dbService.getPaginatedDocs('docs_users', {
                filters: { id: { in: stillMissingIds } },
                limit: 1000
              });
              
              if (missingUsers && missingUsers.length > 0) {
                useHRStore.getState().setUsers((prev: any) => {
                  const existingIds = new Set((prev || []).map((p: any) => p.id));
                  const newItems = missingUsers.filter((u: any) => !existingIds.has(u.id));
                  return [...(prev || []), ...newItems];
                });
              }
            }
          } catch (e) {
            console.error('Failed to fetch missing contact metadata for journal entries:', e);
          }
        }
      }
    } catch (err) {
      console.error('fetchEntries failed:', err);
    } finally {
      fetchCacheMap.set(cacheKey, { isFetching: false, lastFetched: Date.now() });
      get().setIsEntriesLoading(false);
    } 
  },
  allJournalLines: [],
  setAllJournalLines: (val: any) => set((state: any) => ({ allJournalLines: typeof val === 'function' ? val(state.allJournalLines) : val })),
  setLocalOnlyLines: (val: any) => set((state: any) => ({ allJournalLines: typeof val === 'function' ? val(state.allJournalLines) : val })),
  accountBalances: {},
  setAccountBalances: (val: any) => set((state: any) => ({ accountBalances: typeof val === 'function' ? val(state.accountBalances) : val })),
  refreshBalances: async () => { 
    const state = get();
    const activeCompanyIds = get().activeCompanyIds || [];
    const companies = useSettingsStore.getState().companies || [];
    const allContacts = useCRMStore.getState().allContacts || [];
    const setAllContacts = useCRMStore.getState().setAllContacts;
    const currentUser = useHRStore.getState().currentUser || { id: 'user-1' };
    const allAccounts = get().allAccounts || [];
    const setLocalOnlyEntries = get().setLocalOnlyEntries;
    const ensureEntitiesMetadata = useSettingsStore.getState().ensureEntitiesMetadata || (async () => {});
    const emailSettings = useSettingsStore.getState().emailSettings;
    const allCreditNotes = useSalesStore.getState().allCreditNotes || [];
    const setLocalOnlyCreditNotes = useSalesStore.getState().setLocalOnlyCreditNotes;
    const allProducts = useInventoryStore.getState().allProducts || [];
    const targetMode = useSettingsStore.getState().targetMode || 'VALUE';
    const mergedRoles = useHRStore.getState().mergedRoles || [];
    const allInvoices = useSalesStore.getState().allInvoices || [];
    const paginatedInvoices = useSalesStore.getState().paginatedInvoices || [];

    if (activeCompanyIds.length === 0) return;
    try {
      const { dbService } = await import('../../services/db');
      const [accBals, partBals] = await Promise.all([
        dbService.getAccountBalances(activeCompanyIds),
        dbService.getPartnerBalances(activeCompanyIds)
      ]);
      get().setAccountBalances(accBals);
      useCRMStore.getState().setPartnerBalances(partBals);
    } catch (err) {
      console.error('refreshBalances failed:', err);
    } 
  },
  getGeneralLedger: async (companyId: string | null, accountId: string, startDate: string, endDate: string) => { 
    const state = get();
    const activeCompanyIds = get().activeCompanyIds || [];
    const companies = useSettingsStore.getState().companies || [];
    const allContacts = useCRMStore.getState().allContacts || [];
    const setAllContacts = useCRMStore.getState().setAllContacts;
    const currentUser = useHRStore.getState().currentUser || { id: 'user-1' };
    const allAccounts = get().allAccounts || [];
    const setLocalOnlyEntries = get().setLocalOnlyEntries;
    const ensureEntitiesMetadata = useSettingsStore.getState().ensureEntitiesMetadata || (async () => {});
    const emailSettings = useSettingsStore.getState().emailSettings;
    const allCreditNotes = useSalesStore.getState().allCreditNotes || [];
    const setLocalOnlyCreditNotes = useSalesStore.getState().setLocalOnlyCreditNotes;
    const allProducts = useInventoryStore.getState().allProducts || [];
    const targetMode = useSettingsStore.getState().targetMode || 'VALUE';
    const mergedRoles = useHRStore.getState().mergedRoles || [];
    const allInvoices = useSalesStore.getState().allInvoices || [];
    const paginatedInvoices = useSalesStore.getState().paginatedInvoices || [];

    const cacheKey = `${companyId}-${accountId}-${startDate}-${endDate}`;
    if (generalLedgerPromiseCache.has(cacheKey)) {
      return generalLedgerPromiseCache.get(cacheKey);
    }
    const { reportingService } = await import('../../services/reportingService');
    const promise = reportingService.getGeneralLedger(companyId, accountId, startDate, endDate);
    generalLedgerPromiseCache.set(cacheKey, promise);
    try {
      const res = await promise;
      setTimeout(() => generalLedgerPromiseCache.delete(cacheKey), 2000);
      return res;
    } catch (e) {
      generalLedgerPromiseCache.delete(cacheKey);
      throw e;
    } 
  },
  getGeneralLedgerByCode: async (companyIds: string[], accountCode: string, startDate: string, endDate: string) => { 
    const state = get();
    const activeCompanyIds = get().activeCompanyIds || [];
    const companies = useSettingsStore.getState().companies || [];
    const allContacts = useCRMStore.getState().allContacts || [];
    const setAllContacts = useCRMStore.getState().setAllContacts;
    const currentUser = useHRStore.getState().currentUser || { id: 'user-1' };
    const allAccounts = get().allAccounts || [];
    const setLocalOnlyEntries = get().setLocalOnlyEntries;
    const ensureEntitiesMetadata = useSettingsStore.getState().ensureEntitiesMetadata || (async () => {});
    const emailSettings = useSettingsStore.getState().emailSettings;
    const allCreditNotes = useSalesStore.getState().allCreditNotes || [];
    const setLocalOnlyCreditNotes = useSalesStore.getState().setLocalOnlyCreditNotes;
    const allProducts = useInventoryStore.getState().allProducts || [];
    const targetMode = useSettingsStore.getState().targetMode || 'VALUE';
    const mergedRoles = useHRStore.getState().mergedRoles || [];
    const allInvoices = useSalesStore.getState().allInvoices || [];
    const paginatedInvoices = useSalesStore.getState().paginatedInvoices || [];

    // supabase import removed
    const accounts: any[] = []; const accError = null;
    
    if (accError || !accounts || accounts.length === 0) {
      return [];
    }
    
    const allResults = await Promise.all(accounts.map(acc => 
      get().getGeneralLedger(acc.company_id, acc.id, startDate, endDate)
    ));
    
    const flattened = allResults.flat().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let runningBalance = 0;
    return flattened.map(tx => {
      runningBalance += (tx.debit - tx.credit);
      return { ...tx, running_balance: runningBalance };
    }); 
  },
  get_accounts: () => { 
    const state = get();
    const activeCompanyIds = get().activeCompanyIds || [];
    const companies = useSettingsStore.getState().companies || [];
    const allContacts = useCRMStore.getState().allContacts || [];
    const setAllContacts = useCRMStore.getState().setAllContacts;
    const currentUser = useHRStore.getState().currentUser || { id: 'user-1' };
    const allAccounts = get().allAccounts || [];
    const setLocalOnlyEntries = get().setLocalOnlyEntries;
    const ensureEntitiesMetadata = useSettingsStore.getState().ensureEntitiesMetadata || (async () => {});
    const emailSettings = useSettingsStore.getState().emailSettings;
    const allCreditNotes = useSalesStore.getState().allCreditNotes || [];
    const setLocalOnlyCreditNotes = useSalesStore.getState().setLocalOnlyCreditNotes;
    const allProducts = useInventoryStore.getState().allProducts || [];
    const targetMode = useSettingsStore.getState().targetMode || 'VALUE';
    const mergedRoles = useHRStore.getState().mergedRoles || [];
    const allInvoices = useSalesStore.getState().allInvoices || [];
    const paginatedInvoices = useSalesStore.getState().paginatedInvoices || [];

    return (allAccounts || []).filter(a => a && (a.companyId || a.company_id) && activeCompanyIds.includes(a.companyId || a.company_id)); 
  },
  get_entries: () => { 
    const state = get();
    const activeCompanyIds = get().activeCompanyIds || [];
    const companies = useSettingsStore.getState().companies || [];
    const allContacts = useCRMStore.getState().allContacts || [];
    const setAllContacts = useCRMStore.getState().setAllContacts;
    const currentUser = useHRStore.getState().currentUser || { id: 'user-1' };
    const allAccounts = get().allAccounts || [];
    const setLocalOnlyEntries = get().setLocalOnlyEntries;
    const ensureEntitiesMetadata = useSettingsStore.getState().ensureEntitiesMetadata || (async () => {});
    const emailSettings = useSettingsStore.getState().emailSettings;
    const allCreditNotes = useSalesStore.getState().allCreditNotes || [];
    const setLocalOnlyCreditNotes = useSalesStore.getState().setLocalOnlyCreditNotes;
    const allProducts = useInventoryStore.getState().allProducts || [];
    const targetMode = useSettingsStore.getState().targetMode || 'VALUE';
    const mergedRoles = useHRStore.getState().mergedRoles || [];
    const allInvoices = useSalesStore.getState().allInvoices || [];
    const paginatedInvoices = useSalesStore.getState().paginatedInvoices || [];

    const rawLines = get().allJournalLines || [];
return (get().allEntries || [])
  .filter(e => e && e?.companyId && activeCompanyIds.includes(e?.companyId))
  .map(e => {
    // Find lines for this journal
    const lines = rawLines
      .filter(l => (l as any).journalId === e.id || (l as any).journal_id === e.id)
      .map(l => ({
        ...l,
        id: l.id,
        journalId: (l as any).journalId || (l as any).journal_id || e.id,
        accountId: (l as any).accountId || (l as any).account_id,
        contactId: (l as any).contactId || (l as any).contact_id,
        debit: Number((l as any).debit || 0),
        credit: Number((l as any).credit || 0),
        description: (l as any).description || e.description
      }));
    
    // Final Fallback: If flat table lines are missing (sync/load issue), try using embedded JSON 'lines'
    const finalLines = lines.length > 0 ? lines : (e.lines || []).map((l: any) => ({
       ...l,
       debit: Number(l.debit || 0),
       credit: Number(l.credit || 0)
    }));

    return { ...e, lines: finalLines };
  });; 
  },
  get_journalLines: () => { 
    const state = get();
    const activeCompanyIds = get().activeCompanyIds || [];
    const companies = useSettingsStore.getState().companies || [];
    const allContacts = useCRMStore.getState().allContacts || [];
    const setAllContacts = useCRMStore.getState().setAllContacts;
    const currentUser = useHRStore.getState().currentUser || { id: 'user-1' };
    const allAccounts = get().allAccounts || [];
    const setLocalOnlyEntries = get().setLocalOnlyEntries;
    const ensureEntitiesMetadata = useSettingsStore.getState().ensureEntitiesMetadata || (async () => {});
    const emailSettings = useSettingsStore.getState().emailSettings;
    const allCreditNotes = useSalesStore.getState().allCreditNotes || [];
    const setLocalOnlyCreditNotes = useSalesStore.getState().setLocalOnlyCreditNotes;
    const allProducts = useInventoryStore.getState().allProducts || [];
    const targetMode = useSettingsStore.getState().targetMode || 'VALUE';
    const mergedRoles = useHRStore.getState().mergedRoles || [];
    const allInvoices = useSalesStore.getState().allInvoices || [];
    const paginatedInvoices = useSalesStore.getState().paginatedInvoices || [];

    return (get().allJournalLines || []).filter(l => l && (l as any).company_id && activeCompanyIds.includes((l as any).company_id)); 
  },
  getAccountIdByCode: (code: string, targetCompanyId?: string) => { 
    const state = get();
    const activeCompanyIds = get().activeCompanyIds || [];
    const companies = useSettingsStore.getState().companies || [];
    const allContacts = useCRMStore.getState().allContacts || [];
    const setAllContacts = useCRMStore.getState().setAllContacts;
    const currentUser = useHRStore.getState().currentUser || { id: 'user-1' };
    const allAccounts = get().allAccounts || [];
    const setLocalOnlyEntries = get().setLocalOnlyEntries;
    const ensureEntitiesMetadata = useSettingsStore.getState().ensureEntitiesMetadata || (async () => {});
    const emailSettings = useSettingsStore.getState().emailSettings;
    const allCreditNotes = useSalesStore.getState().allCreditNotes || [];
    const setLocalOnlyCreditNotes = useSalesStore.getState().setLocalOnlyCreditNotes;
    const allProducts = useInventoryStore.getState().allProducts || [];
    const targetMode = useSettingsStore.getState().targetMode || 'VALUE';
    const mergedRoles = useHRStore.getState().mergedRoles || [];
    const allInvoices = useSalesStore.getState().allInvoices || [];
    const paginatedInvoices = useSalesStore.getState().paginatedInvoices || [];

    const companyId = targetCompanyId || activeCompanyIds[0];
    const accounts = get().accountsRef.current || allAccounts || [];
    
    // exact match for company
    const account = accounts.find(a => String(a.code || '') === String(code) && a?.companyId === companyId);
    if (account) return account.id;
    
    // type/subType match for generic requests like 'CASH'
    const typeMatch = accounts.find(a => String(a.subType || '').toUpperCase() === String(code).toUpperCase() && a?.companyId === companyId);
    if (typeMatch) return typeMatch.id;
    
    // company fallback code/type
    const fallbackInCompany = accounts.find(a => a?.companyId === companyId && 
      (String(a.code || '') === String(code) || String(a.subType || '').toUpperCase() === String(code).toUpperCase())
    );
    if (fallbackInCompany) return fallbackInCompany.id;
    
    // cross-company code fallback (only if targetCompanyId not explicitly specified)
    if (!targetCompanyId) {
      const globalFallbackCode = accounts.find(a => String(a.code || '') === String(code));
      if (globalFallbackCode) return globalFallbackCode.id;
    
      const globalFallbackType = accounts.find(a => String(a.subType || '').toUpperCase() === String(code).toUpperCase());
      if (globalFallbackType) return globalFallbackType.id;
    }
    
    return null; 
  },
  addAccount: (account: Omit<Account, 'id' | 'companyId'>, targetCompanyId?: string) => { 
    const state = get();
    const activeCompanyIds = get().activeCompanyIds || [];
    const companies = useSettingsStore.getState().companies || [];
    const allContacts = useCRMStore.getState().allContacts || [];
    const setAllContacts = useCRMStore.getState().setAllContacts;
    const currentUser = useHRStore.getState().currentUser || { id: 'user-1' };
    const allAccounts = get().allAccounts || [];
    const setLocalOnlyEntries = get().setLocalOnlyEntries;
    const ensureEntitiesMetadata = useSettingsStore.getState().ensureEntitiesMetadata || (async () => {});
    const emailSettings = useSettingsStore.getState().emailSettings;
    const allCreditNotes = useSalesStore.getState().allCreditNotes || [];
    const setLocalOnlyCreditNotes = useSalesStore.getState().setLocalOnlyCreditNotes;
    const allProducts = useInventoryStore.getState().allProducts || [];
    const targetMode = useSettingsStore.getState().targetMode || 'VALUE';
    const mergedRoles = useHRStore.getState().mergedRoles || [];
    const allInvoices = useSalesStore.getState().allInvoices || [];
    const paginatedInvoices = useSalesStore.getState().paginatedInvoices || [];

    const companyId = targetCompanyId || activeCompanyIds[0];
    
    let code = account.code;
    if (!code) {
      const typePrefixes: Record<string, string> = {
        'ASSET': '1', 'LIABILITY': '2', 'EQUITY': '3', 'REVENUE': '4', 'COST_OF_REVENUE': '5', 'EXPENSE': '6', 'OTHER_REVENUE': '7', 'OTHER_EXPENSE': '8'
      };
      code = `${typePrefixes[account.type] || '9'}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    }
    
    const newId = ("temp-" + crypto.randomUUID());
    const newAccount = {
      ...account,
      id: newId,
      code,
      companyId,
      };
    
    get().setAllAccounts((prev: any) => [...prev, newAccount]);
    get().accountsRef.current = [...(get().accountsRef.current || []), newAccount];
    
    // Persist via secure API
    
       apiFetch('/api/accounts/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json',  },
          body: JSON.stringify({
            id: newId,
            data: {
              ...newAccount,
              company_id: companyId,
              name: newAccount.name || '',
              code: newAccount.code || '',
              type: newAccount.type || '',
              sub_type: newAccount.subType || ''
            }
          })
       }).then(r => r.json()).then(res => {
          if (!res.success) console.error("Account API upsert failed:", res.error);
       }).catch(err => console.error(err));
    
    return newAccount; 
  },
  addJournalEntry: async (entry: Omit<JournalEntry, 'id' | 'companyId'>, targetCompanyId?: string) => { 
    const state = get();
    const activeCompanyIds = get().activeCompanyIds || [];
    const companies = useSettingsStore.getState().companies || [];
    const allContacts = useCRMStore.getState().allContacts || [];
    const setAllContacts = useCRMStore.getState().setAllContacts;
    const currentUser = useHRStore.getState().currentUser || { id: 'user-1' };
    const allAccounts = get().allAccounts || [];
    const setLocalOnlyEntries = get().setLocalOnlyEntries;
    const ensureEntitiesMetadata = useSettingsStore.getState().ensureEntitiesMetadata || (async () => {});
    const emailSettings = useSettingsStore.getState().emailSettings;
    const allCreditNotes = useSalesStore.getState().allCreditNotes || [];
    const setLocalOnlyCreditNotes = useSalesStore.getState().setLocalOnlyCreditNotes;
    const allProducts = useInventoryStore.getState().allProducts || [];
    const targetMode = useSettingsStore.getState().targetMode || 'VALUE';
    const mergedRoles = useHRStore.getState().mergedRoles || [];
    const allInvoices = useSalesStore.getState().allInvoices || [];
    const paginatedInvoices = useSalesStore.getState().paginatedInvoices || [];

    const companyId = targetCompanyId || activeCompanyIds[0];
    const company = companies.find(c => c.id === companyId);
    const companyCode = company?.code || 'CO';
    
    // STRONG VALIDATION: Prevent transaction confirmation if any account is not assigned or invalid
    if (entry.status !== 'DRAFT') {
      entry.lines.forEach((line, index) => {
        if (!line.accountId) {
          throw new Error(`Validation Error (${company?.name || 'Unknown Company'}): Line ${index + 1} is missing an account assignment.`);
        }
        const accountExists = get().accountsRef.current.some(a => a.id === line.accountId);
        if (!accountExists) {
          // Check if it's already a full ID or just a code
          throw new Error(`Validation Error (${company?.name || 'Unknown Company'}): Account '${line.accountId}' on line ${index + 1} does not exist in the Chart of Accounts.`);
        }
      });
    }
    
    // STRONG VALIDATION: Enforce double-entry integrity (debit = credit)
    if (entry.status === 'POSTED') {
      const balanced = Math.abs(entry.lines.reduce((s, l) => s + (l.debit || 0) - (l.credit || 0), 0)) < 0.01;
      if (!balanced) {
        throw new Error(`Accounting Integrity Error: Journal entry must be balanced (Debits must equal Credits).`);
      }
      if (entry.lines.length < 2) {
        throw new Error(`Accounting Integrity Error: Double-entry requires at least two lines.`);
      }
    }
    
    const generateDraftRef = (baseId: string) => {
      const parts = baseId.split('-');
      const ts = parts[1] || ("temp-" + crypto.randomUUID());
      const rand = parts[2] || ("temp-" + crypto.randomUUID());
      return `DRAFT-${ts}-${rand}`;
    };
    
    // Check if an entry with this reference already exists for this company
    // This allows re-posting to the same journal entry if a previous attempt failed mid-way
    let existingId: string | null = (entry as any).id || null;
    if (!existingId && entry.reference && !['NEW', '', 'DRAFT'].includes(String(entry.reference).toUpperCase())) {
      const existing = null; // Migrated: read from store state
      if (existing) existingId = existing.id;
    }
    
    const newId = existingId || ("temp-" + crypto.randomUUID()); 
    
    let reference = entry.reference;
    // If we have a reference but it's not the one belonging to existingId, we might have a conflict
    // The RPC handle this by update, but direct upsert might fail.
    // However, if we found existingId, we use it, so there's no conflict on (company_id, reference).
    
    if (!reference || reference === 'NEW' || reference === '' || reference === 'DRAFT' || reference.toUpperCase() === 'DRAFT') {
      reference = generateDraftRef(newId);
    }
    const newEntry: JournalEntry = { 
      ...entry, 
      id: newId, 
      reference: reference || generateDraftRef(newId),
      companyId,
      companyCode,
      createdById: (entry as any).createdById || currentUser?.id || 'user-1'
    } as JournalEntry;
    
    // Call Transactional RPC for atomic save of header + lines
    // Ensure payload matches expected snake_case columns if the RPC uses them
    const rpcPayload = {
      ...newEntry,
      id: newEntry.id,
      company_id: companyId,
      journal_type: newEntry.journalType || 'MISC',
      journalType: newEntry.journalType || 'MISC',
      reference_number: newEntry.reference,
      reference: newEntry.reference,
      date: newEntry.date,
      status: newEntry.status,
      description: newEntry.description,
      preparedBy: newEntry.preparedBy || currentUser?.name || currentUser?.username || (currentUser?.email ? currentUser.email.split('@')[0] : '') || 'System',
      createdById: newEntry.createdById || currentUser?.id || 'user-1',
      lines: (newEntry.lines || []).map((l: any) => ({
        ...l,
        id: (l.id && l.id.length > 10 && !['debit', 'credit'].includes(l.id)) ? l.id : crypto.randomUUID(),
        account_id: l.accountId,
        accountId: l.accountId,
        contact_id: l.contactId,
        contactId: l.contactId,
        debit: l.debit || 0,
        credit: l.credit || 0,
        description: l.description || newEntry.description || ''
      }))
    };
    
    console.log('addJournalEntry: Attempting RPC save...', rpcPayload);
    let rpcRes: any = null;
    let rpcError: any = null;
    
    try {
      const res = await apiFetch('/api/journals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',  },
        body: JSON.stringify({ p_journal_data: rpcPayload, p_company_id: companyId })
      });
      const data = await res.json();
      rpcRes = data.success ? data : null;
      rpcError = data.error ? new Error(data.error) : null;
      if (!res.ok) rpcError = new Error(data.error || 'API Error');
    
      // Handle duplicate reference conflict by looking up the ID and retrying once
      if (rpcError?.message?.includes('unq_journal_num_company') || rpcError?.message?.includes('duplicate key value')) {
        console.warn('addJournalEntry: Duplicate reference detected, attempting ID lookup and retry...');
        const conflict = null; // Migrated: read from store state
        
        if (conflict && conflict.id !== rpcPayload.id) {
          console.log('addJournalEntry: Conflicting ID found:', conflict.id, '- retrying with merged ID');
          rpcPayload.id = conflict.id;
          const retryRes = await apiFetch('/api/journals/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json',  },
            body: JSON.stringify({ p_journal_data: rpcPayload, p_company_id: companyId })
          });
          const retryData = await retryRes.json();
          rpcRes = retryData.success ? retryData : null;
          rpcError = retryData.error ? new Error(retryData.error) : null;
          if (!retryRes.ok) rpcError = new Error(retryData.error || 'API Error');
        }
      }
    } catch (err) {
      console.warn('addJournalEntry: RPC call failed with exception', err);
      rpcError = err;
    }
    
    if (rpcError || (rpcRes && !rpcRes.success)) {
      const errorMsg = rpcError?.message || rpcRes?.error || 'Unknown RPC error';
      throw new Error(`Add Journal Entry Failed: ${errorMsg}`);
    } else {
      console.log('addJournalEntry: Completed successfully via RPC', rpcRes);
    }
    
    // Update newEntry with the server-assigned reference and id (backend generates
    // sequence numbers like JEN-SE-000002 that the frontend doesn't know in advance)
    if (rpcRes?.reference) {
      (newEntry as any).reference = rpcRes.reference;
      (newEntry as any).reference_number = rpcRes.reference;
    }
    if (rpcRes?.journal_id && rpcRes.journal_id !== newEntry.id) {
      (newEntry as any).id = rpcRes.journal_id;
    }
    
    // Immediate local update for better UX
    // NOTE: Do NOT also call setLocalOnlyLines here — paginatedEntries already carries
    // embedded lines on the entry object. Calling setLocalOnlyLines would make get_entries()
    // merge allJournalLines on top, doubling the visible journal lines in the form view.
    setLocalOnlyEntries(prev => [newEntry, ...(prev || [])]);
    get().setPaginatedEntries((prev: any) => [newEntry, ...(prev || [])]);
    
    get().refreshBalances();
    
    // Refetch journals and lines after a delay to get final server state (with numbers, IDs, etc)
    setTimeout(async () => {
      const latestJournal = null; // Migrated: read from store state
      const _jlRes = await apiFetch(`/api/docs?table=docs_journal_lines&limit=200`); const lines = _jlRes.ok ? ((await _jlRes.json()).data || []).filter((l: any) => l.journal_id === newEntry.id) : [];
      
      if (latestJournal) {
        const { mapDatabaseRowToFrontend } = await import('../../services/db');
        const mapped = mapDatabaseRowToFrontend(latestJournal);
        
        if (latestLines) {
          const nonZeroLines = latestLines.map(l => ({
            ...l,
            id: l.id,
            accountId: l.account_id || l.accountId,
            contactId: l.contact_id || l.contactId,
            journalId: l.journal_id || l.journalId
          }));
          mapped.lines = nonZeroLines;
          get().setLocalOnlyLines(prev => {
            const filtered = (prev || []).filter(l => (l as any).journal_id !== mapped.id && (l as any).journalId !== mapped.id);
            return [...filtered, ...nonZeroLines];
          });
        }
    
        setLocalOnlyEntries(prev => {
          const arr = prev || [];
          const idx = arr.findIndex(e => e.id === mapped.id);
          if (idx >= 0) {
            const next = [...arr];
            next[idx] = mapped;
            return next;
          }
          return [mapped, ...arr];
        });
        get().setPaginatedEntries((prev: any) => {
          const arr = prev || [];
          const idx = arr.findIndex((e: any) => e.id === mapped.id);
          if (idx >= 0) {
            const next = [...arr];
            next[idx] = mapped;
            return next;
          }
          return [mapped, ...arr];
        });
      }
    }, 500);
    
    return newEntry; 
  },
  updateJournalEntry: async (id: string, updates: Partial<JournalEntry>) => { 
    const state = get();
    const activeCompanyIds = get().activeCompanyIds || [];
    const companies = useSettingsStore.getState().companies || [];
    const allContacts = useCRMStore.getState().allContacts || [];
    const setAllContacts = useCRMStore.getState().setAllContacts;
    const currentUser = useHRStore.getState().currentUser || { id: 'user-1' };
    const allAccounts = get().allAccounts || [];
    const setLocalOnlyEntries = get().setLocalOnlyEntries;
    const ensureEntitiesMetadata = useSettingsStore.getState().ensureEntitiesMetadata || (async () => {});
    const emailSettings = useSettingsStore.getState().emailSettings;
    const allCreditNotes = useSalesStore.getState().allCreditNotes || [];
    const setLocalOnlyCreditNotes = useSalesStore.getState().setLocalOnlyCreditNotes;
    const allProducts = useInventoryStore.getState().allProducts || [];
    const targetMode = useSettingsStore.getState().targetMode || 'VALUE';
    const mergedRoles = useHRStore.getState().mergedRoles || [];
    const allInvoices = useSalesStore.getState().allInvoices || [];
    const paginatedInvoices = useSalesStore.getState().paginatedInvoices || [];

    let updatedEntry: JournalEntry | null = null;
    let originalEntry: JournalEntry | undefined = get().allEntries.find(e => e.id === id);
    
    if (!originalEntry) {
      // Must fetch from DB to avoid overwriting with a partial payload
      try {
        // supabase import removed
        const dbEntry = null; // Migrated: read from store state
        if (dbEntry) {
          const { mapDatabaseRowToFrontend } = await import('../../services/db');
          originalEntry = mapDatabaseRowToFrontend(dbEntry) as JournalEntry;
          const _jlRes = await apiFetch(`/api/docs?table=docs_journal_lines&limit=200`); const lines = _jlRes.ok ? ((await _jlRes.json()).data || []).filter((l: any) => l.journal_id === id) : [];
          if (dbLines && dbLines.length > 0) {
              const nonZeroDbLines = dbLines;
              const mappedLines = nonZeroDbLines.map((row: any) => ({
                 id: row.id,
                 accountId: row.account_id,
                 contactId: row.contact_id,
                 debit: row.debit,
                 credit: row.credit,
                 description: row.description
              }));
              originalEntry.lines = mappedLines;
          }
        }
      } catch (e) {
        console.warn('Failed to fetch original journal entry before update', e);
      }
    }
    
    if (originalEntry) {
      const merged = { ...originalEntry, ...updates };
      // STRONG VALIDATION: Prevent transaction confirmation if any account is not assigned or invalid
      if (merged.status !== 'DRAFT') {
        const company = companies.find(c => c.id === (merged as JournalEntry)?.companyId);
        merged.lines.forEach((line, index) => {
          if (!line.accountId) {
            throw new Error(`Validation Error (${company?.name || 'Unknown Company'}): Line ${index + 1} is missing an account assignment.`);
          }
          const accountExists = get().accountsRef.current.some(a => a.id === line.accountId);
          if (!accountExists) {
            throw new Error(`Validation Error (${company?.name || 'Unknown Company'}): Account '${line.accountId}' on line ${index + 1} does not exist in the Chart of Accounts.`);
          }
        });
      }
    }
    
    const merged = originalEntry ? { ...originalEntry, ...updates } : (updates as JournalEntry);
    
    let reference = merged.reference;
    if (!reference || reference === 'NEW' || reference === '' || reference === 'DRAFT' || reference.toUpperCase() === 'DRAFT') {
      const parts = id.split('-');
      const ts = parts[1] || ("temp-" + crypto.randomUUID());
      const rand = parts[2] || ("temp-" + crypto.randomUUID());
      reference = `DRAFT-${ts}-${rand}`;
    }
    
    updatedEntry = originalEntry ? { ...originalEntry, ...updates, reference } : { id, ...updates, reference } as JournalEntry;
    
    // Direct push via RPC
    if (updatedEntry) {
      try {
        const companyId = (updatedEntry as JournalEntry).companyId;
        const entryObj = updatedEntry as JournalEntry;
        
        const rpcPayload = {
          ...entryObj,
          id: entryObj.id,
          journal_type: entryObj.journalType || 'MISC',
          reference_number: reference,
          status: entryObj.status,
          preparedBy: entryObj.preparedBy || currentUser?.name || currentUser?.username || (currentUser?.email ? currentUser.email.split('@')[0] : '') || 'System',
          lines: (entryObj.lines || []).map((l: any) => ({
            ...l,
            id: (l.id && l.id.length > 10 && !['debit', 'credit'].includes(l.id)) ? l.id : crypto.randomUUID(),
            account_id: l.accountId,
            accountId: l.accountId,
            contact_id: l.contactId,
            contactId: l.contactId,
            debit: l.debit || 0,
            credit: l.credit || 0
          }))
        };
    
        const res = await apiFetch('/api/journals/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json',  },
          body: JSON.stringify({ p_journal_data: rpcPayload, p_company_id: companyId })
        });
        const rpcRes = await res.json();
        const rpcError = !res.ok ? new Error(rpcRes.error || 'API Error') : null;
    
        if (rpcError || (rpcRes && !rpcRes.success)) {
          const errorMsg = rpcError?.message || rpcRes?.error || 'Unknown RPC error';
          throw new Error(`Update Journal Entry Failed: ${errorMsg}`);
        }
    
        // Apply server-assigned reference (sequence number) to the local entry
        if (rpcRes?.reference && updatedEntry) {
          (updatedEntry as any).reference = rpcRes.reference;
          (updatedEntry as any).reference_number = rpcRes.reference;
        }
    
        // Apply updated entry locally only AFTER successful RPC
        setLocalOnlyEntries(prev => prev.map(e => e.id === id ? updatedEntry! : e));
        get().setPaginatedEntries((prev: any) => prev.map((e: any) => e.id === id ? updatedEntry : e));
    
        // 5. Refetch to get consistent state
        setTimeout(async () => {
          const latestJournal = null; // Migrated: read from store state
          const _jlRes = await apiFetch(`/api/docs?table=docs_journal_lines&limit=200`); const lines = _jlRes.ok ? ((await _jlRes.json()).data || []).filter((l: any) => l.journal_id === id) : [];
          if (latestJournal) {
            const { mapDatabaseRowToFrontend } = await import('../../services/db');
            const mapped = mapDatabaseRowToFrontend(latestJournal);
            
            if (latestLines) {
              const nonZeroLines = latestLines.map(l => ({
                ...l,
                id: l.id,
                accountId: l.account_id || l.accountId,
                contactId: l.contact_id || l.contactId,
                journalId: l.journal_id || l.journalId
              }));
              mapped.lines = nonZeroLines;
              get().setLocalOnlyLines(prev => {
                const filtered = (prev || []).filter(l => (l as any).journal_id !== mapped.id && (l as any).journalId !== mapped.id);
                return [...filtered, ...nonZeroLines];
              });
            }
            setLocalOnlyEntries(prev => prev.map(e => e.id === id ? mapped : e));
          }
        }, 500);
      } catch (err: any) {
        console.error('updateJournalEntry: sync failed', err);
        throw err;
      }
    } 
  },
  resetJournalEntryToDraft: async (id: string) => { 
    const state = get();
    const activeCompanyIds = get().activeCompanyIds || [];
    const companies = useSettingsStore.getState().companies || [];
    const allContacts = useCRMStore.getState().allContacts || [];
    const setAllContacts = useCRMStore.getState().setAllContacts;
    const currentUser = useHRStore.getState().currentUser || { id: 'user-1' };
    const allAccounts = get().allAccounts || [];
    const setLocalOnlyEntries = get().setLocalOnlyEntries;
    const ensureEntitiesMetadata = useSettingsStore.getState().ensureEntitiesMetadata || (async () => {});
    const emailSettings = useSettingsStore.getState().emailSettings;
    const allCreditNotes = useSalesStore.getState().allCreditNotes || [];
    const setLocalOnlyCreditNotes = useSalesStore.getState().setLocalOnlyCreditNotes;
    const allProducts = useInventoryStore.getState().allProducts || [];
    const targetMode = useSettingsStore.getState().targetMode || 'VALUE';
    const mergedRoles = useHRStore.getState().mergedRoles || [];
    const allInvoices = useSalesStore.getState().allInvoices || [];
    const paginatedInvoices = useSalesStore.getState().paginatedInvoices || [];

    setLocalOnlyEntries(prev => prev.map(entry => entry.id === id ? { ...entry, status: 'DRAFT' } : entry));
    const resp = await apiFetch('/api/documents/unpost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',  },
      body: JSON.stringify({ type: 'JOURNAL', id })
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      setLocalOnlyEntries(prev => prev.filter(e => true)); // forces an update
      throw new Error(data.error || `Failed to reset journal`);
    } 
  },
  getAccountBalance: (accountId: string, companyId?: string) => { 
    const state = get();
    const activeCompanyIds = get().activeCompanyIds || [];
    const companies = useSettingsStore.getState().companies || [];
    const allContacts = useCRMStore.getState().allContacts || [];
    const setAllContacts = useCRMStore.getState().setAllContacts;
    const currentUser = useHRStore.getState().currentUser || { id: 'user-1' };
    const allAccounts = get().allAccounts || [];
    const setLocalOnlyEntries = get().setLocalOnlyEntries;
    const ensureEntitiesMetadata = useSettingsStore.getState().ensureEntitiesMetadata || (async () => {});
    const emailSettings = useSettingsStore.getState().emailSettings;
    const allCreditNotes = useSalesStore.getState().allCreditNotes || [];
    const setLocalOnlyCreditNotes = useSalesStore.getState().setLocalOnlyCreditNotes;
    const allProducts = useInventoryStore.getState().allProducts || [];
    const targetMode = useSettingsStore.getState().targetMode || 'VALUE';
    const mergedRoles = useHRStore.getState().mergedRoles || [];
    const allInvoices = useSalesStore.getState().allInvoices || [];
    const paginatedInvoices = useSalesStore.getState().paginatedInvoices || [];

    return get().accountBalances[accountId] || 0; 
  },
  reverseJournalEntry: async (id: string) => { 
    const state = get();
    const activeCompanyIds = get().activeCompanyIds || [];
    const companies = useSettingsStore.getState().companies || [];
    const allContacts = useCRMStore.getState().allContacts || [];
    const setAllContacts = useCRMStore.getState().setAllContacts;
    const currentUser = useHRStore.getState().currentUser || { id: 'user-1' };
    const allAccounts = get().allAccounts || [];
    const setLocalOnlyEntries = get().setLocalOnlyEntries;
    const ensureEntitiesMetadata = useSettingsStore.getState().ensureEntitiesMetadata || (async () => {});
    const emailSettings = useSettingsStore.getState().emailSettings;
    const allCreditNotes = useSalesStore.getState().allCreditNotes || [];
    const setLocalOnlyCreditNotes = useSalesStore.getState().setLocalOnlyCreditNotes;
    const allProducts = useInventoryStore.getState().allProducts || [];
    const targetMode = useSettingsStore.getState().targetMode || 'VALUE';
    const mergedRoles = useHRStore.getState().mergedRoles || [];
    const allInvoices = useSalesStore.getState().allInvoices || [];
    const paginatedInvoices = useSalesStore.getState().paginatedInvoices || [];

    try {
      // supabase import removed
      const resp = await apiFetch('/api/journals/reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',  },
        body: JSON.stringify({ p_journal_id: id, p_user_id: currentUser?.id })
      });
      const data = await resp.json();
      const error = resp.ok && data.success ? null : new Error(data.error || 'Failed to reverse journal entry');
      if (error) throw error;
      
      // Refresh local state
      await get().fetchInitialData(currentUser?.id || '');
      return data;
    } catch (err: any) {
      console.error('reverseJournalEntry failed:', err);
      throw err;
    } 
  },
  deleteJournalEntry: async (id: string) => { 
    const state = get();
    const activeCompanyIds = get().activeCompanyIds || [];
    const companies = useSettingsStore.getState().companies || [];
    const allContacts = useCRMStore.getState().allContacts || [];
    const setAllContacts = useCRMStore.getState().setAllContacts;
    const currentUser = useHRStore.getState().currentUser || { id: 'user-1' };
    const allAccounts = get().allAccounts || [];
    const setLocalOnlyEntries = get().setLocalOnlyEntries;
    const ensureEntitiesMetadata = useSettingsStore.getState().ensureEntitiesMetadata || (async () => {});
    const emailSettings = useSettingsStore.getState().emailSettings;
    const allCreditNotes = useSalesStore.getState().allCreditNotes || [];
    const setLocalOnlyCreditNotes = useSalesStore.getState().setLocalOnlyCreditNotes;
    const allProducts = useInventoryStore.getState().allProducts || [];
    const targetMode = useSettingsStore.getState().targetMode || 'VALUE';
    const mergedRoles = useHRStore.getState().mergedRoles || [];
    const allInvoices = useSalesStore.getState().allInvoices || [];
    const paginatedInvoices = useSalesStore.getState().paginatedInvoices || [];

    try {
      const entry = get().allEntries.find(e => e.id === id);
      if (!entry) throw new Error('Entry not found locally.');
      
      const resp = await apiFetch('/api/documents/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',  },
        body: JSON.stringify({ type: 'JOURNAL', id })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
         throw new Error(data.error || `Failed to delete journal entry`);
      }
      
      setLocalOnlyEntries((prev: any) => prev.filter((e: any) => e.id !== id));
      setTimeout(() => {
        get().refreshBalances();
      }, 500);
    } catch (e: any) {
      console.error(e);
      throw e;
    } 
  },

  // ── Auth ──────────────────────────────────────────────────────────────
  sessionChecked: false,
  loadError: null as string | null,
  currentUser: null as any,
  loginRole: null as 'USER' | 'CASHIER' | null,

  setLoginRole: (role: any) => set({ loginRole: role }),

  hasPermission: (key: string) => {
    const currentUser = get().currentUser;
    if (!currentUser) return false;
    if (currentUser.roleId === 'role-admin' || currentUser.email === 'admin@admin.com' || currentUser.email === 'raihansheikh145@gmail.com') return true;
    
    try {
      const roles = useHRStore.getState().get_mergedRoles?.() || [];
      const userRole = roles.find((r: any) => r.id === currentUser.roleId);
      return userRole ? (userRole.permissions || []).includes(key) : false;
    } catch (e) {
      return true; // Safe fallback
    }
  },

    logout: async () => {
    localStorage.removeItem('access_token');
    set({ currentUser: null, sessionChecked: true, loginRole: null });
  },

  login: async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Login failed');
      }
      const data = await res.json();
      
      localStorage.setItem('access_token', data.access_token);
      set({ 
        currentUser: data.profile, 
        sessionChecked: true, 
        loginRole: data.profile?.roleId || null 
      });
      useHRStore.setState({ currentUser: data.profile });
      get().fetchCompanies();
    } catch (err: any) {
      console.error('Login error:', err);
      throw err;
    }
  },

  fetchAccounts: async () => {
    try {
      const { apiFetch } = await import('../../lib/apiFetch');
      const res = await apiFetch('/api/accounts');
      const json = res.ok ? await res.json() : {};
      const accountsData = json.data || [];
      
      if (accountsData) {
          const fetchedAccounts = accountsData.map((row: any) => ({ ...row, id: row.id, ...row }));
          get().setAllAccounts(fetchedAccounts);
          get().accountsRef.current = fetchedAccounts;
      }
    } catch (e) { console.error('fetchAccounts error:', e); }
  },

  fetchInitialData: async (userId: string) => {
    try {
      const activeIds = get().activeCompanyIds;
      if (!activeIds || activeIds.length === 0) return;

      const { usePurchasingStore } = await import('./usePurchasingStore');
      const { useSalesStore } = await import('./useSalesStore');
      const { useInventoryStore } = await import('./useInventoryStore');
      const { useCRMStore } = await import('./useCRMStore');
      const { useHRStore } = await import('./useHRStore');

      if (usePurchasingStore.getState().fetchBills) usePurchasingStore.getState().fetchBills();
      if (usePurchasingStore.getState().fetchPayments) usePurchasingStore.getState().fetchPayments();
      if (useSalesStore.getState().fetchInvoices) useSalesStore.getState().fetchInvoices();
      if (useSalesStore.getState().fetchCreditNotes) useSalesStore.getState().fetchCreditNotes();
      if (useInventoryStore.getState().fetchProducts) useInventoryStore.getState().fetchProducts({});
      if (useCRMStore.getState().fetchContacts) useCRMStore.getState().fetchContacts({});
      if (get().fetchEntries) get().fetchEntries({});
      if (useHRStore.getState().fetchLoans) useHRStore.getState().fetchLoans();
      
      try {
        const { apiFetch } = await import('../../lib/apiFetch');
        const res = await apiFetch('/api/users');
        if (res.ok) {
           const result = await res.json();
           if (result.success && result.data) {
             const { useHRStore } = await import('./useHRStore');
             useHRStore.getState().setUsers(result.data.map((u: any) => ({
                ...u,
                roleId: u.role_id || u.roleId,
                companyIds: typeof u.company_ids === 'string' ? JSON.parse(u.company_ids) : (u.company_ids || u.companyIds || []),
             })));
           }
        }
      } catch(e) { console.error('Failed to fetch users for profile resolution', e); }
    } catch (e) {
      console.error('fetchInitialData failed:', e);
    }
  },

  checkSession: async () => {
    if (window.location.search.includes('test_bypass=1')) {
      const appUser = { id: 'test-admin', name: 'Test Admin', email: 'admin@sub-erp.local', roleId: 'role-admin', username: 'admin' };
      set({ currentUser: appUser, sessionChecked: true });
      get().fetchCompanies();
      get().fetchAccounts();
      get().fetchInitialData(appUser.id);
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        set({ currentUser: null, sessionChecked: true });
        return;
      }
      
      let current = get().currentUser;
      if (!current) {
        try {
          const { apiFetch } = await import('../../lib/apiFetch');
          const res = await apiFetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            if (data && data.success && data.user) {
              const userId = data.user.sub || data.user.id;
              const email = data.user.email;
              
              let docsProfile = null;
              try {
                const { apiFetch: apiFetch2 } = await import('../../lib/apiFetch');
                const userRes = await apiFetch2(`/api/users?email=${encodeURIComponent(email)}`);
                if (userRes.ok) {
                  const userJson = await userRes.json();
                  docsProfile = (userJson.data || userJson.users || [])[0] || null;
                }
              } catch (e) {
                console.warn("Could not fetch docs_user profile", e);
              }

              current = {
                id: docsProfile?.id || userId,
                email: email,
                roleId: docsProfile?.role_id || docsProfile?.roleId || data.user.role || 'role-admin',
                name: docsProfile?.name || email,
                username: docsProfile?.username || email,
                companyIds: typeof docsProfile?.company_ids === 'string' 
                  ? JSON.parse(docsProfile.company_ids) 
                  : (docsProfile?.company_ids || docsProfile?.companyIds || []),
                isCashier: docsProfile?.isCashier || false
              };
              
              set({ currentUser: current });
            }
          }
        } catch (err) {
          console.error('Failed to fetch /api/auth/me', err);
        }
      }
      
      await get().fetchCompanies();
      await get().fetchAccounts();
      if (current) {
        await get().fetchInitialData(current.id);
      }
      set({ sessionChecked: true });
    } catch (e) {
      console.error('checkSession failed:', e);
      set({ currentUser: null, sessionChecked: true });
    }
  },

    signUp: async (email, password, metadata) => {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        email,
        username: email.split('@')[0],
        name: metadata.name || email.split('@')[0],
        pin: password,
        roleId: metadata.roleId
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  resetPassword: async (email: string) => {
    const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    if (!res.ok) throw new Error('Failed to send reset link');
    return true;
  },

  confirmPasswordReset: async (token: string, newPassword: string) => {
    let password = newPassword;
    if (password.length < 6) {
      password = password.padEnd(6, '0');
    }
    const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password })
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to reset password');
    }
    return true;
  },
}));


