import { supabase } from '../../lib/supabase';
import { User, Invoice, Contact, CreditNote, Company, Account, Warehouse, ContactType, Bill, Payment, JournalEntry, Product, Loan } from '../../types';
import { apiFetch } from '../../lib/apiFetch';
import { create } from 'zustand';
import * as Types from '../../types/index';
import { useAccountingCoreStore } from './useAccountingCoreStore';
import { useSettingsStore } from './useSettingsStore';
import { useCRMStore } from './useCRMStore';
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


export const useHRStore = create<any>((set, get) => ({
  allLoans: [],
  fetchLoans: async (options?: any) => {
    const activeCompanyIds = useAccountingCoreStore.getState().activeCompanyIds || [];
    if (!activeCompanyIds.length) return;
    try {
      const { apiFetch } = await import('../../lib/apiFetch');
      const res = await apiFetch(`/api/docs?table=docs_loans&company_ids=${activeCompanyIds.join(',')}`);
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
           get().setAllLoans(result.data.map((l: any) => ({
             ...l,
             journalEntryId: l.journal_entry_id,
             amortizationSchedule: l.amortization_schedule || [],
             paidPeriods: l.paid_periods || []
           })));
        }
      }
    } catch (e) {
      console.error('Failed to fetch loans:', e);
    }
  },
  setAllLoans: (val: any) => set((state: any) => ({ allLoans: typeof val === 'function' ? val(state.allLoans) : val })),
  setLocalOnlyLoans: (val: any) => set((state: any) => ({ allLoans: typeof val === 'function' ? val(state.allLoans) : val })),
  allAttendance: [],
  setAllAttendance: (val: any) => set((state: any) => ({ allAttendance: typeof val === 'function' ? val(state.allAttendance) : val })),
  setLocalOnlyAttendance: (val: any) => set((state: any) => ({ allAttendance: typeof val === 'function' ? val(state.allAttendance) : val })),
  allCommissionTargets: [],
  setAllCommissionTargets: (val: any) => set((state: any) => ({ allCommissionTargets: typeof val === 'function' ? val(state.allCommissionTargets) : val })),
  setLocalOnlyCommissionTargets: (val: any) => set((state: any) => ({ allCommissionTargets: typeof val === 'function' ? val(state.allCommissionTargets) : val })),
  allHolidays: [],
  setAllHolidays: (val: any) => set((state: any) => ({ allHolidays: typeof val === 'function' ? val(state.allHolidays) : val })),
  setLocalOnlyHolidays: (val: any) => set((state: any) => ({ allHolidays: typeof val === 'function' ? val(state.allHolidays) : val })),
  users: [],
  setUsers: (val: any) => set((state: any) => ({ users: typeof val === 'function' ? val(state.users) : val })),
  setLocalOnlyUsers: (val: any) => set((state: any) => ({ users: typeof val === 'function' ? val(state.users) : val })),
  roles: [],
  setRoles: (val: any) => set((state: any) => ({ roles: typeof val === 'function' ? val(state.roles) : val })),
  setLocalOnlyRoles: (val: any) => set((state: any) => ({ roles: typeof val === 'function' ? val(state.roles) : val })),
  get_mergedRoles: () => { 
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

    const all = [...get().roles];
useAccountingCoreStore.getState().SYSTEM_ROLES.forEach(sys => {
  if (!all.some(r => r.id === sys.id)) {
    all.push(sys);
  }
});
return all;; 
  },
  get currentUser() { return useAccountingCoreStore.getState().currentUser; },
  setCurrentUser: (user: User | null | ((prev: User | null) => User | null)) => { 
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

    const nextUser = typeof user === 'function' ? user(useAccountingCoreStore.getState().currentUser) : user;
    useAccountingCoreStore.setState({ currentUser: nextUser }); 
  },
  // TODO: Fix fallback
  // loginRole: useAccountingCoreStore(state => state.loginRole) as 'USER' | 'CASHIER' | null,
  setLoginRole: (role: any) => { 
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

    useAccountingCoreStore.setState({ loginRole: role }); 
  },
  get_employees: () => { 
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

    return (useCRMStore.getState().allContacts || []).filter((c: any) => c.type?.toUpperCase() === 'EMPLOYEE'); 
  },
  get_loans: () => { 
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

    return (get().allLoans || []).filter(l => l && (activeCompanyIds.length === 0 || activeCompanyIds.includes(l?.companyId || l?.company_id))); 
  },
  get_attendance: () => { 
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

    return (get().allAttendance || []).filter(a => a && (activeCompanyIds.length === 0 || activeCompanyIds.includes(a?.companyId))); 
  },
  get_filteredUsers: () => { 
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

    if (!currentUser) return [];
// Ensure uniqueness by ID to prevent duplicate key errors in UI
const uniqueUsers = Array.from(new Map((get().users || []).map(u => [u.id, u])).values()) as User[];
return uniqueUsers.filter(u => activeCompanyIds.length === 0 || (u?.companyIds || []).some(id => activeCompanyIds.includes(id)));; 
  },
  resolveUserName: (id?: string) => { 
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

    if (!id) return '';
    if (id === currentUser?.id) return currentUser.name || currentUser.username || currentUser.email || id;
    const user = (get().users || []).find((u: any) => u.id === id);
    if (user) return user.name || user.username || user.email || id;
    return id; 
  },
  updateLoanAmortizationEntry: async (loanId, period, updates) => { 
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
      const loan = (get().allLoans || []).find(l => l.id === loanId);
      if (!loan) throw new Error("Loan not found");
      const sched = loan.amortizationSchedule || loan.amortization_schedule || [];
      const updatedSched = sched.map(s => s.period === period ? { ...s, ...updates } : s);
      const { dbService } = await import('../../services/db');
      await dbService.upsertDoc('docs_loans', loanId, { ...loan, amortizationSchedule: updatedSched, amortization_schedule: updatedSched });
      get().setLocalOnlyLoans(prev => prev.map(l => l.id === loanId ? { ...l, amortizationSchedule: updatedSched, amortization_schedule: updatedSched } : l));
    } catch(e) {
      console.error("updateLoanAmortizationEntry error:", e);
    } 
  },
  updateLoan: async (loanId, data) => { 
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

    const { dbService } = await import('../../services/db');
    // supabase import removed
    const existing = (get().allLoans || []).find((l: any) => l.id === loanId) || {};
    const snakeCaseData: any = {};
    if (data.number !== undefined) snakeCaseData.loan_number = data.number;
    if (data.name !== undefined) snakeCaseData.name = data.name;
    if (data.type !== undefined) snakeCaseData.type = data.type;
    if (data.principalAmount !== undefined) snakeCaseData.principal_amount = data.principalAmount;
    if (data.interestRate !== undefined) snakeCaseData.interest_rate = data.interestRate;
    if (data.termMonths !== undefined) snakeCaseData.term_months = data.termMonths;
    if (data.startDate !== undefined) snakeCaseData.start_date = data.startDate;
    if (data.interestType !== undefined) snakeCaseData.interest_type = data.interestType;
    if (data.contactId !== undefined) snakeCaseData.contact_id = data.contactId;
    if (data.notes !== undefined) snakeCaseData.notes = data.notes;

    await dbService.upsertDoc('docs_loans', loanId, { ...existing, ...snakeCaseData });
    // Fetch the updated loan from DB because trigger might have regenerated amortization_schedule
    const _loanRes = await apiFetch(`/api/docs/single?table=docs_loans&id=${loanId}`); const res = { data: _loanRes.ok ? (await _loanRes.json()).data : null };
    if (res.data) {
      const updatedLoan = { ...existing, ...data, ...res.data, amortizationSchedule: res.data.amortization_schedule || [] };
      get().setLocalOnlyLoans(prev => prev.map(l => l.id === loanId ? updatedLoan : l));
    } else {
      get().setLocalOnlyLoans(prev => prev.map(l => l.id === loanId ? { ...l, ...data } : l));
    } 
  },
  addLoan: async (data) => { 
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

    const { dbService } = await import('../../services/db');
    // supabase import removed
    const newLoanId = crypto.randomUUID();
    
    const snakeCaseData: any = {};
    if (data.number !== undefined) snakeCaseData.loan_number = data.number;
    if (data.name !== undefined) snakeCaseData.name = data.name;
    if (data.type !== undefined) snakeCaseData.type = data.type;
    if (data.principalAmount !== undefined) snakeCaseData.principal_amount = data.principalAmount;
    if (data.interestRate !== undefined) snakeCaseData.interest_rate = data.interestRate;
    if (data.termMonths !== undefined) snakeCaseData.term_months = data.termMonths;
    if (data.startDate !== undefined) snakeCaseData.start_date = data.startDate;
    if (data.interestType !== undefined) snakeCaseData.interest_type = data.interestType;
    if (data.contactId !== undefined) snakeCaseData.contact_id = data.contactId;
    if (data.notes !== undefined) snakeCaseData.notes = data.notes;

    await dbService.upsertDoc('docs_loans', newLoanId, { id: newLoanId,
        ...snakeCaseData,
        status: 'DRAFT',
        company_id: data.companyId || activeCompanyIds[0],
        amortization_schedule: data.amortizationSchedule || []
    });
    const _loanRes = await apiFetch(`/api/docs/single?table=docs_loans&id=${newLoanId}`); const res = { data: _loanRes.ok ? (await _loanRes.json()).data : null };
    if (res.data) {
      const addedLoan = { ...data, ...res.data, id: newLoanId, amortizationSchedule: res.data.amortization_schedule || [] };
      get().setLocalOnlyLoans(prev => [...prev, addedLoan]);
      return addedLoan;
    } 
  },
  postLoan: async (loanId) => { 
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
    const resp = await apiFetch('/api/loans/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',  },
      body: JSON.stringify({ p_loan_id: loanId })
    });
    const res = await resp.json();
    if (!resp.ok || !res.success) throw new Error(res.error || 'Failed to post loan');
    const _loanRes = await apiFetch(`/api/docs/single?table=docs_loans&id=${loanId}`);
    const updatedLoanRes = { data: _loanRes.ok ? (await _loanRes.json()).data : null };
    if (updatedLoanRes.data) {
        get().setLocalOnlyLoans(prev => prev.map(l => l.id === loanId ? { ...l, ...updatedLoanRes.data, journalEntryId: res.data?.journal_id, amortizationSchedule: updatedLoanRes.data.amortization_schedule || [] } : l));
    } 
  },
  deleteLoan: async (loanId: string) => { 
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
  deleteHoliday: async (...args: any[]) => { 
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
  deleteCommissionTarget: async (...args: any[]) => { 
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
  recordLoanPayment: async (loanId, period, date, interestAmount?: number, principalAmount?: number) => { 
    let interestToPay = interestAmount;
    let principalToPay = principalAmount;
    if (interestToPay === undefined || principalToPay === undefined) {
      const loan = (get().allLoans || []).find((l: any) => l.id === loanId);
      if (loan) {
        const sched = loan.amortizationSchedule || loan.amortization_schedule || [];
        const entry = sched.find((s: any) => s.period === period);
        if (entry) {
           if (interestToPay === undefined) interestToPay = entry.interest || 0;
           if (principalToPay === undefined) principalToPay = entry.principal || 0;
        }
      }
    }
    interestToPay = Number(interestToPay) || 0;
    principalToPay = Number(principalToPay) || 0;
    
    const resp = await apiFetch('/api/loans/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',  },
      body: JSON.stringify({ p_loan_id: loanId, p_period: period, p_date: date, p_interest_to_pay: interestToPay, p_principal_to_pay: principalToPay })
    });
    const res = await resp.json();
    if (!resp.ok || !res.success) throw new Error(res.error || 'Failed to post loan payment');
    
    const _loanRes = await apiFetch(`/api/docs/single?table=docs_loans&id=${loanId}`);
    const updatedLoanRes = { data: _loanRes.ok ? (await _loanRes.json()).data : null };
    if (updatedLoanRes.data) {
        get().setLocalOnlyLoans((prev: any[]) => prev.map(l => {
           if (l.id === loanId) {
             return { ...l, ...updatedLoanRes.data, paidPeriods: updatedLoanRes.data.paid_periods || [], paid_periods: updatedLoanRes.data.paid_periods || [], amortizationSchedule: updatedLoanRes.data.amortization_schedule || [] };
           }
           return l;
        }));
    } 
  },
  recordInterestOnlyPayment: async (loanId, period, date) => { 
    const loan = (get().allLoans || []).find((l: any) => l.id === loanId);
    if (!loan) return;
    const sched = loan.amortizationSchedule || loan.amortization_schedule || [];
    const entry = sched.find((s: any) => s.period === period);
    if (entry) {
        await get().recordLoanPayment(loanId, period, date, entry.interest, 0);
    } 
  },
}));
