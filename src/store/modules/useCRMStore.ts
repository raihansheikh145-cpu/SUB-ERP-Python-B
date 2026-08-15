import { supabase } from '../../lib/supabase';
import { Invoice, Contact, CreditNote, Company, Account, Warehouse, ContactType, Bill, Payment, JournalEntry, Product, Loan } from '../../types';
import { apiFetch } from '../../lib/apiFetch';
import { create } from 'zustand';
import * as Types from '../../types/index';
import { useAccountingCoreStore } from './useAccountingCoreStore';
import { useSettingsStore } from './useSettingsStore';
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


export const useCRMStore = create<any>((set, get) => ({
  partnerBalances: {},
  setPartnerBalances: (val: any) => set((state: any) => ({ partnerBalances: typeof val === 'function' ? val(state.partnerBalances) : val })),
  allContacts: [],
  setAllContacts: (val: any) => set((state: any) => ({ allContacts: typeof val === 'function' ? val(state.allContacts) : val })),
  setLocalOnlyContacts: (val: any) => set((state: any) => ({ allContacts: typeof val === 'function' ? val(state.allContacts) : val })),
  searchContactsOnDemand: async (query: string) => { 
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

    if (!query || query.trim().length === 0) return;
    const activeCids = activeCompanyIds && activeCompanyIds.length > 0 
      ? activeCompanyIds 
      : (companies && companies.length > 0 ? [companies[0].id] : []);
    
    if (activeCids.length === 0) return;
    
    try {
      // supabase import removed
      console.log("[Store] Searching contacts on-demand for:", query);
      
      // supaQuery replaced by apiFetch getDocs call
      let terms = query.trim().split(/\s+/).filter(Boolean);
        if (terms.length > 5 || query.trim().length > 50) terms = [query.trim()];
      terms.forEach(term => {
        supaQuery = supaQuery.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
      });
      
      const { data, error } = await supaQuery.limit(5000);
        
      if (error) {
        console.error("[Store] searchContactsOnDemand Supabase error:", error);
        return;
      }
    
      if (data && data.length > 0) {
        setAllContacts(prev => {
          const prevArr = Array.isArray(prev) ? prev : [];
          const existingIds = new Set(prevArr.map(p => p.id));
          const newItems = data.filter(p => p && !existingIds.has(p.id));
          return [...prevArr, ...newItems];
        });
      }
    } catch (err) {
      console.error("[Store] searchContactsOnDemand error:", err);
    } 
  },
  // TODO: Fix fallback
  // contactsRef: useRef<Contact[]>([]),
  paginatedContacts: [],
  setPaginatedContacts: (val: any) => set((state: any) => ({ paginatedContacts: typeof val === 'function' ? val(state.paginatedContacts) : val })),
  contactCount: 0,
  setContactCount: (val: any) => set((state: any) => ({ contactCount: typeof val === 'function' ? val(state.contactCount) : val })),
  isContactsLoading: false,
  setIsContactsLoading: (val: any) => set((state: any) => ({ isContactsLoading: typeof val === 'function' ? val(state.isContactsLoading) : val })),
  fetchContacts: async (options: any) => { 
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

    const cacheKey = 'fetchContacts_' + JSON.stringify(activeCompanyIds) + '_' + JSON.stringify(options && options.nativeEvent ? {} : options);
    const isForce = options?.forceRefresh;
    const cache = fetchCacheMap.get(cacheKey);
    const now = Date.now();
    if (!isForce && cache) {
      if (cache.isFetching) return;
      if (now - cache.lastFetched < 1000) return;
    }
    fetchCacheMap.set(cacheKey, { isFetching: true, lastFetched: cache ? cache.lastFetched : 0 });
    
    get().setIsContactsLoading(true);
    try {
      const { dbService } = await import('../../services/db');
      const { data, count } = await dbService.getPaginatedDocs('docs_contacts', {
        ...options,
        ...( (options?.type === 'EMPLOYEE' || options?.filters?.type === 'EMPLOYEE') ? { companyIds: activeCompanyIds } : {} )
      });
      
      // Deduplicate paginated contacts to hide legacy CT-IMP records if real UUID exists
      let filteredData = (data || []).filter((c) => {
        if (!c.id.startsWith('CT-IMP-')) return true;
        return !(data || []).some(other => !other.id.startsWith('CT-IMP-') && String(other.name||'').toLowerCase().trim() === String(c.name||'').toLowerCase().trim());
      });
    
      // Fallback client-side filter to guarantee tab correctness
      if (options?.filters?.type) {
         const t = options.filters.type;
         if (t === 'CUSTOMER') filteredData = filteredData.filter(c => c.type === 'CUSTOMER' || c.is_customer);
         else if (t === 'VENDOR') filteredData = filteredData.filter(c => c.type === 'VENDOR' || c.is_vendor);
         else if (t === 'LENDER') filteredData = filteredData.filter(c => c.type === 'LENDER' || c.is_lender);
         else if (t === 'EMPLOYEE') filteredData = filteredData.filter(c => c.type === 'EMPLOYEE');
      }
    
      get().setPaginatedContacts(filteredData);
    
      get().setContactCount(count);
      
      if (data && data.length > 0) {
        setAllContacts(prev => {
          const prevArr = Array.isArray(prev) ? prev : [];
          const existingIds = new Set(prevArr.map(p => p.id));
          const newItems = data.filter((p: any) => p && !existingIds.has(p.id));
          if (newItems.length === 0) return prevArr;
          return [...prevArr, ...newItems];
        });
      }
    } catch (err) {
      console.error('fetchContacts failed:', err);
    } finally {
      fetchCacheMap.set(cacheKey, { isFetching: false, lastFetched: Date.now() });
      get().setIsContactsLoading(false);
    } 
  },
  get_contacts: () => { 
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

    const activeCids = activeCompanyIds.length > 0 
  ? activeCompanyIds 
  : (companies && companies.length > 0 ? [companies[0].id] : []);

// Deduplicate logic: filter out CT-IMP- duplicates if a modern UUID exists with same name
const validContacts = allContacts || [];
const nonLegacyNames = new Set(
  validContacts
    .filter(c => c && c.id && !String(c.id).startsWith('CT-IMP-'))
    .map(c => String(c.name || '').toLowerCase().trim())
);

return validContacts.map(c => {
  if (c && c.id && String(c.id).startsWith('contact-cash-sale')) {
    return { ...c, name: 'Cash Sale' };
  }
  return c;
}).filter(c => {
  if (!c) return false;
  const cIdStr = String(c.id);
  if (cIdStr.startsWith('CT-IMP-') && nonLegacyNames.has(String(c.name || '').toLowerCase().trim())) {
    return false; // Skip legacy duplicate
  }
  return (
    cIdStr.startsWith('contact-cash-sale') || 
    (c.type && c.type.toUpperCase() === 'CUSTOMER') || // Show all customers everywhere as per request
    (c.type && c.type.toUpperCase() === 'VENDOR') || // Show all vendors everywhere as per request
    (c.type && c.type.toUpperCase() === 'LENDER') || c.is_lender || c.isLender ||
    (c.type && c.type.toUpperCase() === 'LOAN') ||
    ((c?.companyId || c?.company_id) && activeCids.includes(c?.companyId || c?.company_id)) || 
    (c?.companyIds || c?.company_ids || []).some((id: any) => activeCids.includes(id))
  );
});; 
  },
  recordPartnerDiscount: async (contactId: string, amount: number, date: string, description: string) => { 
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

    // supabase import removed
    const res = await apiFetch('/api/journals/partner-discount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',  },
      body: JSON.stringify({ p_contact_id: contactId, p_amount: amount, p_date: date, p_description: description, p_company_id: activeCompanyIds[0] })
    });
    const json = await res.json();
    const error = res.ok && json.success ? null : new Error(json.error || 'Failed to process partner discount');
    if (error) {
      console.error('Partner discount registration failed:', error);
      throw error;
    } 
  },
  getPartnerBalance: (contactId: string, companyId?: string) => { 
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

    const contact = (allContacts || []).find(c => c.id === contactId);
    if (!contact) return 0;
    
    let balance = get().partnerBalances[contactId] || 0;
    if (contact.type === ContactType.VENDOR) {
      return -(Math.round(balance * 100) / 100);
    }
    return Math.round(balance * 100) / 100; 
  },
  bulkImportContacts: async (importedContacts: any[]) => { 
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

    console.log('bulkImportContacts: starting for', importedContacts.length, 'records');
    const defaultCompanyId = activeCompanyIds[0] || (companies && companies[0]?.id);
    const timestamp = Date.now();
    
    const updatedContactsList = [...(get().contactsRef.current || [])];
    const contactsToUpsertMap: Record<string, any> = {};
    
    importedContacts.forEach(c => {
      const contactId = c.id || ("temp-" + crypto.randomUUID());
      const existingIdx = updatedContactsList.findIndex(ec => 
        (ec.id === contactId) || 
        (ec.externalId && c.externalId && ec.externalId === c.externalId) ||
        (ec.name && c.name && ec.name.toLowerCase() === c.name.toLowerCase())
      );
    
      const contactData = {
        ...c,
        id: existingIdx >= 0 ? updatedContactsList[existingIdx].id : contactId,
        companyIds: c.companyIds?.length ? c.companyIds : [defaultCompanyId].filter(Boolean),
      };
    
      if (existingIdx >= 0) {
        const oldContact = updatedContactsList[existingIdx];
        const merged = { ...oldContact, ...contactData };
        updatedContactsList[existingIdx] = merged;
        contactsToUpsertMap[merged.id] = {
            id: merged.id,
            data: merged,
          company_id: merged.companyIds[0] || defaultCompanyId,
          name: merged.name,
          };
      } else {
        updatedContactsList.push(contactData as any);
        contactsToUpsertMap[contactData.id] = {
          id: contactData.id,
          data: contactData,
          company_id: contactData.companyIds[0] || defaultCompanyId,
          name: contactData.name,
          };
      }
    });
    
    try {
      const contactsToUpsert = Object.values(contactsToUpsertMap);
      if (contactsToUpsert.length > 0) {
        for (let i = 0; i < contactsToUpsert.length; i += 1000) {
          const res = await withRetry(async () => {
             const resp = await apiFetch('/api/contacts/bulk-upsert', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json',  },
               body: JSON.stringify({ p_contacts: contactsToUpsert.slice(i, i + 1000) })
             });
             const json = await resp.json();
             return { error: resp.ok ? null : new Error(json.error || 'Bulk Upsert Error') };
          });
          if (res.error) throw new Error(`Contacts sync failed: ${res.error.message}`);
        }
      }
    } catch (err: any) {
      console.error('bulkImportContacts: DB push failed', err);
      throw err;
    }
    
    // Finally update local state and refs!
    get().contactsRef.current = updatedContactsList;
    get().setLocalOnlyContacts(updatedContactsList); 
  },
  addContact: async (contact: any) => { 
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

    const primaryCompanyId = (contact.companyIds && contact.companyIds[0]) || activeCompanyIds[0] || (companies[0] && companies[0].id) || 'd9dbb775-6839-4201-9dda-caa39e271201';
    const targetCompanyIds = (contact.companyIds && contact.companyIds.length > 0) ? contact.companyIds : (activeCompanyIds.length > 0 ? activeCompanyIds : [primaryCompanyId]);

    const newContact: Contact = {
      ...contact,
      id: contact.id || ("temp-" + crypto.randomUUID()),
      companyIds: targetCompanyIds,
      };
    // Attempt local first
    get().setLocalOnlyContacts(prev => [newContact, ...prev]);
    get().setPaginatedContacts(prev => [newContact, ...prev]); get().setAllContacts(prev => [newContact, ...prev]);
    
    // Save to DB
    const res = await apiFetch('/api/contacts/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',  },
      body: JSON.stringify({ p_contact: {
        id: newContact.id,
        company_id: primaryCompanyId,
        company_ids: targetCompanyIds,
        name: newContact.name,
        type: newContact.type,
        email: newContact.email,
        phone: newContact.phone,
        address: newContact.address,
        is_customer: newContact.isCustomer || newContact.type === 'CUSTOMER' || (newContact.type as any) === 'PARTNER',
        is_vendor: newContact.isVendor || newContact.type === 'VENDOR' || (newContact.type as any) === 'PARTNER',
        is_lender: newContact.isLender || (newContact.type as any) === 'LENDER',
        opening_balances: newContact.openingBalances,
        data: newContact,
        } })
    });
    const json = await res.json();
    let error = (res.ok && json.success !== false) ? null : new Error(
      (json.errors && json.errors.length > 0 && json.errors[0].error) || json.error || json.detail || json.message || 'API Error'
    );
    
    if (error) {
      console.error('Failed to add contact to DB', error);
      throw error;
    }
    
    return newContact; 
  },
  updateContact: async (id: string, updates: Partial<Contact>) => { 
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

    const existing = (allContacts || []).find(c => c.id === id);
    if (!existing) return;
    
    const updated = { ...existing, ...updates, };
    
    const primaryCompanyId = (updated.companyIds && updated.companyIds[0]) || activeCompanyIds[0] || (companies[0] && companies[0].id) || 'd9dbb775-6839-4201-9dda-caa39e271201';
    const targetCompanyIds = (updated.companyIds && updated.companyIds.length > 0) ? updated.companyIds : (activeCompanyIds.length > 0 ? activeCompanyIds : [primaryCompanyId]);

    const res = await apiFetch('/api/contacts/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',  },
      body: JSON.stringify({ p_contact: {
        id: updated.id,
        company_id: primaryCompanyId,
        company_ids: targetCompanyIds,
        name: updated.name,
        type: updated.type,
        email: updated.email,
        phone: updated.phone,
        address: updated.address,
        is_customer: updated.isCustomer || updated.type === 'CUSTOMER' || updated.type === 'PARTNER',
        is_vendor: updated.isVendor || updated.type === 'VENDOR' || updated.type === 'PARTNER',
        is_lender: updated.isLender || updated.type === 'LENDER',
        opening_balances: updated.openingBalances,
        data: updated,
        } })
    });
    const json = await res.json();
    let error = (res.ok && json.success !== false) ? null : new Error(json.error || json.detail || json.message || 'API Error');
    
    if (error) {
      console.error('Failed to update contact in DB', error);
      throw error;
    } 
    
    // Update local state on success
    get().setAllContacts((prev: any) => 
      Array.isArray(prev) ? prev.map((c: any) => c.id === id ? updated : c) : []
    );
    get().setPaginatedContacts((prev: any) => 
      Array.isArray(prev) ? prev.map((c: any) => c.id === id ? updated : c) : []
    );
  },
}));
