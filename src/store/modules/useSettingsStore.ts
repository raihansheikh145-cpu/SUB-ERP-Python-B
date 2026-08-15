import { supabase } from '../../lib/supabase';
import { Invoice, Contact, CreditNote, Company, Account, Warehouse, ContactType, Bill, Payment, JournalEntry, Product, Loan } from '../../types';
import { apiFetch } from '../../lib/apiFetch';
import { create } from 'zustand';
import * as Types from '../../types/index';
import { useAccountingCoreStore } from './useAccountingCoreStore';
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


export const useSettingsStore = create<any>((set, get) => ({
  // TODO: Fix fallback
  // lastFetchedCompanyIdsRef: useRef<string[]>([]),
  // TODO: Fix fallback
  // activeCompanyIds: useAccountingCoreStore(state => state.activeCompanyIds),
  setActiveCompanyIds: (ids: string[] | ((prev: string[]) => string[])) => { 
    const state = get();
    const activeCompanyIds = useAccountingCoreStore.getState().activeCompanyIds || [];
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

    const nextIds = typeof ids === 'function' ? ids(useAccountingCoreStore.getState().activeCompanyIds) : ids;
    useAccountingCoreStore.setState({ activeCompanyIds: nextIds }); 
  },
  allBrands: [],
  setAllBrands: (val: any) => set((state: any) => ({ allBrands: typeof val === 'function' ? val(state.allBrands) : val })),
  setLocalOnlyBrands: (val: any) => set((state: any) => ({ allBrands: typeof val === 'function' ? val(state.allBrands) : val })),
  
  allCategories: [],
  setAllCategories: (val: any) => set((state: any) => ({ allCategories: typeof val === 'function' ? val(state.allCategories) : val })),
  setLocalOnlyCategories: (val: any) => set((state: any) => ({ allCategories: typeof val === 'function' ? val(state.allCategories) : val })),
  // TODO: Fix fallback
  // brandsRef: useRef<any[]>([]),
  allTasks: [],
  setAllTasks: (val: any) => set((state: any) => ({ allTasks: typeof val === 'function' ? val(state.allTasks) : val })),
  setLocalOnlyTasks: (val: any) => set((state: any) => ({ allTasks: typeof val === 'function' ? val(state.allTasks) : val })),
  emailSettings: {
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
    configured: false
  },
  setEmailSettings: (val: any) => set((state: any) => ({ emailSettings: typeof val === 'function' ? val(state.emailSettings) : val })),
  get_tasks: () => { 
    const state = get();
    const activeCompanyIds = useAccountingCoreStore.getState().activeCompanyIds || [];
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

    return (get().allTasks || []).filter(t => t && (activeCompanyIds.length === 0 || activeCompanyIds.includes(t?.companyId))); 
  },
  get_brands: () => { 
    const state = get();
    const activeCompanyIds = useAccountingCoreStore.getState().activeCompanyIds || [];
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

    return (get().allBrands || []).filter(b => b && (activeCompanyIds.length === 0 || activeCompanyIds.includes(b?.companyId))); 
  },
  get_categories: () => {
    const activeCompanyIds = useAccountingCoreStore.getState().activeCompanyIds || [];
    return (get().allCategories || []).filter(c => c && (activeCompanyIds.length === 0 || activeCompanyIds.includes(c?.companyId)));
  },
  toggleCompany: (companyId: string) => { 
    const state = get();
    const activeCompanyIds = useAccountingCoreStore.getState().activeCompanyIds || [];
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

    useAccountingCoreStore.getState().toggleCompany(companyId, currentUser); 
  },
  addCompany: async (company: Omit<Company, 'id'>) => { 
    const state = get();
    const activeCompanyIds = useAccountingCoreStore.getState().activeCompanyIds || [];
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

    const newId = ("temp-" + crypto.randomUUID());
    const newComp = { ...company, id: newId, currency: company.currency || 'BDT', code: company.code || company.name.substring(0, 3).toUpperCase() };
    
    // Optimistic Update
    useAccountingCoreStore.getState().setCompanies(prev => [...prev, newComp]);
    get().setActiveCompanyIds(prev => [...prev, newId]);
    
    const newCompanyAccounts = useAccountingCoreStore.getState().INITIAL_ACCOUNTS.map(a => ({ ...a, id: `${newId}-${a.code}`, companyId: newId } as Account));
    useAccountingCoreStore.getState().setAllAccounts(prev => [...prev, ...newCompanyAccounts]);
    
    const defaultWarehouse: Warehouse = {
      id: `wh-${newId}-main`,
      name: 'Main Warehouse',
      code: 'MAIN',
      address: company.address || 'Company Location',
      companyId: newId,
      isDefault: true
    };
    useAccountingCoreStore.getState().setAllWarehouses(prev => [...prev, defaultWarehouse]);
    
    const globalCashSaleId = 'contact-cash-sale-global';
    const existingCashSale = (allContacts || []).find(c => c.id === globalCashSaleId);
    
    if (existingCashSale) {
      const updatedCashSale = { 
        ...existingCashSale, 
        companyIds: Array.from(new Set([...(existingCashSale?.companyIds || []), newId]))
      };
      setAllContacts(prev => prev.map(c => c.id === globalCashSaleId ? updatedCashSale : c));
      
        apiFetch('/api/contacts/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json',  },
          body: JSON.stringify({ p_contact: {
            id: globalCashSaleId,
            data: updatedCashSale,
            company_id: newId,
            company_ids: updatedCashSale.companyIds,
            name: 'Cash Sale',
            type: 'CUSTOMER'
          } })
        }).then(res => res.json()).then(data => { if (!data.success) console.error(data.errors); });
    } else {
      const cashSaleContact: Contact = {
        id: globalCashSaleId,
        name: 'Cash Sale',
        type: ContactType.CUSTOMER,
        companyIds: [newId],
        address: '',
        phone: '',
        email: 'cash@sale.com',
        openingBalances: { [newId]: 0 },
        };
      setAllContacts(prev => [...prev, cashSaleContact]);
      
        apiFetch('/api/contacts/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json',  },
          body: JSON.stringify({ p_contact: {
            id: globalCashSaleId,
            data: cashSaleContact,
            company_id: newId,
            name: 'Cash Sale',
            type: 'CUSTOMER'
          } })
        }).then(res => res.json()).then(data => { if (!data.success) console.error(data.errors); });
    }
    
    if (currentUser) {
      useAccountingCoreStore.getState().setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, companyIds: [...(u?.companyIds || []), newId] } : u));
      try {
        const currentUser = useAccountingCoreStore.getState().currentUser;
        if (currentUser?.id) {
          await apiFetch('/api/companies/users', {
            method: 'POST',
            body: JSON.stringify({
              user_id: currentUser.id,
              company_id: newId,
              role: 'ADMIN'
            })
          });
          console.log('[Store] Associated current user with new company in DB via API');
        }
      } catch (err) {
        console.error('[Store] Failed to associate user with company:', err);
      }
    } 
  },
  updateCompany: (id: string, updates: Partial<Company>) => { 
    const state = get();
    const activeCompanyIds = useAccountingCoreStore.getState().activeCompanyIds || [];
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

    useAccountingCoreStore.getState().setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c)); 
  },
  switchCompany: (companyId: string) => { 
    const state = get();
    const activeCompanyIds = useAccountingCoreStore.getState().activeCompanyIds || [];
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

    get().setActiveCompanyIds([companyId]); 
  },
  addCategory: async (name: string) => { 
    const state = get();
    const activeCompanyIds = useAccountingCoreStore.getState().activeCompanyIds || [];
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

    const dbId = ("temp-" + crypto.randomUUID());
    const activeCids = useAccountingCoreStore.getState().activeCompanyIds;
    const newCategory = {
      id: dbId,
      companyIds: activeCids,
      name
    };
    try {
      const { supabase } = await import('../../lib/supabase');
      
      const resp = await apiFetch('/api/settings/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',  },
        body: JSON.stringify({ categories: [newCategory] })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.error);
      if (data.success) {
        get().setLocalOnlyCategories((prev: any[]) => [newCategory, ...prev]);
      }
      return newCategory;
    } catch (e) {
      console.error(e);
      alert('Failed to add category');
    } 
  },
  deleteTask: async (...args: any[]) => { 
    const state = get();
    const activeCompanyIds = useAccountingCoreStore.getState().activeCompanyIds || [];
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

    alert("Deletion is restricted by backend policy to maintain audit integrity."); 
  },
  addBrand: async (brand: any) => { 
    const state = get();
    const activeCompanyIds = useAccountingCoreStore.getState().activeCompanyIds || [];
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

    const dbId = ("temp-" + crypto.randomUUID());
    const activeCids = useAccountingCoreStore.getState().activeCompanyIds;
    const newBrand = {
      id: dbId,
      companyIds: activeCids,
      ...brand
    };
    try {
      const { supabase } = await import('../../lib/supabase');
      
      const resp = await apiFetch('/api/settings/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',  },
        body: JSON.stringify({ brands: [newBrand] })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.error);
      get().setLocalOnlyBrands((prev: any[]) => [newBrand, ...prev]);
      return newBrand;
    } catch (e) {
      console.error(e);
      alert('Failed to add brand');
    } 
  },
}));
