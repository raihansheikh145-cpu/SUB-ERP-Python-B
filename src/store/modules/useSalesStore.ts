import { Invoice, Contact, CreditNote, Company, Account, Warehouse, ContactType, Bill, Payment, JournalEntry, Product, Loan } from '../../types';
import { apiFetch } from '../../lib/apiFetch';
import { create } from 'zustand';
import * as Types from '../../types/index';
import { useAccountingCoreStore } from './useAccountingCoreStore';
import { useSettingsStore } from './useSettingsStore';
import { useCRMStore } from './useCRMStore';
import { useHRStore } from './useHRStore';
import { useInventoryStore } from './useInventoryStore';
import { usePurchasingStore } from './usePurchasingStore';
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


export const useSalesStore = create<any>((set, get) => ({
  allInvoices: [],
  setAllInvoices: (val: any) => set((state: any) => ({ allInvoices: typeof val === 'function' ? val(state.allInvoices) : val })),
  setLocalOnlyInvoices: (val: any) => set((state: any) => ({ allInvoices: typeof val === 'function' ? val(state.allInvoices) : val })),
  
  applyCreditToInvoice: async (creditNoteId: string, invoiceId: string, amount: number) => {
    try {
      const { apiFetch } = await import('../../lib/apiFetch');
      const resp = await apiFetch('/api/credit-notes/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credit_note_id: creditNoteId, invoice_id: invoiceId, amount })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.error || 'Failed to apply credit');
      
      const { usePurchasingStore } = await import('./usePurchasingStore');
      if (usePurchasingStore.getState().fetchPayments) {
        await usePurchasingStore.getState().fetchPayments();
      }
      if (get().fetchInvoices) {
         await get().fetchInvoices();
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  paginatedInvoices: [],
  setPaginatedInvoices: (val: any) => set((state: any) => ({ paginatedInvoices: typeof val === 'function' ? val(state.paginatedInvoices) : val })),
  invoiceCount: 0,
  setInvoiceCount: (val: any) => set((state: any) => ({ invoiceCount: typeof val === 'function' ? val(state.invoiceCount) : val })),
  isInvoicesLoading: false,
  setIsInvoicesLoading: (val: any) => set((state: any) => ({ isInvoicesLoading: typeof val === 'function' ? val(state.isInvoicesLoading) : val })),
  allCreditNotes: [],
  setAllCreditNotes: (val: any) => set((state: any) => ({ allCreditNotes: typeof val === 'function' ? val(state.allCreditNotes) : val })),
  setLocalOnlyCreditNotes: (val: any) => set((state: any) => ({ allCreditNotes: typeof val === 'function' ? val(state.allCreditNotes) : val })),
  fetchInvoices: async (options: any) => { 
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

    const cacheKey = 'fetchInvoices_' + JSON.stringify(activeCompanyIds) + '_' + JSON.stringify(options && options.nativeEvent ? {} : options);
    const isForce = options?.forceRefresh;
    const cache = fetchCacheMap.get(cacheKey);
    const now = Date.now();
    if (!isForce && cache) {
      if (cache.isFetching) return;
      if (now - cache.lastFetched < 1000) return;
    }
    fetchCacheMap.set(cacheKey, { isFetching: true, lastFetched: cache ? cache.lastFetched : 0 });
    
    get().setIsInvoicesLoading(true);
    try {
      const { dbService } = await import('../../services/db');
      const { data, count } = await dbService.getPaginatedDocs('docs_invoices', {
        ...options,
        companyIds: activeCompanyIds,
      });
      get().setPaginatedInvoices((prev: any[]) => {
        return data.map((newI: any) => {
          const oldI = prev.find(i => i.id === newI.id);
          if (oldI && oldI.status === 'POSTED' && (newI.status === 'DRAFT' || newI.status === 'PENDING')) {
            return { ...newI, status: 'POSTED' };
          }
          if (oldI && oldI.status === 'PAID' && (newI.status === 'DRAFT' || newI.status === 'PENDING' || newI.status === 'POSTED')) {
            return { ...newI, status: 'PAID' };
          }
          return newI;
        });
      });
      get().setInvoiceCount(count);
    
      if (data && data.length > 0) {
        const cIds = data.map((i: any) => i.customerId).filter(Boolean);
        const pIds = data.flatMap((i: any) => i.items || []).map((it: any) => it.productId).filter(Boolean);
        ensureEntitiesMetadata(cIds, pIds);
      }
    } catch (err) {
      console.error('fetchInvoices failed:', err);
    } finally {
      fetchCacheMap.set(cacheKey, { isFetching: false, lastFetched: Date.now() });
      get().setIsInvoicesLoading(false);
    } 
  },
  fetchCreditNotes: async (options?: any) => { 
    const activeCompanyIds = useAccountingCoreStore.getState().activeCompanyIds || [];
    const cacheKey = 'fetchCreditNotes_' + JSON.stringify(activeCompanyIds) + '_' + JSON.stringify(options && options.nativeEvent ? {} : options);
    const isForce = options?.forceRefresh;
    const cache = fetchCacheMap.get(cacheKey);
    const now = Date.now();
    if (!isForce && cache) {
      if (cache.isFetching) return;
      if (now - cache.lastFetched < 1000) return;
    }
    fetchCacheMap.set(cacheKey, { isFetching: true, lastFetched: cache ? cache.lastFetched : 0 });
    
    try {
      const { dbService } = await import('../../services/db');
      const { data, count } = await dbService.getPaginatedDocs('docs_credit_notes', {
        ...options,
        companyIds: activeCompanyIds,
      });
      get().setAllCreditNotes(data);
    } catch (err) {
      console.error('fetchCreditNotes failed:', err);
    } finally {
      fetchCacheMap.set(cacheKey, { isFetching: false, lastFetched: Date.now() });
    } 
  },
  get_invoices: () => { 
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

    return (allInvoices || []).filter(i => i && i?.companyId && activeCompanyIds.includes(i?.companyId)); 
  },
  get_creditNotes: () => { 
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

    return (allCreditNotes || []).filter(cn => cn && cn?.companyId && activeCompanyIds.includes(cn?.companyId)); 
  },
  deleteInvoice: async (id: string) => { 
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

    alert("Deletion is restricted by backend policy to maintain audit integrity. Use 'Cancel' or 'Reverse' instead."); 
  },
  deleteCreditNote: async (id: string) => { 
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

    alert("Deletion is restricted by backend policy to maintain audit integrity. Use 'Cancel' or 'Reverse' instead."); 
  },
  resetCreditNoteToDraft: async (id: string) => { 
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

    const cn = allCreditNotes.find(c => c.id === id);
    if (!cn || cn.status !== 'POSTED') return;
    
    if (cn.journalEntryId) {
      setLocalOnlyEntries(prev => prev.map(e => e.id === cn.journalEntryId ? { ...e, status: 'DRAFT' } : e));
    }
    setLocalOnlyCreditNotes(prev => prev.map(c => c.id === id ? { ...c, status: 'DRAFT' } : c));
    
    await apiFetch('/api/documents/unpost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',  },
      body: JSON.stringify({ type: 'CREDIT_NOTE', id, journalEntryId: cn.journalEntryId })
    }); 
  },
  addInvoice: async (invoice: Omit<Invoice, 'id' | 'companyId' | 'createdById'>, targetCompanyId?: string) => { 
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

    const companyId = targetCompanyId || (invoice as any).companyId || activeCompanyIds[0];
    const company = companies.find(c => c.id === companyId);
    const companyCode = company?.code || 'CO';
    const newId = ("temp-" + crypto.randomUUID());
    
    // Auto-seed Cash Sale contact if it's being used and missing
    const cashSaleId = `contact-cash-sale-global`;
    if (invoice.customerId === 'contact-cash-sale' || invoice.customerId === cashSaleId || String(invoice.customerId).includes('cash-sale')) {
      const cashSaleExists = (allContacts || []).some(o => o.id === cashSaleId);
      if (!cashSaleExists) {
        console.log('addInvoice: Seeding Global Cash Sale contact');
        const cashSaleContact: Contact = {
          id: cashSaleId,
          name: 'Cash Sale',
          type: ContactType.CUSTOMER,
          email: 'cash@sale.com',
          companyIds: Array.from(new Set([...activeCompanyIds, companyId])),
          openingBalances: {}
        };
        // Background push to DB
        
          apiFetch('/api/contacts/upsert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json',  },
            body: JSON.stringify({ p_contact: {
              id: cashSaleContact.id,
              data: cashSaleContact,
              company_id: companyId,
              name: 'Cash Sale',
              type: 'CUSTOMER',
              } })
          }).then(res => res.json()).then(data => { if (!data.success) console.error("Failed to seed Cash Sale contact:", data.errors); });
        setAllContacts(prev => [...(prev || []), cashSaleContact]);
      } else {
        // Ensure current company is in the global contact's companyIds
        const existing = (allContacts || []).find(c => c.id === cashSaleId);
        if (existing && !existing.companyIds.includes(companyId)) {
          const updated = { ...existing, companyIds: [...existing.companyIds, companyId] };
          setAllContacts(prev => prev.map(c => c.id === cashSaleId ? updated : c));
          
            apiFetch('/api/contacts/upsert', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json',  },
              body: JSON.stringify({ p_contact: { ...updated, company_ids: updated.companyIds } })
            }).then(r => r.json()).then(res => {
              if (!res.success) console.error("Failed to update Cash Sale contact:", res.errors);
            });
        }
      }
      // Ensure the invoice uses the global cash sale ID
      (invoice as any).customerId = cashSaleId;
    }
    
    // Auto-generate number if not provided or if it's 'DRAFT'
    let number = invoice.number;
    const isDraft = !number || number === 'DRAFT' || number === 'NEW' || String(number).startsWith('DRAFT-');
    if (isDraft) {
      number = null as any; // Trigger DB sequencing
    }
    
    // Frontend logic removed. Calculation moved to Supabase DB Triggers.
    
    const isCashSaleAdd = invoice.customerId && (
      String(invoice.customerId).toLowerCase().includes('cash-sale') ||
      (allContacts || []).some(c => c.id === invoice.customerId && String(c.name || '').toLowerCase().trim() === 'cash sale')
    );
    const typeValue = (isCashSaleAdd && (!invoice.paymentMethod || invoice.paymentMethod === 'CASH')) ? 'CASH_SALE' : (isCashSaleAdd ? 'STANDARD' : (invoice as any).type);
    const newInvoice: any = {
      ...invoice,
      type: typeValue,
      id: newId, 
      number: isDraft ? `DRAFT-${newId.split('-')[1]}` : number, // Use unique draft number for state/trigger
      companyId,
      companyCode,
      createdById: currentUser?.id || 'user-1',
      preparedBy: (invoice as any).preparedBy || currentUser?.name || currentUser?.username || (currentUser?.email ? currentUser.email.split('@')[0] : '') || 'System',
      messages: [{
        id: ("temp-" + crypto.randomUUID()),
        authorId: currentUser?.id || 'user-1',
        body: `Invoice created`,
        date: formatDateTime(new Date()),
        type: 'notification'
      }]
    };
    
    let attempts = 0;
    let success = false;
    let savedNumber = '';
    
    while (attempts < 2 && !success) {
      try {
        attempts++;
        console.log(`addInvoice: Insert attempt ${attempts} for ${newId} with number ${number}`);
        // Call backend API to handle everything securely
        
        const { error, data: rpcData } = await withRetry(async () => {
          const res = await apiFetch('/api/invoices/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json',  },
            body: JSON.stringify({ p_invoice: { ...newInvoice, status: 'DRAFT' } })
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || json.detail || 'API Error');
          return { data: json, error: null };
        });
        
        if (error) {
          console.error(`addInvoice: Supabase insert error:`, error.message, error.details);
          throw new Error(`Database Error (Add Invoice): ${error.message}`);
        }
        
        const processedInvoice = rpcData?.processed_invoice;
        if (processedInvoice) {
            Object.assign(newInvoice, processedInvoice);
        }
        // Fetch fully calculated data
        const _invRes = await apiFetch(`/api/docs/single?table=docs_invoices&id=${newInvoice.id}`); const fetchReq = _invRes.ok ? (await _invRes.json()).data : null;
        if (fetchReq) {
            const _linesRes = await apiFetch(`/api/docs?table=docs_invoice_lines&limit=1000`);
            if (_linesRes.ok) {
                const _linesData = (await _linesRes.json()).data || [];
                const _myLines = _linesData.filter((l: any) => l.invoice_id === newInvoice.id || l.invoiceid === newInvoice.id);
                const mapLineItem = (l: any) => ({
                    ...l,
                    productId: l.product_id || l.productId,
                    unitPrice: l.unit_price || l.unitPrice,
                    lineValue: l.line_value !== undefined ? l.line_value : l.lineValue,
                    discountMode: l.discount_mode || l.discountMode,
                    discountRate: l.discount_rate || l.discountRate,
                    discountValue: l.discount_value || l.discountValue,
                    serialNumbers: l.serial_numbers || l.serialNumbers,
                    type: l.type
                });
                fetchReq.items = _myLines.map(mapLineItem).sort((a: any, b: any) => (a.display_index ?? 0) - (b.display_index ?? 0));
            }
        }
        if (fetchReq && fetchReq) {
             Object.assign(newInvoice, fetchReq);
        }
        success = true;
        savedNumber = newInvoice.number || '';
        console.log(`addInvoice: Successfully saved with number: ${savedNumber}`);
        newInvoice.number = savedNumber;
        if (newInvoice.messages && newInvoice.messages[0]) {
           newInvoice.messages[0].body = `Invoice created with number ${savedNumber}`;
        }
      } catch (err) {
        console.error(`Invoice insert attempt ${attempts} failed:`, err);
        if (attempts >= 2) throw err;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    // Call setLocalOnlyInvoices to avoid double database sync
    get().setLocalOnlyInvoices(prev => [newInvoice, ...prev]);
    get().setPaginatedInvoices(prev => [newInvoice, ...prev]);
    get().fetchInvoices({ forceRefresh: true });
    return newInvoice; 
  },
  postInvoice: async (invoice: Invoice) => { 
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

    let invoiceToSave = { ...invoice };
    const companyId = invoiceToSave?.companyId || activeCompanyIds[0];
    if (invoiceToSave) invoiceToSave.companyId = companyId;
    
    const isCashSale = invoiceToSave.customerId && (
      String(invoiceToSave.customerId).toLowerCase().includes('cash-sale') ||
      (allContacts || []).some(c => c.id === invoiceToSave.customerId && String(c.name || '').toLowerCase().trim() === 'cash sale')
    );
    
    if (isCashSale && (!invoiceToSave.paymentMethod || invoiceToSave.paymentMethod === 'CASH')) {
      invoiceToSave.type = 'CASH_SALE';
    } else if (isCashSale) {
      invoiceToSave.type = 'STANDARD';
    }
    
    // Frontend logic removed. Calculation moved to Supabase DB Triggers.
    
    const initialStatus = invoiceToSave.status;
    const step2Status = isCashSale ? 'POSTED' : initialStatus;
    
    try {
      // Call the RPC to post the invoice
      const resp = await apiFetch('/api/invoices/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',  },
        body: JSON.stringify({ p_invoice_id: invoiceToSave.id, p_company_id: invoiceToSave.companyId })
      });
      const data = await resp.json();
      const rpcError = resp.ok && data.success ? null : new Error(data.error || 'Failed to post invoice');
      const rpcData = data;
      
      if (rpcError) throw rpcError;
    
      // Fetch the updated record
      const _invUpdRes = await apiFetch(`/api/docs/single?table=docs_invoices&id=${invoiceToSave.id}`); const updatedRecords = _invUpdRes.ok ? [(await _invUpdRes.json()).data] : []; const updError = _invUpdRes.ok ? null : new Error('Failed');
      
      if (updError) throw updError;
      
      if (updatedRecords && updatedRecords.length > 0) {
        const dbRecord = updatedRecords[0];
        
        // Merge the freshly calculated backend data into our local object
        if (dbRecord) {
           invoiceToSave = { ...invoiceToSave, ...dbRecord };
        }
        
        const finalNumber = dbRecord.invoice_number || invoiceToSave.number;
        invoiceToSave.number = finalNumber;
        (invoiceToSave as any).invoice_number = finalNumber;
        invoiceToSave.status = dbRecord.status as any;
      } else {
        invoiceToSave.status = step2Status as any;
      }
    } catch (err: any) {
      console.error('Invoice update failed:', err);
      throw new Error(`Invoice posting failed on the server: ${err.message || 'Unknown error'}`);
    }
    
    // Immediately update local store invoices state with the posted invoice
    get().setLocalOnlyInvoices(prev => prev.map(i => i.id === invoiceToSave.id ? invoiceToSave : i));
    get().setPaginatedInvoices((prev: any[]) => prev.map((i: any) => i.id === invoiceToSave.id ? invoiceToSave : i));
    
    // Refresh Local State (Timeout) to catch asynchronous DB updates like ledger entries, updated inventory, products, etc., etc.
    setTimeout(async () => {
      try {
        const { data: latestInv } = await (async () => {
          let allData = [];
          for (let offset = 0; offset < 20000; offset += 1000) {
            const res = { data: null }; // Migrated to /api/docs endpoint
            if (!res.data) break;
            allData = allData.concat(res.data);
            if (res.data.length < 1000) break;
          }
          return { data: allData };
        })();
        if (latestInv) useAccountingCoreStore.getState().setLocalOnlyInventoryTransactions(latestInv.map(row => ({ ...row, ...row, id: row.id, company_id: row.company_id })));
        
        const _prodRes = await apiFetch(`/api/docs?table=docs_products&company_ids=${companyId}`); const latestProds = _prodRes.ok ? (await _prodRes.json()).data : null;
        if (latestProds) useAccountingCoreStore.getState().setLocalOnlyProducts(latestProds.map(row => ({ ...row, ...row, id: row.id, companyId: row.company_id })));
        
        const { dbService } = await import('../../services/db');
        const cIds = [companyId];
        
        const { data: latestJournals } = await dbService.getPaginatedDocs('docs_journals', { companyIds: cIds, limit: 100, sortField: 'updated_at', sortOrder: 'desc' });
        if (latestJournals) setLocalOnlyEntries(prev => { const n = new Set(latestJournals.map(i=>i.id)); return [...latestJournals, ...prev.filter(i => !n.has(i.id))].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()); });
        
        const { data: latestInvoices } = await dbService.getPaginatedDocs('docs_invoices', { companyIds: cIds, limit: 100, sortField: 'updated_at', sortOrder: 'desc' });
        if (latestInvoices) {
          get().setLocalOnlyInvoices(prev => { const n = new Set(latestInvoices.map(i=>i.id)); return [...latestInvoices, ...prev.filter(i => !n.has(i.id))].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()); });
          get().setPaginatedInvoices(latestInvoices);
        }
    
        const { data: latestPayments } = await dbService.getPaginatedDocs('docs_payments', { companyIds: cIds, limit: 100, sortField: 'updated_at', sortOrder: 'desc' });
        if (latestPayments) useAccountingCoreStore.getState().setLocalOnlyPayments(prev => { const n = new Set(latestPayments.map(i=>i.id)); return [...latestPayments, ...prev.filter(i => !n.has(i.id))].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()); });
      } catch (e) { console.warn('postInvoice: Refresh failed', e); }
    }, 800);
    
    useAccountingCoreStore.getState().refreshBalances();
    return invoiceToSave; 
  },
  updateInvoice: async (id: string, updates: Partial<Invoice>) => { 
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

    const inv = allInvoices.find((i: any) => i.id === id) || paginatedInvoices.find((i: any) => i.id === id);
    if (!inv) return;
    
    let diffText = '';
    if ((updates.status === 'DRAFT' || inv.status === 'DRAFT') && updates.items) {
        const oldTotal = inv.total || 0;
        const newTotal = updates.total !== undefined ? updates.total : oldTotal;
        const diffTotal = newTotal - oldTotal;
        if (Math.abs(diffTotal) > 0.01) {
           diffText += ` Total changed by ${diffTotal > 0 ? '+' : ''}${diffTotal.toLocaleString()} (New: ${newTotal.toLocaleString()}).`;
        }
        
        const oldItems = inv.items || [];
        const newItems = updates.items || oldItems;
        
        const itemChanges: string[] = [];
        newItems.forEach((ni: any) => {
            if (ni.type !== 'PRODUCT') return;
            const oi = oldItems.find((o: any) => o.id === ni.id);
            if (!oi) {
                itemChanges.push(`Added ${ni.displayDescription || ni.description || 'product'} (Qty: ${ni.quantity})`);
            } else if (oi.quantity !== ni.quantity || oi.unitPrice !== ni.unitPrice || oi.productId !== ni.productId) {
                itemChanges.push(`Updated ${ni.displayDescription || ni.description || 'product'} (Qty: ${oi.quantity}->${ni.quantity}, Price: ${oi.unitPrice}->${ni.unitPrice})`);
            }
        });
        oldItems.forEach((oi: any) => {
            if (oi.type !== 'PRODUCT') return;
            if (!newItems.find((ni: any) => ni.id === oi.id)) {
                itemChanges.push(`Removed ${oi.displayDescription || oi.description || 'product'}`);
            }
        });
        if (itemChanges.length > 0) {
            diffText += ` Items: ${itemChanges.join(', ')}.`;
        }
    }
    
    if (updates.status && updates.status !== inv.status) {
        diffText += ` Status changed from ${inv.status} to ${updates.status}.`;
    }
    
    if (diffText && !updates.messages) {
       updates.messages = [...(inv.messages || []), {
         id: ("temp-" + crypto.randomUUID()),
         authorId: currentUser?.id || 'user-1',
         body: `Invoice updated.${diffText}`,
         date: new Date().toISOString(),
         type: 'notification'
       }];
    }
    
    const companyId = inv?.companyId || activeCompanyIds[0];
    // Frontend logic removed. Calculation moved to Supabase DB Triggers.
    
    const updatedInvoice = { ...inv, ...updates, id };
    const isCashSaleUpdate = updatedInvoice.customerId && (
      String(updatedInvoice.customerId).toLowerCase().includes('cash-sale') ||
      (allContacts || []).some(c => c.id === updatedInvoice.customerId && String(c.name || '').toLowerCase().trim() === 'cash sale')
    );
    if (isCashSaleUpdate && (!updatedInvoice.paymentMethod || updatedInvoice.paymentMethod === 'CASH')) {
      updatedInvoice.type = 'CASH_SALE';
    } else if (isCashSaleUpdate) {
      updatedInvoice.type = 'STANDARD';
    }
    
    // Call backend API to handle everything securely
    
    let rpcError = null;
    let rpcData = null;
    try {
      const res = await apiFetch('/api/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',  },
        body: JSON.stringify({ p_invoice: updatedInvoice })
      });
      rpcData = await res.json();
      if (!res.ok) throw new Error(rpcData.error || 'API Error');
    } catch (e: any) {
      rpcError = e;
    }
    if (rpcError) throw rpcError;
    
    const processedInvoice = rpcData?.processed_invoice;
    if (processedInvoice) {
        Object.assign(updatedInvoice, processedInvoice);
    }
    
    // Fetch fully calculated data including items
    const { dbService } = await import('../../services/db');
    const _dbRes = await dbService.getPaginatedDocs('docs_invoices', { search: id }); // Assuming we can just find it by id if we rely on pagination? Actually wait, dbService.getPaginatedDocs uses search which searches text. It's better to fetch via apiFetch directly and then call _fetchChunked.
    // wait, we can just use `/api/docs?table=docs_invoices` with no limit? No.
    // let's do this:
    const _invRes = await apiFetch(`/api/docs/single?table=docs_invoices&id=${id}`);
    const fetchReq = _invRes.ok ? (await _invRes.json()).data : null;
    if (fetchReq) {
        const _linesRes = await apiFetch(`/api/docs?table=docs_invoice_lines&limit=1000`);
        if (_linesRes.ok) {
            const _linesData = (await _linesRes.json()).data || [];
            const _myLines = _linesData.filter((l: any) => l.invoice_id === id || l.invoiceid === id);
            
            const mapLineItem = (l: any) => ({
                ...l,
                productId: l.product_id || l.productId,
                unitPrice: l.unit_price || l.unitPrice,
                lineValue: l.line_value !== undefined ? l.line_value : l.lineValue,
                discountMode: l.discount_mode || l.discountMode,
                discountRate: l.discount_rate || l.discountRate,
                discountValue: l.discount_value || l.discountValue,
                serialNumbers: l.serial_numbers || l.serialNumbers,
                type: l.type
            });
            fetchReq.items = _myLines.map(mapLineItem).sort((a: any, b: any) => (a.display_index ?? 0) - (b.display_index ?? 0));
        }
    }
    if (fetchReq && fetchReq) {
        Object.assign(updatedInvoice, fetchReq);
    }
    
    get().setLocalOnlyInvoices(prev => prev.map(i => i.id === id ? updatedInvoice : i));
    get().setPaginatedInvoices(prev => prev.map(i => i.id === id ? updatedInvoice : i));
    get().fetchInvoices({ forceRefresh: true });
    if (typeof useAccountingCoreStore.getState().clearFetchCache === 'function') useAccountingCoreStore.getState().clearFetchCache();
    
    return updatedInvoice; 
  },
  payInvoice: async (invoiceId: string, paymentDetails: any) => { 
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

    let inv = allInvoices.find((i: any) => i.id === invoiceId) || paginatedInvoices.find((i: any) => i.id === invoiceId);
    if (!inv) {
        const _invRes = await apiFetch(`/api/docs/single?table=docs_invoices&id=${invoiceId}`); const fetchReq = _invRes.ok ? (await _invRes.json()).data : null;
        if (fetchReq) inv = fetchReq as Invoice;
    }
    if (!inv) return;
    
    const payment = await usePurchasingStore.getState().postPayment({
      status: paymentDetails.status || 'POSTED',
      ...paymentDetails,
      contactId: inv.customerId,
      companyId: inv?.companyId,
      type: 'RECEIPT',
      reference: `CPAY/${inv.number}`,
      invoiceId: inv.id,
      appliedInvoices: [{
        invoiceId: inv.id,
        invoiceNumber: inv.number,
        amount: paymentDetails.amount,
        remaining: 0
      }]
    });
    
    const _invRes2 = await apiFetch(`/api/docs/single?table=docs_invoices&id=${invoiceId}`); const updatedInv = _invRes2.ok ? (await _invRes2.json()).data : null;
    if (updatedInv) {
        get().setLocalOnlyInvoices(prev => prev.map(i => i.id === invoiceId ? updatedInv as Invoice : i));
        get().setPaginatedInvoices(prev => prev.map(i => i.id === invoiceId ? updatedInv as Invoice : i));
    }
    
    useAccountingCoreStore.getState().refreshBalances();
    return payment; 
  },
  addCreditNote: async (cn: Omit<CreditNote, 'id' | 'companyId' | 'createdById'>) => { 
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
    const companyId = activeCompanyIds[0];
    // Frontend logic removed. Calculation moved to Supabase DB Triggers.
    
    let cnNumber = cn.number;
    const isDraft = !cnNumber || cnNumber === 'DRAFT' || cnNumber === 'NEW' || String(cnNumber).startsWith('DRAFT-');
    if (isDraft) cnNumber = null as any; // db sequencing
    
    const newCn = { 
      ...cn,
      number: cnNumber,
      id: newId, 
      companyId, 
      status: cn.status || 'DRAFT', 
      createdById: (cn as any).createdById || currentUser?.id || 'user-1',
      preparedBy: (cn as any).preparedBy || currentUser?.name || currentUser?.username || (currentUser?.email ? currentUser.email.split('@')[0] : '') || 'System'
    };
    
    if (newCn.items && newCn.items.length > 0) {
      newCn.items = newCn.items.map((item: any, mapIdx: number) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.unitPrice || 0);
        const gross = qty * price;
        const discRate = Number(item.discountRate || 0);
        const discMode = item.discountMode || 'PERCENT';
        const calculatedDisc = discMode === 'FIXED' ? discRate : Math.round((gross * (discRate / 100)) * 100) / 100;
        const calculatedTax = item.taxValue || 0;
        const calculatedTotal = item.lineValue !== undefined ? item.lineValue : Math.round((gross - calculatedDisc + calculatedTax) * 100) / 100;
        return {
          ...item,
          id: item.id || ("temp-" + crypto.randomUUID()),
          quantity: qty,
          unitPrice: price,
          discount: calculatedDisc,
          taxValue: calculatedTax,
          lineValue: calculatedTotal,
          total: calculatedTotal,
          display_index: mapIdx
        };
      });
    }
    
    const resp = await apiFetch('/api/credit-notes/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',  },
      body: JSON.stringify({ p_cn: newCn })
    });
    const rpcRes = await resp.json();
    if (!resp.ok || !rpcRes.success) {
        throw new Error('Database Error (Add Credit Note): ' + (rpcRes.error || 'Failed to create credit note'));
    }
    if (rpcRes && rpcRes.credit_note_number) {
        newCn.number = rpcRes.credit_note_number;
    }
    
    setLocalOnlyCreditNotes(prev => [...prev, newCn as CreditNote]);
    return newCn as CreditNote; 
  },
  updateCreditNote: async (id: string, updates: Partial<CreditNote>) => { 
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

    const cn = allCreditNotes.find(c => c.id === id);
    if (!cn) return;
    // Frontend logic removed. Calculation moved to Supabase DB Triggers.
    
    const updated = { ...cn, ...updates };
    // Frontend logic removed. Calculation moved to Supabase DB Triggers.
    
    const companyId = cn?.companyId || activeCompanyIds[0];
    
    if (updated.items && updated.items.length > 0) {
      updated.items = updated.items.map((item: any, mapIdx: number) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.unitPrice || 0);
        const gross = qty * price;
        const discRate = Number(item.discountRate || 0);
        const discMode = item.discountMode || 'PERCENT';
        const calculatedDisc = discMode === 'FIXED' ? discRate : Math.round((gross * (discRate / 100)) * 100) / 100;
        const calculatedTax = item.taxValue || 0;
        const calculatedTotal = item.lineValue !== undefined ? item.lineValue : Math.round((gross - calculatedDisc + calculatedTax) * 100) / 100;
        return {
          ...item,
          id: item.id || ("temp-" + crypto.randomUUID()),
          quantity: qty,
          unitPrice: price,
          discount: calculatedDisc,
          taxValue: calculatedTax,
          lineValue: calculatedTotal,
          total: calculatedTotal,
          display_index: mapIdx
        };
      });
    }
    
    const resp = await apiFetch('/api/credit-notes/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',  },
      body: JSON.stringify({ p_cn: updated })
    });
    const rpcRes = await resp.json();
    if (!resp.ok || !rpcRes.success) {
        throw new Error('Database Error (Update Credit Note): ' + (rpcRes.error || 'Failed to update credit note'));
    }
    
    setLocalOnlyCreditNotes(prev => prev.map(c => c.id === id ? updated : c)); 
  },
  postCreditNote: async (cn: CreditNote) => { 
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

    if (cn.status === 'POSTED' || cn.status === 'OPEN' || cn.status === 'CLOSED' || cn.status === 'VOID') return cn;
    
    const companyId = cn?.companyId || activeCompanyIds[0];
    const finalCNData = { ...cn, status: 'POSTED', companyId };
    
    console.log('postCreditNote: Attempting process_credit_note RPC...', cn.id);
    let rpcRes: any;
    let rpcError: any;
    
    try {
      const resp = await apiFetch('/api/credit-notes/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',  },
        body: JSON.stringify({ p_cn: finalCNData })
      });
      const data = await resp.json();
      rpcRes = data;
      rpcError = resp.ok && data.success ? null : new Error(data.error || 'Failed to process credit note');
    } catch (e) {
      rpcError = e;
    }
    
    if (rpcError || (rpcRes && !rpcRes.success)) {
      console.error('postCreditNote: process_credit_note RPC failed', rpcError || rpcRes?.error);
      throw new Error(`Posting failed: ${rpcError?.message || rpcRes?.error || 'Unknown error'}`);
    }
    
    console.log('postCreditNote: Completed successfully', rpcRes);
    
    const jeIdToFinalize = rpcRes?.journal_id;
    
    // Fetch the updated record from DB to get trigger-generated values (like sequence number)
    const _cnRes = await apiFetch(`/api/docs/single?table=docs_credit_notes&id=${cn.id}`); const updatedRow = _cnRes.ok ? (await _cnRes.json()).data : null;
    let finalCN: any;
    
    if (updatedRow) {
      finalCN = { 
        ...cn,
        ...(updatedRow.data || {}), 
        ...updatedRow, 
        id: updatedRow.id, 
        companyId: updatedRow.company_id || cn.companyId,
        status: updatedRow.status || 'POSTED',
        journalEntryId: jeIdToFinalize
      };
      // Ensure the number from data matches the flat column if data is missing it
      if (!finalCN.number && updatedRow.credit_note_number) {
        finalCN.number = updatedRow.credit_note_number;
      }
    } else {
      finalCN = { ...cn, status: 'POSTED' as any, journalEntryId: jeIdToFinalize, number: cn.number };
    }
    
    setLocalOnlyCreditNotes(prev => prev.map(item => item.id === cn.id ? finalCN : item));
    
    // Update the reference in the linked Journal Entry if it exists (Handled database-level by post_credit_note RPC, removed redundant create_journal_entry call to prevent duplicate journal lines)
    
    // Refresh inventory for all products in the credit note
    for (const item of (cn.items || [])) {
      if (item.type === 'PRODUCT' && item.productId) {
        // // // recalculateProductInventory(item.productId);
      }
    }
    
    // Refresh state
    setTimeout(async () => {
      useAccountingCoreStore.getState().fetchInitialData(currentUser?.id || '');
    }, 1000);
    
    return finalCN; 
  },
  resetInvoiceToDraft: async (invoiceId: string) => { 
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

    const invoice = (allInvoices || []).find((i: any) => i.id === invoiceId) || paginatedInvoices.find((i: any) => i.id === invoiceId);
    if (!invoice || invoice.status !== 'POSTED') return;
    
    // Local updates for immediate UI feedback
    if (invoice.journalEntryId) {
      setLocalOnlyEntries(prev => prev.map(e => e.id === invoice.journalEntryId ? { ...e, status: 'DRAFT' } : e));
    }
    get().setLocalOnlyInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: 'DRAFT' } : inv));
    
    // DB updates
    const resp = await apiFetch('/api/documents/unpost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',  },
      body: JSON.stringify({ type: 'INVOICE', id: invoiceId, journalEntryId: invoice.journalEntryId })
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) {
      throw new Error(data.error || `Failed to reset invoice`);
    }
    
    // Recalculate stock - this might be complex to do manually, but we can try
    (invoice.items || []).filter(i => i.type === 'PRODUCT').forEach(item => {
      if (item.productId) {
        useAccountingCoreStore.getState().setLocalOnlyProducts(prev => prev.map(p => p.id === item.productId ? { 
          ...p, 
          stockLevels: {
            ...(p.stockLevels || {}),
            [invoice?.companyId]: (p.stockLevels?.[invoice?.companyId] || 0) + item.quantity
          }
        } : p));
      }
    }); 
  },
}));
