import { supabase } from '../../lib/supabase';
import { Invoice, Contact, CreditNote, Company, Account, Warehouse, ContactType, Bill, Payment, JournalEntry, Product, Loan } from '../../types';
import { apiFetch } from '../../lib/apiFetch';
import { create } from 'zustand';
import * as Types from '../../types/index';
import { useAccountingCoreStore } from './useAccountingCoreStore';
import { useSettingsStore } from './useSettingsStore';
import { useCRMStore } from './useCRMStore';
import { useHRStore } from './useHRStore';
import { useInventoryStore } from './useInventoryStore';
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


export const usePurchasingStore = create<any>((set, get) => ({
  allBills: [],
  setAllBills: (val: any) => set((state: any) => ({ allBills: typeof val === 'function' ? val(state.allBills) : val })),
  setLocalOnlyBills: (val: any) => set((state: any) => ({ allBills: typeof val === 'function' ? val(state.allBills) : val })),
  paginatedBills: [],
  setPaginatedBills: (val: any) => set((state: any) => ({ paginatedBills: typeof val === 'function' ? val(state.paginatedBills) : val })),
  billCount: 0,
  setBillCount: (val: any) => set((state: any) => ({ billCount: typeof val === 'function' ? val(state.billCount) : val })),
  isBillsLoading: false,
  setIsBillsLoading: (val: any) => set((state: any) => ({ isBillsLoading: typeof val === 'function' ? val(state.isBillsLoading) : val })),
  fetchBills: async (options: any) => { 
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

    const cacheKey = 'fetchBills_' + JSON.stringify(activeCompanyIds) + '_' + JSON.stringify(options && options.nativeEvent ? {} : options);
    const isForce = options?.forceRefresh;
    const cache = fetchCacheMap.get(cacheKey);
    const now = Date.now();
    if (!isForce && cache) {
      if (cache.isFetching) return;
      if (now - cache.lastFetched < 1000) return;
    }
    fetchCacheMap.set(cacheKey, { isFetching: true, lastFetched: cache ? cache.lastFetched : 0 });
    
    get().setIsBillsLoading(true);
    try {
      const { dbService } = await import('../../services/db');
      const { data, count } = await dbService.getPaginatedDocs('docs_bills', {
        ...options,
        companyIds: activeCompanyIds,
      });
      get().setPaginatedBills((prev: any[]) => {
        return data.map((newB: any) => {
          const oldB = prev.find(b => b.id === newB.id);
          if (oldB && oldB.status === 'POSTED' && (newB.status === 'DRAFT' || newB.status === 'PENDING')) {
            return { ...newB, status: 'POSTED' };
          }
          if (oldB && oldB.status === 'PAID' && (newB.status === 'DRAFT' || newB.status === 'PENDING' || newB.status === 'POSTED')) {
            return { ...newB, status: 'PAID' };
          }
          return newB;
        });
      });
      get().setBillCount(count);
    
      if (data && data.length > 0) {
        const cIds = data.map((b: any) => b.vendorId).filter(Boolean);
        const pIds = data.flatMap((b: any) => b.items || []).map((it: any) => it.productId).filter(Boolean);
        ensureEntitiesMetadata(cIds, pIds);
      }
    } catch (err) {
      console.error('fetchBills failed:', err);
    } finally {
      fetchCacheMap.set(cacheKey, { isFetching: false, lastFetched: Date.now() });
      get().setIsBillsLoading(false);
    } 
  },
  allPayments: [],
  setAllPayments: (val: any) => set((state: any) => ({ allPayments: typeof val === 'function' ? val(state.allPayments) : val })),
  setLocalOnlyPayments: (val: any) => set((state: any) => ({ allPayments: typeof val === 'function' ? val(state.allPayments) : val })),
  fetchPayments: async (options?: any) => { 
      const activeCompanyIds = useAccountingCoreStore.getState().activeCompanyIds || [];
      const cacheKey = 'fetchPayments_' + JSON.stringify(activeCompanyIds);
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
        const { data } = await dbService.getChunkedDocs('docs_payments', { companyIds: activeCompanyIds, limit: 2000 });
        if (data) {
           usePurchasingStore.getState().setAllPayments(data);
        }
      } catch (err) {
        console.error('fetchPayments failed:', err);
      } finally {
        fetchCacheMap.set(cacheKey, { isFetching: false, lastFetched: Date.now() });
      } 
  },
  get_bills: () => { 
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

    return (get().allBills || []).filter(b => b && b?.companyId && activeCompanyIds.includes(b?.companyId)); 
  },
  get_payments: () => { 
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

    return (get().allPayments || []).filter(p => p && (activeCompanyIds.length === 0 || activeCompanyIds.includes(p?.companyId))); 
  },
  clearPayment: async (paymentId: string, status: 'CLEARED' | 'REJECTED') => {
      const state = get();
      const p = get().allPayments.find(p => p.id === paymentId);
      if (!p) return;
      if (status === 'CLEARED') {
          try {
            await apiFetch('/api/payments/clear', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ payment_id: p.id, company_id: p.companyId || p.company_id })
            });
            console.log('Payment cleared via Node backend API');
            useAccountingCoreStore.getState().fetchEntries({ limit: 1000 });
          } catch (err) {
            console.error('API fail:', err);
          }
      }
      get().setAllPayments(prev => prev.map(p => {
        if (p.id === paymentId) {
            return { ...p, status: status === 'CLEARED' ? 'POSTED' : 'REJECTED' };
        }
        return p;
      }));
  },
  deleteBill: async (id: string) => { 
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
  deletePayment: async (id: string) => { 
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
  postPayment: async (payment: any) => { 
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

    const paymentId = payment.id || ("temp-" + crypto.randomUUID());
        const existingPayment = get().allPayments.find((p: any) => p.id === paymentId);
        
        // Prevent saving as POSTED if RPC hasn't run yet, to avoid limbo state on network failure
        const isIntendedPost = (payment.status === 'POSTED' || payment.status === 'CLEARED');
        const originalStatus = existingPayment?.status || 'DRAFT';
        const safeStatus = payment.status || existingPayment?.status || 'DRAFT';
    
        let payNum = payment.number || existingPayment?.number;
        const isDraftNum = !payNum || payNum === 'DRAFT' || payNum === 'NEW' || String(payNum).startsWith('DRAFT-');
        if (isDraftNum) payNum = null as any; // db sequencing trigger
        
        let paymentToSave = {
          ...existingPayment,
          ...payment,
          id: paymentId,
          number: payNum,
          status: safeStatus,
          preparedBy: payment.preparedBy || existingPayment?.preparedBy || currentUser?.name || currentUser?.username || (currentUser?.email ? currentUser.email.split('@')[0] : '') || 'System',
          createdById: payment.createdById || existingPayment?.createdById || currentUser?.id || 'user-1'
        };
    
        const companyId = paymentToSave?.companyId || paymentToSave.company_id || activeCompanyIds[0];
        if (paymentToSave) paymentToSave.companyId = companyId;
    
        // Auto-resolve missing liquidityAccountId (account_id) based on the payment method
        let resolvedLiquidityAccountId = paymentToSave.liquidityAccountId || paymentToSave.accountId || paymentToSave.account_id;
        if (!resolvedLiquidityAccountId) {
          const accountsList = (useAccountingCoreStore.getState().accounts || []).filter((a: any) => a.company_id === companyId || a?.companyId === companyId);
          const cash100100 = accountsList.find((acc: any) => acc.code === '100100');
          if (cash100100 && (!paymentToSave.method || paymentToSave.method === 'CASH')) {
            resolvedLiquidityAccountId = cash100100.id;
          } else {
            const isBank = paymentToSave.method === 'BANK' || (paymentToSave.reference && paymentToSave.reference.toLowerCase().includes('bank')) || (paymentToSave.memo && paymentToSave.memo.toLowerCase().includes('bank'));
            const matched = accountsList.find((acc: any) => 
              !isBank 
                ? (acc.subType === 'CASH' || (acc.name || '').toLowerCase().includes('cash'))
                : (acc.subType === 'BANK' || (acc.name || '').toLowerCase().includes('bank'))
            );
            if (matched) {
              resolvedLiquidityAccountId = matched.id;
            } else {
              const fallback = accountsList.find((acc: any) => acc.type === 'ASSET' && (acc.subType === 'CASH' || acc.subType === 'BANK' || (acc.name || '').toLowerCase().includes('cash') || (acc.name || '').toLowerCase().includes('bank')));
              if (fallback) {
                resolvedLiquidityAccountId = fallback.id;
              }
            }
          }
        }
        paymentToSave.liquidityAccountId = resolvedLiquidityAccountId;
        paymentToSave.accountId = resolvedLiquidityAccountId;
        paymentToSave.account_id = resolvedLiquidityAccountId;
    
        // Resolve partner_account_id - enforce strong logic: Customers always route to Accounts Receivable, Vendors to Accounts Payable.
        const isReceipt = paymentToSave.type === 'RECEIPT' || paymentToSave.type === 'COLLECTION' || paymentToSave.type === 'REFUND';
        const accountsList = (useAccountingCoreStore.getState().accounts || []).filter((a: any) => a.company_id === companyId || a?.companyId === companyId);
        const matchedPartner = accountsList.find((acc: any) => 
          isReceipt 
            ? (acc.code === '100201' || acc.sub_type === 'ACCOUNTS_RECEIVABLE' || acc.subType === 'ACCOUNTS_RECEIVABLE')
            : (acc.code === '200101' || acc.sub_type === 'ACCOUNTS_PAYABLE' || acc.subType === 'ACCOUNTS_PAYABLE' || acc.code === '2100')
        );
        let resolvedPartnerAccountId = matchedPartner?.id || (isReceipt ? `${companyId}-100201` : `${companyId}-200101`);
        paymentToSave.partnerAccountId = resolvedPartnerAccountId;
        paymentToSave.partner_account_id = resolvedPartnerAccountId;
    
        // Auto-allocation moved to backend trigger/rpc
    
        try {
          
          const res = await apiFetch('/api/payments/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              
              'x-idempotency-key': paymentToSave.id
            },
            body: JSON.stringify({ p_payment: paymentToSave })
          });
          const resp = await res.json();
          
          if (!res.ok) throw new Error(resp.error || 'Posting failed');
          if (resp.error) throw new Error(resp.error);
        } catch (e: any) {
          console.error('process_payment API failed:', e);
          throw new Error(`Payment processing failed on the server: ${e.message || 'Unknown error'}`);
        }
    
        if (existingPayment) {
          get().setLocalOnlyPayments(prev => prev.map(p => p.id === paymentId ? paymentToSave : p));
        } else {
          get().setLocalOnlyPayments(prev => [paymentToSave, ...prev]);
        }
    
        if (isIntendedPost) {
          // Update local state to reflect successful POSTED status
          paymentToSave.status = payment.status;
          get().setLocalOnlyPayments(prev => prev.map(p => p.id === paymentId ? paymentToSave : p));
          
          // Removed global fetchInitialData
        }
    
        if (isIntendedPost) {
          setTimeout(async () => {
            try {
              const { dbService } = await import('../../services/db');
              const cIds = [activeCompanyIds[0]];
              
              const { data: latestJournals } = await dbService.getPaginatedDocs('docs_journals', { companyIds: cIds, limit: 100, sortField: 'updated_at', sortOrder: 'desc' });
              if (latestJournals) setLocalOnlyEntries(prev => { const n = new Set(latestJournals.map(i=>i.id)); return [...latestJournals, ...prev.filter(i => !n.has(i.id))].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()); });
              
              const { data: latestInvoices } = await dbService.getPaginatedDocs('docs_invoices', { companyIds: cIds, limit: 100, sortField: 'updated_at', sortOrder: 'desc' });
              if (latestInvoices) console.log('first invoice createdAt:', latestInvoices[0]?.createdAt, latestInvoices[0]?.created_at);
    useAccountingCoreStore.getState().setLocalOnlyInvoices(prev => { const n = new Set(latestInvoices.map(i=>i.id)); return [...latestInvoices, ...prev.filter(i => !n.has(i.id))].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()); });
      
              const { data: latestBills } = await dbService.getPaginatedDocs('docs_bills', { companyIds: cIds, limit: 100, sortField: 'updated_at', sortOrder: 'desc' });
              if (latestBills) get().setLocalOnlyBills(prev => { const n = new Set(latestBills.map(i=>i.id)); return [...latestBills, ...prev.filter(i => !n.has(i.id))].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()); });
    
              const { data: latestPayments } = await dbService.getPaginatedDocs('docs_payments', { companyIds: cIds, limit: 100, sortField: 'updated_at', sortOrder: 'desc' });
              if (latestPayments) get().setLocalOnlyPayments(prev => { const n = new Set(latestPayments.map(i=>i.id)); return [...latestPayments, ...prev.filter(i => !n.has(i.id))].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()); });
            } catch (e) { console.warn('postPayment: Refresh failed', e); }
          }, 800);
        }
        
        return paymentToSave; 
  },
  registerBatchPayment: async (details: any) => { 
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

    try {
      if (!details.date) {
        details.date = new Date().toISOString().split('T')[0];
      }
      if (!details.companyId) {
        const state = useAccountingCoreStore.getState();
        details.companyId = state.activeCompanyIds?.[0] || state.companies?.[0]?.id || '';
      }
      if (!details.accountId) {
        const state = useAccountingCoreStore.getState();
        const cashAcc = (allAccounts || []).find(a => a.companyId === details.companyId && (a.code === '1011' || a.name.toLowerCase().includes('cash')));
        if (cashAcc) {
          details.accountId = cashAcc.id;
        }
      }
    
      // supabase import removed
      const resp = await apiFetch('/api/payments/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',  },
        body: JSON.stringify({ payload: details })
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) throw new Error(data.error || 'Batch payment failed');
      
      // Refresh local state
      await useAccountingCoreStore.getState().fetchInitialData(currentUser?.id || '');
      return data;
    } catch (err: any) {
      console.error('registerBatchPayment failed:', err);
      throw err;
    } 
  },
  addBill: async (bill: Omit<Bill, 'id' | 'companyId' | 'createdById'>) => { 
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

    const companyId = activeCompanyIds[0];
    const company = companies.find(c => c.id === companyId);
    const companyCode = company?.code || 'CO';
    const newId = ("temp-" + crypto.randomUUID());
    
    // Auto-generate number if not provided
    let number = bill.number;
    const isDraft = !number || number === 'DRAFT' || number === 'NEW' || String(number).startsWith('DRAFT-');
    if (isDraft) {
      number = null as any; // Trigger DB sequencing
    }
    
    // Frontend logic removed. Calculation moved to Supabase DB Triggers.
    
    const newBill: any = { 
      ...bill, 
      id: newId, 
      number: isDraft ? `DRAFT-${newId.split('-')[1]}` : number,
      companyId, 
      companyCode,
      createdById: currentUser?.id || 'user-1',
      preparedBy: (bill as any).preparedBy || currentUser?.name || currentUser?.username || (currentUser?.email ? currentUser.email.split('@')[0] : '') || 'System'
    };
    
    if (newBill.items && newBill.items.length > 0) {
      newBill.items = newBill.items.map((item: any, mapIdx: number) => {
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
    
    const resp = await apiFetch('/api/bills/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',  },
      body: JSON.stringify({ p_bill: newBill })
    });
    const rpcRes = await resp.json();
    if (!resp.ok || !rpcRes.success) {
        const rpcErr = new Error(rpcRes.error || 'create_bill failed');
        console.error('create_bill API failed:', rpcErr);
        throw rpcErr;
    }
    if (rpcRes && rpcRes.bill_number) {
        newBill.number = rpcRes.bill_number;
    }
    
    get().setLocalOnlyBills(prev => [...prev, newBill]);
    get().setPaginatedBills((prev: any[]) => [newBill, ...prev]);
    useAccountingCoreStore.getState().clearFetchCache();
    return newBill; 
  },
  postBill: async (bill: Bill) => { 
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

    if (bill.status === 'POSTED' || bill.status === 'PAID') return bill; // Prevent re-posting
    
    console.log('postBill: Attempting to process_bill...', bill.id);
    
    let finalBillData = { ...bill };
    if (!['POSTED', 'PAID', 'PARTIAL', 'VOID'].includes(finalBillData.status)) {
      finalBillData.status = 'POSTED' as any;
    }
    const companyId = finalBillData?.companyId || activeCompanyIds[0];
    if (finalBillData) finalBillData.companyId = companyId;
    
    // Frontend logic removed. Calculation moved to Supabase DB Triggers.
    
    try {
      
      const res = await apiFetch('/api/bills/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          
        },
        body: JSON.stringify({ p_bill: finalBillData })
      });
      let rpcRes = await res.json();
      let rpcError = !res.ok ? new Error(rpcRes.error || 'API Error') : null;
    
      if (rpcError) {
        throw new Error(rpcError.message || 'RPC process_bill failed on create');
      }
    
      if (!rpcRes?.success) {
         throw new Error(rpcRes?.error || 'RPC process_bill returned false on create');
      }
      
      const postRes = await apiFetch('/api/bills/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_bill_id: finalBillData.id })
      });
      rpcRes = await postRes.json();
      rpcError = !postRes.ok ? new Error(rpcRes.error || 'API Error') : null;
      if (rpcError) throw new Error(rpcError.message || 'RPC post_bill failed');
      if (!rpcRes?.success) throw new Error(rpcRes?.error || 'RPC post_bill returned false');
    
      console.log('postBill: RPC succeeded');
      
      // Fetch the updated bill with its generated number and status from the database immediately
      const _bRes = await apiFetch(`/api/docs/single?table=docs_bills&id=${finalBillData.id}`);
      const updatedDoc = _bRes.ok ? (await _bRes.json()).data : null;
      
      if (updatedDoc) {
        const fetchedStatus = updatedDoc.status;
        const finalStatus = (fetchedStatus === 'DRAFT' || fetchedStatus === 'PENDING') ? 'POSTED' : fetchedStatus;
        finalBillData = {
          ...updatedDoc,
          id: updatedDoc.id,
          companyId: updatedDoc.company_id,
          number: updatedDoc.bill_number,
          status: finalStatus
        };
      } else {
        finalBillData.status = 'POSTED';
      }
    
    } catch (err: any) {
      console.warn('postBill: RPC Exception', err);
      throw new Error(`Posting failed: ${err.message || 'Unknown error'}.`);
    }
    
    // Immediately update local store bills state with the posted bill
    get().setLocalOnlyBills(prev => prev.map(b => b.id === finalBillData.id ? finalBillData : b));
    get().setPaginatedBills((prev: any[]) => prev.map((b: any) => b.id === finalBillData.id ? finalBillData : b));
    useAccountingCoreStore.getState().clearFetchCache();
    
    // Refresh Local State
    setTimeout(async () => {
      try {
        const _invTxRes = await apiFetch('/api/docs?table=docs_inventory_transactions&limit=100'); const latestInv = _invTxRes.ok ? (await _invTxRes.json()).data : null;
        if (latestInv) useAccountingCoreStore.getState().setLocalOnlyInventoryTransactions(latestInv.map(row => ({ ...row, ...row, id: row.id, companyId: row.company_id })));
        
        const _prodRes = await apiFetch(`/api/docs?table=docs_products&company_ids=${companyId}`); const latestProds = _prodRes.ok ? (await _prodRes.json()).data : null;
        if (latestProds) useAccountingCoreStore.getState().setLocalOnlyProducts(latestProds.map(row => ({ ...row, ...row, id: row.id, companyId: row.company_id })));
        
        const { dbService } = await import('../../services/db');
        const cIds = [companyId];
        
        const { data: latestJournals } = await dbService.getPaginatedDocs('docs_journals', { companyIds: cIds, limit: 100, sortField: 'updated_at', sortOrder: 'desc' });
        if (latestJournals) setLocalOnlyEntries(prev => { const n = new Set(latestJournals.map(i=>i.id)); return [...latestJournals, ...prev.filter(i => !n.has(i.id))].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()); });
        
        const { data: latestBills } = await dbService.getPaginatedDocs('docs_bills', { companyIds: cIds, limit: 100, sortField: 'updated_at', sortOrder: 'desc' });
        if (latestBills) get().setLocalOnlyBills(prev => { const n = new Set(latestBills.map(i=>i.id)); return [...latestBills, ...prev.filter(i => !n.has(i.id))].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()); });
    
        const { data: latestPayments } = await dbService.getPaginatedDocs('docs_payments', { companyIds: cIds, limit: 100, sortField: 'updated_at', sortOrder: 'desc' });
        if (latestPayments) get().setLocalOnlyPayments(prev => { const n = new Set(latestPayments.map(i=>i.id)); return [...latestPayments, ...prev.filter(i => !n.has(i.id))].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()); });
      } catch (e) { console.warn('postBill: Refresh failed', e); }
    }, 800);
    
    return finalBillData; 
  },
  updateBill: async (id: string, updates: Partial<Bill>) => { 
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

    // Frontend logic removed. Calculation moved to Supabase DB Triggers.
    
    const bill = (get().allBills || []).find(b => b.id === id) || (get().paginatedBills || []).find(b => b.id === id);
    if (!bill) return;
    
    if (bill.status === 'POSTED') {
      // 1. Reverse Stock and WAC
      const productUpdates = new Map<string, { qty: number, cost: number, serials: string[] }>();
      
      // Process in reverse order to correctly revert WAC if multiple items of same product exist
      [...bill.items].reverse().forEach(item => {
        if (item.type === 'PRODUCT' && item.productId) {
          const prod = allProducts.find(p => p.id === item.productId);
          if (!prod) return;
    
          const existingUpdate = productUpdates.get(item.productId);
          const currentQty = existingUpdate ? existingUpdate.qty : (prod.stockLevels?.[bill?.companyId] || 0);
          const currentCost = existingUpdate ? existingUpdate.cost : (prod.costPrice || 0);
          const currentSerials = existingUpdate ? existingUpdate.serials : (prod.serialNumbers || []);
    
          const newQty = currentQty - item.quantity;
          const revertedCost = item.previousAvgCost !== undefined ? item.previousAvgCost : currentCost;
          
          let updatedSerialNumbers = currentSerials;
          if (prod.trackingType === 'SERIAL' && item.serialNumbers) {
            updatedSerialNumbers = updatedSerialNumbers.filter(sn => !item.serialNumbers?.includes(sn));
          }
    
          productUpdates.set(item.productId, {
            qty: newQty,
            cost: revertedCost,
            serials: updatedSerialNumbers
          });
        }
      });
    
      // Apply all product updates in one go
      if (productUpdates.size > 0) {
        useAccountingCoreStore.getState().setLocalOnlyProducts(prev => prev.map(p => {
          const update = productUpdates.get(p.id);
          if (update) {
            return {
              ...p,
              stockLevels: {
                ...(p.stockLevels || {}),
                [bill?.companyId]: update.qty
              },
              costPrice: update.cost,
              serialNumbers: update.serials
            };
          }
          return p;
        }));
        
        for (const [productId, update] of productUpdates.entries()) {
           const prod = allProducts.find(p => p.id === productId);
           const totalBillQty = [...bill.items].filter((i:any) => i.productId === productId).reduce((s:number, i:any) => s + (i.quantity || 0), 0);
           const reversedGlobalQty = (prod?.quantityOnHand || 0) - totalBillQty;
        }
        await apiFetch('/api/documents/unpost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json',  },
          body: JSON.stringify({ type: 'BILL', id: bill.id, journalEntryId: bill.journalEntryId })
        }).then(r => r.json()).then(data => {
          if (!data.success) throw new Error(data.error);
        });
      }
    
      // 2. Remove Journal Entry is handled by the backend RPC.
      // We do not modify the journal here.
      
      const updatedBill = { ...bill, ...updates };
      try {
        await get().postBill({ ...updatedBill, status: 'DRAFT' as any });
      } catch (error: any) {
        get().setLocalOnlyBills(prev => prev.map(b => b.id === id ? { ...b, ...updates, status: 'DRAFT', journalEntryId: undefined } : b));
        throw error;
      }
    } else {
      get().setLocalOnlyBills(prev => prev.map(bill => {
        if (bill.id !== id) return bill;
        const changes = ['vendorId', 'date', 'dueDate', 'status', 'total'].filter(
          key => (updates as any)[key] !== undefined && (updates as any)[key] !== (bill as any)[key]
        );
        if (changes.length === 0) return { ...bill, ...updates };
        return { 
          ...bill, 
          ...updates,
          messages: [...(bill.messages || []), {
            id: ("temp-" + crypto.randomUUID()),
            authorId: currentUser?.id || 'user-1',
            body: `Bill updated: ${changes.join(', ')}`,
            date: formatDateTime(new Date()),
            type: 'notification'
          }]
        };
      }));
    
      // SYNC TO SUPABASE
      const updatedBillSync = { ...bill, ...updates };
      if (updatedBillSync.items && updatedBillSync.items.length > 0) {
        updatedBillSync.items = updatedBillSync.items.map((item: any, mapIdx: number) => {
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
      
      const resp = await apiFetch('/api/bills/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',  },
        body: JSON.stringify({ p_bill: updatedBillSync })
      });
      const rpcRes = await resp.json();
      if (!resp.ok || !rpcRes.success) {
          const rpcErr = new Error(rpcRes.error || 'create_bill failed');
          console.error('updateBill: create_bill API failed:', rpcErr);
          throw rpcErr;
      }
    
      if (updates.status === 'POSTED') {
         setTimeout(async () => {
           const _billRes = await apiFetch(`/api/docs/single?table=docs_bills&id=${id}`); const data = _billRes.ok ? (await _billRes.json()).data : null;
           const fetchedNumber = data?.bill_number;
           if (fetchedNumber) {
             get().setLocalOnlyBills(prev => prev.map(b => b.id === id ? { ...b, number: fetchedNumber } : b));
           }
         }, 1000);
      }
    }
    useAccountingCoreStore.getState().clearFetchCache(); 
  },
  resetBillToDraft: async (billId: string) => { 
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

    const bill = (get().allBills || []).find(b => b.id === billId);
    if (!bill || bill.status !== 'POSTED') return;
    
    // ... (stock validation logic remains same) ...
    const stockErrors: string[] = [];
    const productQuantities: Record<string, number> = {};
    
    (bill.items || []).filter(i => i.type === 'PRODUCT').forEach(item => {
      if (item.productId) {
        productQuantities[item.productId] = (productQuantities[item.productId] || 0) + (item.quantity || 0);
      }
    });
    
    Object.entries(productQuantities).forEach(([productId, reducingQty]) => {
      const prod = allProducts.find(p => p.id === productId);
      if (reducingQty <= 0) {
        stockErrors.push(`${prod?.name || productId}: Quantity must be greater than 0`);
      }
    });
    
    if (stockErrors.length > 0) {
      throw new Error(`Validation Error: ${stockErrors.join(', ')}`);
    }
    
    const productReversals = new Map<string, { qty: number, cost: number, serials: string[] }>();
    
    [...bill.items].reverse().forEach(item => {
      if (item.type === 'PRODUCT' && item.productId) {
        const prod = allProducts.find(p => p.id === item.productId);
        if (!prod) return;
    
        const existingUpdate = productReversals.get(item.productId);
        const currentQty = existingUpdate ? existingUpdate.qty : (prod.stockLevels?.[bill?.companyId] || 0);
        const currentSerials = existingUpdate ? existingUpdate.serials : (prod.serialNumbers || []);
        const revertedCost = item.previousAvgCost !== undefined ? item.previousAvgCost : (prod.costPrice || 0);
    
        let updatedSerialNumbers = currentSerials;
        if (prod.trackingType === 'SERIAL' && item.serialNumbers && item.serialNumbers.length > 0) {
          updatedSerialNumbers = updatedSerialNumbers.filter(sn => !item.serialNumbers?.includes(sn));
        }
    
        productReversals.set(item.productId, {
          qty: currentQty - item.quantity,
          cost: revertedCost,
          serials: updatedSerialNumbers
        });
      }
    });
    
    if (productReversals.size > 0) {
      useAccountingCoreStore.getState().setLocalOnlyProducts(prev => prev.map(p => {
        const update = productReversals.get(p.id);
        if (update) {
          return {
            ...p,
            stockLevels: {
              ...(p.stockLevels || {}),
              [bill?.companyId]: update.qty
            },
            costPrice: update.cost,
            serialNumbers: update.serials
          };
        }
        return p;
      }));
      
      for (const [productId, update] of productReversals.entries()) {
         const prod = allProducts.find(p => p.id === productId);
         const totalBillQty = [...bill.items].filter((i:any) => i.productId === productId).reduce((s:number, i:any) => s + (i.quantity || 0), 0);
         const reversedGlobalQty = (prod?.quantityOnHand || 0) - totalBillQty;
      }
      
      // supabase import removed
      
      if (bill.journalEntryId) {
        setLocalOnlyEntries(prev => prev.map(e => e.id === bill.journalEntryId ? { ...e, status: 'DRAFT' } : e));
      }
      get().setLocalOnlyBills(prev => prev.map(b => b.id === billId ? { ...b, status: 'DRAFT' } : b));
    
      await apiFetch('/api/documents/unpost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',  },
        body: JSON.stringify({ type: 'BILL', id: billId, journalEntryId: bill.journalEntryId })
      }).then(r => r.json()).then(data => {
        if (!data.success) throw new Error(data.error);
      });
    }
    useAccountingCoreStore.getState().clearFetchCache(); 
  },
  payBill: async (billId: string, paymentDetails: any) => { 
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

    let bill = (get().allBills || []).find(b => b.id === billId) || (get().paginatedBills || []).find(b => b.id === billId);
    if (!bill) {
        const _billRes = await apiFetch(`/api/docs/single?table=docs_bills&id=${billId}`); const data = _billRes.ok ? (await _billRes.json()).data : null;
        if (data) bill = data as Bill;
    }
    if (!bill) return;
    
    const payment = await get().postPayment({
      ...paymentDetails,
      contactId: bill.vendorId,
      companyId: bill?.companyId,
      type: 'PAYMENT',
      reference: `BPAY/${bill.number}`,
      billId: bill.id,
      appliedBills: [{
        billId: bill.id,
        billNumber: bill.number,
        amount: paymentDetails.amount,
        remaining: 0
      }]
    });
    
    const _ubRes = await (await import('../../lib/apiFetch')).apiFetch(`/api/docs/single?table=docs_bills&id=${billId}`); const updatedBillData = _ubRes.ok ? (await _ubRes.json()).data : null;
    if (updatedBillData) {
        get().setLocalOnlyBills(prev => prev.map(b => b.id === billId ? updatedBillData as Bill : b));
    }
    
    useAccountingCoreStore.getState().clearFetchCache();
    return payment; 
  },
  addExpense: async (expenseData: any) => { 
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

    let finalRef = expenseData.reference;
    if (expenseData.status === 'POSTED' && (!finalRef || String(finalRef).startsWith('DRAFT-'))) {
       finalRef = useAccountingCoreStore.getState().generateNextNumber('EXPENSE', expenseData.date, activeCompanyIds[0]);
    }
    const entry = await useAccountingCoreStore.getState().addJournalEntry({
      date: expenseData.date,
      description: `Expense: ${expenseData.description}`,
      reference: finalRef,
      journalType: 'EXPENSE',
      expenseType: expenseData.expenseType,
      status: expenseData.status,
      lines: [
        { id: crypto.randomUUID(), accountId: expenseData.toAccountId, debit: expenseData.amount, credit: 0, description: expenseData.description },
        { id: crypto.randomUUID(), accountId: expenseData.fromAccountId, debit: 0, credit: expenseData.amount, contactId: expenseData.contactId, description: expenseData.description }
      ]
    });
    return entry; 
  },
}));
