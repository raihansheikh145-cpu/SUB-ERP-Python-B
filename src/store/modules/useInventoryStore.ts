import { supabase } from '../../lib/supabase';
import { Invoice, Contact, CreditNote, Company, Account, Warehouse, ContactType, Bill, Payment, JournalEntry, Product, Loan } from '../../types';
import { create } from 'zustand';
import { apiFetch } from '../../lib/apiFetch';
import * as Types from '../../types/index';
import { useAccountingCoreStore } from './useAccountingCoreStore';
import { useSettingsStore } from './useSettingsStore';
import { useCRMStore } from './useCRMStore';
import { useHRStore } from './useHRStore';
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


export const useInventoryStore = create<any>((set, get) => ({
  allProducts: [],
  setAllProducts: (val: any) => set((state: any) => ({ allProducts: typeof val === 'function' ? val(state.allProducts) : val })),
  setLocalOnlyProducts: (val: any) => set((state: any) => ({ allProducts: typeof val === 'function' ? val(state.allProducts) : val })),
  // TODO: Fix fallback
  // productsRef: useRef<Product[]>([]),
  paginatedProducts: [],
  setPaginatedProducts: (val: any) => set((state: any) => ({ paginatedProducts: typeof val === 'function' ? val(state.paginatedProducts) : val })),
  productCount: 0,
  setProductCount: (val: any) => set((state: any) => ({ productCount: typeof val === 'function' ? val(state.productCount) : val })),
  totalProductsCount: 0,
  setTotalProductsCount: (val: any) => set((state: any) => ({ totalProductsCount: typeof val === 'function' ? val(state.totalProductsCount) : val })),
  isProductsLoading: false,
  setIsProductsLoading: (val: any) => set((state: any) => ({ isProductsLoading: typeof val === 'function' ? val(state.isProductsLoading) : val })),
  fetchProducts: async (options: any) => { 
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

    const cacheKey = 'fetchProducts_' + JSON.stringify(activeCompanyIds) + '_' + JSON.stringify(options && options.nativeEvent ? {} : options);
    const isForce = options?.forceRefresh;
    const cache = fetchCacheMap.get(cacheKey);
    const now = Date.now();
    if (!isForce && cache) {
      if (cache.isFetching) return;
      if (now - cache.lastFetched < 1000) return;
    }
    fetchCacheMap.set(cacheKey, { isFetching: true, lastFetched: cache ? cache.lastFetched : 0 });
    
    get().setIsProductsLoading(true);
    try {
      const { dbService } = await import('../../services/db');
      const { data, count } = await dbService.getPaginatedDocs('docs_products', {
        ...options,
        companyIds: activeCompanyIds,
        countType: 'exact',
      });
      get().setPaginatedProducts(data);
      get().setProductCount(count);
      get().setTotalProductsCount(count);
    
      if (data && data.length > 0) {
        get().setAllProducts(prev => {
          const prevArr = Array.isArray(prev) ? prev : [];
          const existingIds = new Set(prevArr.map(p => p.id));
          const newItems = data.filter((p: any) => p && !existingIds.has(p.id));
          if (newItems.length === 0) return prevArr;
          return [...prevArr, ...newItems];
        });
      }
    } catch (err) {
      console.error('fetchProducts failed:', err);
    } finally {
      fetchCacheMap.set(cacheKey, { isFetching: false, lastFetched: Date.now() });
      get().setIsProductsLoading(false);
    } 
  },
  fetchProductsOnDemand: async (force = false) => { 
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

    const cacheKey = 'fetchProductsOnDemand_' + JSON.stringify(activeCompanyIds);
    const isForce = force;
    const cache = fetchCacheMap.get(cacheKey);
    const now = Date.now();
    if (!isForce && cache) {
      if (cache.isFetching) return;
      if (now - cache.lastFetched < 1000) return;
    }
    fetchCacheMap.set(cacheKey, { isFetching: true, lastFetched: cache ? cache.lastFetched : 0 });
    
    const activeCids = activeCompanyIds && activeCompanyIds.length > 0 
      ? activeCompanyIds 
      : (companies && companies.length > 0 ? [companies[0].id] : []);
    
    if (activeCids.length === 0) return;
    
    if (!force) {
      // Find if we already have some loaded products for these companies
      const productsForActiveCids = (allProducts || []).filter(p => {
        if (!p) return false;
        const pCompanyIds = Array.isArray(p?.companyIds) ? p?.companyIds : [];
        if (p?.companyId) {
          return activeCids.includes(p?.companyId);
        }
        return pCompanyIds.some((id: any) => activeCids.includes(id));
      });
      if (productsForActiveCids.length > 0) {
        console.log("[Store] Products already loaded for these companies, skipping on-demand fetch.");
        return;
      }
    }
    
    get().setIsProductsLoading(true);
    try {
      const { dbService } = await import('../../services/db');
      console.log("[Store] Fetching products on-demand for companies:", activeCids);
      const { data } = await dbService.getPaginatedDocs('docs_products', {
        companyIds: activeCids,
        limit: 5000,
      });
      if (data && data.length > 0) {
        get().setAllProducts(prev => {
          const prevArr = Array.isArray(prev) ? prev : [];
          const prodMap = new Map(prevArr.map(p => [p.id, p]));
          data.forEach(p => {
            if (p) prodMap.set(p.id, p);
          });
          return Array.from(prodMap.values());
        });
      }
    } catch (err) {
      console.error("[Store] fetchProductsOnDemand failed:", err);
    } finally {
      fetchCacheMap.set(cacheKey, { isFetching: false, lastFetched: Date.now() });
      get().setIsProductsLoading(false);
    } 
  },
  searchProductsOnDemand: async (query: string) => { 
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
    
    if (get().searchTimeoutRef.current) {
      clearTimeout(get().searchTimeoutRef.current);
    }
    
    get().searchTimeoutRef.current = setTimeout(async () => {
      try {
        // supabase import removed
        console.log("[Store] Searching products on-demand for:", query);
        
        // supaQuery replaced by apiFetch getDocs call
        let terms = query.trim().split(/\s+/).filter(Boolean);
        if (terms.length > 5 || query.trim().length > 50) terms = [query.trim()];
        terms.forEach(term => {
          supaQuery = supaQuery.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
        });
        
        const { data, error } = await supaQuery.limit(50);
          
        if (error) {
          console.error("[Store] searchProductsOnDemand Supabase error:", error);
          return;
        }
    
        if (data && data.length > 0) {
          get().setAllProducts(prev => {
            const prevArr = Array.isArray(prev) ? prev : [];
            const existingIds = new Set(prevArr.map(p => p.id));
            const newItems = data.filter(p => p && !existingIds.has(p.id));
            return [...prevArr, ...newItems];
          });
        }
      } catch (err) {
        console.error("[Store] searchProductsOnDemand error:", err);
      }
    }, 300); 
  },
  allWarehouses: [],
  setAllWarehouses: (val: any) => set((state: any) => ({ allWarehouses: typeof val === 'function' ? val(state.allWarehouses) : val })),
  setLocalOnlyWarehouses: (val: any) => set((state: any) => ({ allWarehouses: typeof val === 'function' ? val(state.allWarehouses) : val })),
  allProductCosts: [],
  setAllProductCosts: (val: any) => set((state: any) => ({ allProductCosts: typeof val === 'function' ? val(state.allProductCosts) : val })),
  setLocalOnlyProductCosts: (val: any) => set((state: any) => ({ allProductCosts: typeof val === 'function' ? val(state.allProductCosts) : val })),
  allInventoryAdjustments: [],
  setAllInventoryAdjustments: (val: any) => set((state: any) => ({ allInventoryAdjustments: typeof val === 'function' ? val(state.allInventoryAdjustments) : val })),
  setLocalOnlyInventoryAdjustments: (val: any) => set((state: any) => ({ allInventoryAdjustments: typeof val === 'function' ? val(state.allInventoryAdjustments) : val })),
  allInventoryTransactions: [],
  setAllInventoryTransactions: (val: any) => set((state: any) => ({ allInventoryTransactions: typeof val === 'function' ? val(state.allInventoryTransactions) : val })),
  setLocalOnlyInventoryTransactions: (val: any) => set((state: any) => ({ allInventoryTransactions: typeof val === 'function' ? val(state.allInventoryTransactions) : val })),
  get_products: () => { 
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
return (allProducts || [])
  .filter(p => {
    if (!p) return false;
    // Strict Company Filtering: if companyId is set, it must be in activeCompanyIds
    // If not set, check companyIds
    const pCompanyIds = Array.isArray(p?.companyIds) ? p?.companyIds : [];
    if (p?.companyId) {
      return activeCids.includes(p?.companyId);
    }
    return pCompanyIds.some((id: any) => activeCids.includes(id));
  })
  .map(p => {
    // Advanced Inventory: Movement-based calculation per company
    const movementsAll = (get().allInventoryTransactions || [])
      .filter(t => (t.product_id === p.id || t.productId === p.id));
    
    const stockLevels: Record<string, number> = {};
    
    // Initial values from p.initialStockLevels (as base)
    const baseLevels = (p as any).initialStockLevels || {};
    Object.entries(baseLevels).forEach(([cid, q]) => {
      stockLevels[cid] = Number(q || 0);
    });

    // If we have OPENING_STOCK transactions for a company, they should override the fallback for that company
    // to avoid double-counting. But usually, the trigger creates OPENING_STOCK from initialStockLevels.
    // So we'll use a safer approach: if an OPENING_STOCK transaction exists for a company, 
    // we ignore the initialStockLevels value and rely purely on transactions.
    const companiesWithOpeningTx = new Set(
      movementsAll
        .filter(t => (t.reference_type || t.referenceType) === 'OPENING_STOCK')
        .map(t => t.company_id || t?.companyId)
    );

    companiesWithOpeningTx.forEach(cid => {
      if (cid && typeof cid === 'string') stockLevels[cid] = 0; // Reset fallback if transaction exists
    });

    // Apply all movements
    movementsAll.forEach(t => {
      const cid = t.company_id || t?.companyId;
      const type = (t.transaction_type || t.transactionType || '').toUpperCase();
      const q = Number(t.quantity || 0);
      if (!cid) return;

      if (stockLevels[cid] === undefined) stockLevels[cid] = 0;
      
      if (['IN', 'PURCHASE', 'ADJUSTMENT_IN', 'STOCK_OP'].includes(type)) {
        stockLevels[cid] += q;
      } else if (['OUT', 'SALE', 'ADJUSTMENT_OUT'].includes(type)) {
        stockLevels[cid] -= q;
      }
    });

    // Prefer database-computed values since they are the single source of truth across all historical transactions (avoiding 1000 limit pagination cutoff issues in the client)
    const dbStockLevels = (p as any).stockLevels || (p as any).stock_levels;
    const dbQty = (p as any).quantity_on_hand !== undefined ? Number((p as any).quantity_on_hand) : ((p as any).quantityOnHand !== undefined ? Number((p as any).quantityOnHand) : undefined);
    const calculatedQty = activeCids.reduce((sum, cid) => sum + (stockLevels[cid] || 0), 0);
    
    let qty = dbQty !== undefined ? dbQty : calculatedQty;
    const finalStockLevels = (dbStockLevels && Object.keys(dbStockLevels).length > 0) ? dbStockLevels : stockLevels;
    // We already built stockLevels purely from movementsAll correctly

    // Get average cost from product_costs table (calculated by DB triggers) or fall back to database column cost_price
    const relevantCosts = (get().allProductCosts || []).filter(pc => {
      if (!pc) return false;
      const pcProdId = pc.productId || (pc as any).product_id;
      const pcCompanyId = pc?.companyId || (pc as any).company_id;
      return pcProdId === p.id && pcCompanyId && activeCompanyIds.includes(pcCompanyId);
    });
    const totalValue = relevantCosts.reduce((sum, c) => sum + (Number(c.totalValue !== undefined ? c.totalValue : (c as any).total_value || 0)), 0);
    const totalQty = relevantCosts.reduce((sum, c) => sum + (Number(c.totalQty !== undefined ? c.totalQty : (c as any).total_qty || 0)), 0);
    
    const calculatedWac = totalQty > 0 ? (totalValue / totalQty) : undefined;
    const dbCost = (p as any).cost_price !== undefined ? Number((p as any).cost_price) : ((p as any).costPrice !== undefined ? Number((p as any).costPrice) : undefined);
    
    // Prioritize dynamic weighted average cost (WAC). Fallback to static cost price only when dynamic cost is unavailable or 0.
    const wac = (calculatedWac !== undefined && calculatedWac > 0)
      ? calculatedWac
      : (dbCost !== undefined && dbCost > 0 ? dbCost : (p.costPrice || dbCost || 0));
      
    return { 
      ...p, 
      quantityOnHand: qty, 
      costPrice: wac,
      stockLevels: finalStockLevels // Explicit per-company stock levels for validation logic
    } as Product & { quantityOnHand: number; stockLevels: Record<string, number> };
  });; 
  },
  get_resolvedPaginatedProducts: () => { 
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

    return (get().paginatedProducts || [])
.filter(pp => pp)
.map(pp => {
const resolved = (useAccountingCoreStore.getState().products || []).find(p => p && p.id === pp.id);
return resolved ? resolved : pp;
})
.filter(p => {
if (!p) return false;
// Enforce strict company isolation
const activeCids = activeCompanyIds.length > 0
  ? activeCompanyIds
  : (companies && companies.length > 0 ? [companies[0].id] : []);
const pCompanyIds = Array.isArray(p?.companyIds) ? p?.companyIds : [];
if (p?.companyId) {
  return activeCids.includes(p?.companyId);
}
return pCompanyIds.some((id: any) => activeCids.includes(id));
});; 
  },
  get_inventoryAdjustments: () => { 
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

    return (get().allInventoryAdjustments || []).filter(ia => ia && (activeCompanyIds.length === 0 || activeCompanyIds.includes(ia?.companyId))); 
  },
  getDefaultWarehouse: (companyId: string) => { 
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

    const warehouse = (get().allWarehouses || []).find(w => w && w?.companyId === companyId && w.isDefault);
    if (warehouse) return warehouse;
    
    const mainWh: Warehouse = {
      id: `wh-${companyId}-main`,
      name: 'Main Warehouse',
      code: 'MAIN',
      address: '',
      companyId: companyId,
      isDefault: true
    };
    return mainWh; 
  },
  addProduct: async (product: any) => { 
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
    // Restrict inventory to be company-wise separated
    const initialCompanyIds = (product?.companyIds && product?.companyIds.length > 0) 
      ? product?.companyIds 
      : [activeCompanyIds[0] || companies[0]?.id].filter(Boolean);
    const primaryCompanyId = initialCompanyIds[0];
    const externalId = product.externalId || useAccountingCoreStore.getState().generateNextNumber('PRODUCT', new Date().toISOString(), primaryCompanyId);
    
    
    const newProduct: Product = { 
      // Default values for required fields
      taxCode: 'TAX-0',
      invoicingPolicy: 'Ordered quantities',
      trackInventory: true,
      canBeSold: true,
      canBeExpensed: false,
      canBePurchased: true,
      isInPos: true,
      type: 'Goods',
      uom: 'Pcs',
      trackingType: 'NONE',
      serialNumbers: [],
      lastPurchasePrice: Number(product.costPrice) || 0,
      ...product, 
      id: dbId, 
      externalId,
      companyId: primaryCompanyId,
      companyIds: initialCompanyIds,
      stockLevels: { [initialCompanyIds[0]]: Number(product.quantityOnHand) || 0 },
      initialStockLevels: { [initialCompanyIds[0]]: Number(product.quantityOnHand) || 0 },
      initialCost: Number(product.costPrice) || 0,
    };
    
    const qoh = Number(product.quantityOnHand) || 0;
    
    // Generate serial numbers if tracking is enabled and quantity exists
    if (newProduct.trackingType === 'SERIAL' && qoh > 0 && (!newProduct.serialNumbers || newProduct.serialNumbers.length === 0)) {
      newProduct.serialNumbers = Array.from({ length: qoh }, (_, i) => ("temp-" + crypto.randomUUID()));
    }
    
    // Record initial inventory valuation if quantity > 0
    if (qoh > 0) {
      const targetCompanyId = newProduct?.companyIds[0];
      apiFetch('/api/inventory/adjust', {
         method: 'POST',
         body: JSON.stringify({
           productId: dbId,
           quantity: qoh,
           reason: 'Initial Inventory',
           companyId: targetCompanyId
         })
      }).catch(console.error);
    
      const valuation = qoh * (newProduct.costPrice || 0);
      if (valuation > 0) {
        // Record in the first company by default for initial stock
        const targetCompanyId = newProduct?.companyIds[0];
        const invAccount = useAccountingCoreStore.getState().getAccountIdByCode('100502', targetCompanyId) || 
                           useAccountingCoreStore.getState().getAccountIdByCode('100501', targetCompanyId) || 
                           useAccountingCoreStore.getState().getAccountIdByCode('100500', targetCompanyId) || 
                           (allAccounts || []).find(a => a && (a.subType === 'INVENTORY' || a.type === 'ASSET') && a?.companyId === targetCompanyId)?.id || 
                           (allAccounts || [])[0]?.id;
        const equityAccount = useAccountingCoreStore.getState().getAccountIdByCode('300000', targetCompanyId) || 
                              useAccountingCoreStore.getState().getAccountIdByCode('300001', targetCompanyId) || 
                              (allAccounts || []).find(a => a && (a.subType === 'EQUITY' || a.type === 'EQUITY') && a?.companyId === targetCompanyId)?.id || 
                              (allAccounts || [])[0]?.id;
        
        useAccountingCoreStore.getState().addJournalEntry({
          date: getOpDateBST(),
          description: `Initial Inventory: ${newProduct.name}`,
          reference: `INIT-${newProduct.sku || dbId}`,
          status: 'POSTED',
          lines: [
            { 
              id: `INV-DR-${dbId}`, 
              accountId: invAccount, 
              debit: valuation, 
              credit: 0, 
              description: `Initial Stock: ${newProduct.name}` 
            },
            { 
              id: `eq-cr-${dbId}`, 
              accountId: equityAccount, 
              contactId: newProduct.adjustmentContactId,
              debit: 0, 
              credit: valuation, 
              description: `Opening Balance Equity` 
            }
          ]
        }, targetCompanyId).catch(err => {
          console.error("Failed to post initial stock journal entry during product creation:", err);
        });
      }
    }
    
    // Extract brand and category
    if (newProduct.brand) {
      useSettingsStore.getState().setAllBrands((prev: any[]) => {
         if (prev.some(b => b.name === newProduct.brand && b?.companyId === initialCompanyIds[0])) return prev;
         return [...prev, { id: ("temp-" + crypto.randomUUID()), name: newProduct.brand as string, description: '', companyId: initialCompanyIds[0] }];
      });
    }
    if (newProduct.category) {
      useSettingsStore.getState().setAllCategories((prev: any[]) => {
         if (prev.some(c => c.name === newProduct.category && c?.companyId === initialCompanyIds[0])) return prev;
         return [...prev, { id: ("temp-" + crypto.randomUUID()), name: newProduct.category as string, description: '', companyId: initialCompanyIds[0] }];
      });
    }
    
    // SYNC TO SUPABASE
    const { stockLevels, initialStockLevels, ...newProductRest } = newProduct as any;
    const res = await apiFetch('/api/products/upsert', {
      method: 'POST',
      body: JSON.stringify({ p_product: {
        id: newProduct.id,
        data: newProductRest,
        company_id: newProduct?.companyIds[0],
        company_ids: newProduct.companyIds,
        name: newProduct.name,
        sku: newProduct.sku,
        price: Number(newProduct.price) || 0,
        description: newProduct.description || '',
        category: newProduct.category || 'All',
        brand: newProduct.brand || '',
        type: newProduct.type || 'Goods',
        uom: newProduct.uom || 'Units',
        track_inventory: newProduct.trackInventory !== false,
        can_be_sold: newProduct.canBeSold !== false,
        can_be_purchased: newProduct.canBePurchased !== false,
        } })
    });
    const json = await res.json();
    let error = res.ok ? null : new Error(json.error || json.detail || 'API Error');
    if (!error && !json.success) {
      error = new Error(json.error || json.message || 'API returned success=false');
    }
    if (error) {
      console.error("Failed to sync new product to Supabase:", error);
      throw error;
    }
    
    get().setLocalOnlyProducts(prev => [...prev, newProduct]);
    get().setPaginatedProducts(prev => {
      if (prev.some(p => p.id === newProduct.id)) return prev;
      return [newProduct, ...prev];
    });
    get().setProductCount(prev => prev + 1);
    
    return newProduct; 
  },
  bulkAddProducts: (newProducts: any[]) => { 
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

    const timestamp = Date.now();
    const preparedProducts = newProducts.map((p, idx) => {
      const initialQty = Number(p.quantityOnHand) || 0;
      const targetCid = p?.companyIds?.[0] || activeCompanyIds[0];
      return {
        ...p,
        id: ("temp-" + crypto.randomUUID()),
        externalId: p.externalId || ("temp-" + crypto.randomUUID()),
        stockLevels: { [targetCid]: initialQty },
        initialStockLevels: { [targetCid]: initialQty },
        initialCost: Number(p.costPrice) || 0,
        lastPurchasePrice: p.costPrice || 0,
        companyIds: p?.companyIds || [activeCompanyIds[0]]
      };
    });
    
    // Record initial inventory valuation for each product with quantity > 0
    preparedProducts.forEach(p => {
      const qoh = p.stockLevels[p?.companyIds[0]] || 0;
      if (qoh > 0) {
        const valuation = qoh * (p.costPrice || 0);
        if (valuation > 0) {
          const targetCompanyId = p?.companyIds[0];
          const invAccount = useAccountingCoreStore.getState().getAccountIdByCode('100502', targetCompanyId) || 
                             useAccountingCoreStore.getState().getAccountIdByCode('100501', targetCompanyId) || 
                             useAccountingCoreStore.getState().getAccountIdByCode('100500', targetCompanyId) || 
                             (allAccounts || []).find(a => a && (a.subType === 'INVENTORY' || a.type === 'ASSET') && a?.companyId === targetCompanyId)?.id || 
                             (allAccounts || [])[0]?.id;
          const equityAccount = useAccountingCoreStore.getState().getAccountIdByCode('300000', targetCompanyId) || 
                                useAccountingCoreStore.getState().getAccountIdByCode('300001', targetCompanyId) || 
                                (allAccounts || []).find(a => a && (a.subType === 'EQUITY' || a.type === 'EQUITY') && a?.companyId === targetCompanyId)?.id || 
                                (allAccounts || [])[0]?.id;
    
          useAccountingCoreStore.getState().addJournalEntry({
            date: getOpDateBST(),
            description: `Initial Inventory (Bulk): ${p.name}`,
            reference: `INIT-${p.sku || p.id}`,
            status: 'POSTED',
            lines: [
              { id: `INV-DR-${p.id}`, accountId: invAccount, debit: valuation, credit: 0, description: `Initial Stock: ${p.name}` },
              { id: `eq-cr-${p.id}`, accountId: equityAccount, debit: 0, credit: valuation, description: `Opening Balance Equity` }
            ]
          }, targetCompanyId).catch(err => {
            console.error("Failed to post bulk initial stock journal entry:", err);
          });
        }
      }
    });
    
    get().setLocalOnlyProducts(prev => [...prev, ...preparedProducts]);
    get().setPaginatedProducts(prev => [...preparedProducts, ...prev]);
    get().setProductCount(prev => prev + preparedProducts.length);
    
    // SYNC TO SUPABASE
    const productsToUpsert = preparedProducts.map(p => {
      const { quantityOnHand, costPrice, initialCost, stockLevels, initialStockLevels, ...rest } = p as any;
      return {
      id: p.id,
      data: rest,
      company_id: p?.companyIds[0],
      name: p.name,
      sku: p.sku,
      price: p.price,
      }; });
    
    if (productsToUpsert.length > 0) {
      
        apiFetch('/api/products/bulk-upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json',  },
          body: JSON.stringify({ p_products: productsToUpsert })
        }).then(res => res.json()).then(data => {
          if (!data.success) console.error("bulkAddProducts: Sync Failed", data.errors);
        });
    } 
  },
  bulkImportProducts: async (importedProducts: any[]) => { 
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

    console.log('bulkImportProducts: starting for', importedProducts.length, 'items');
    const fallbackCompanyId = activeCompanyIds[0] || (companies && companies[0]?.id);
    const defaultCompanyIds = fallbackCompanyId ? [fallbackCompanyId] : [];
    const timestamp = Date.now();
    
    
    const updatedProductsList = [...(get().productsRef.current || [])];
    const uniqueBrandsMap = new Set<string>();
    const uniqueCategoriesMap = new Set<string>();
    
    const productsToUpsert: any[] = [];
    
    importedProducts.forEach((p, idx) => {
      let existingIdx = -1;
      if (p.externalId) {
        existingIdx = updatedProductsList.findIndex(ep => ep.externalId === p.externalId);
      }
      if (existingIdx === -1 && p.sku) {
        existingIdx = updatedProductsList.findIndex(ep => ep.sku && String(ep.sku).trim() !== '' && String(ep.sku).toLowerCase().trim() === String(p.sku).toLowerCase().trim());
      }
      if (existingIdx === -1 && p.name) {
        existingIdx = updatedProductsList.findIndex(ep => ep.name && String(ep.name).toLowerCase().trim() === String(p.name).toLowerCase().trim());
      }
      
      if (p.brand) uniqueBrandsMap.add(p.brand);
      if (p.category) uniqueCategoriesMap.add(p.category);
    
      const productId = existingIdx >= 0 ? updatedProductsList[existingIdx].id : ("temp-" + crypto.randomUUID());
      const initialQty = Number(p.quantityOnHand) || 0;
      
      let rawCompanyIds = p?.companyIds || defaultCompanyIds;
      let resolvedCompanyIds: string[] = [];
      
      if (Array.isArray(rawCompanyIds)) {
        resolvedCompanyIds = rawCompanyIds.map(cid => {
          if (!cid) return '';
          const found = (companies || []).find(c => 
            c.id === cid || 
            (c.name && String(cid).toLowerCase() === c.name.toLowerCase())
          );
          return found ? found.id : '';
        }).filter(Boolean);
      }
      
      if (resolvedCompanyIds.length === 0) {
        resolvedCompanyIds = defaultCompanyIds;
      }
    
      const targetCid = resolvedCompanyIds[0] || fallbackCompanyId;
    
      const productData: Product = {
        ...p,
        id: productId,
        externalId: p.externalId || (existingIdx >= 0 ? updatedProductsList[existingIdx].externalId : ("temp-" + crypto.randomUUID())),
        companyIds: resolvedCompanyIds,
        stockLevels: { [targetCid]: initialQty },
        initialStockLevels: { [targetCid]: initialQty },
        initialCost: Number(p.costPrice) || 0,
        price: Number(p.price) || 0,
        costPrice: Number(p.costPrice) || 0,
        purchasePrice: Number(p.costPrice) || 0,
        lastPurchasePrice: Number(p.costPrice) || 0,
        lastPurchaseRate: Number(p.costPrice) || 0,
        trackInventory: p.trackInventory !== undefined ? p.trackInventory : true,
        type: p.type || 'Goods',
        canBeSold: p.canBeSold !== undefined ? p.canBeSold : true,
        canBePurchased: p.canBePurchased !== undefined ? p.canBePurchased : true
      };
    
      if (existingIdx >= 0) {
        const oldProduct = updatedProductsList[existingIdx];
        const merged = { ...oldProduct, ...productData, externalId: oldProduct.externalId };
        updatedProductsList[existingIdx] = merged;
        const { ...mergedRest } = merged as any;
        mergedRest.costPrice = oldProduct.costPrice;
        mergedRest.quantityOnHand = oldProduct.quantityOnHand;
        mergedRest.initialCost = oldProduct.initialCost;
        productsToUpsert.push({
          id: merged.id,
          data: mergedRest,
          company_id: merged?.companyIds[0] || fallbackCompanyId,
          name: merged.name,
          sku: merged.sku,
          price: Number(merged.price) || 0,
          });
      } else {
        const newProduct = {
          ...productData,
          id: productId,
        };
        updatedProductsList.push(newProduct as Product);
        const { stockLevels, initialStockLevels, ...newProductRest } = newProduct as any;
        productsToUpsert.push({
          id: newProduct.id,
          data: newProductRest,
          company_id: targetCid,
          name: newProduct.name,
          sku: newProduct.sku,
          price: Number(newProduct.price) || 0,
          });
        
        const qoh = newProduct.stockLevels?.[targetCid] || 0;
        
      }
    });
    
    
    // Process unique brands and categories first, grouped by target company
    const brandsToUpsert: any[] = [];
    const updatedBrands = [...(get().brandsRef.current || [])];
    const categoriesToUpsert: any[] = [];
    const updatedCategories = [...(get().categoriesRef.current || [])];
    
    importedProducts.forEach((p) => {
      let rawCompanyIds = p?.companyIds || defaultCompanyIds;
      let resolvedCompanyIds: string[] = [];
      if (Array.isArray(rawCompanyIds)) {
        resolvedCompanyIds = rawCompanyIds.map((cid: any) => {
          if (!cid) return '';
          const found = (companies || []).find(c => 
            c.id === cid || 
            (c.name && String(cid).toLowerCase() === c.name.toLowerCase())
          );
          return found ? found.id : '';
        }).filter(Boolean);
      }
      if (resolvedCompanyIds.length === 0) {
        resolvedCompanyIds = defaultCompanyIds;
      }
      const targetCid = resolvedCompanyIds[0] || fallbackCompanyId;
      if (!targetCid) return;
    
      if (p.brand) {
        const brandName = String(p.brand).trim();
        if (brandName && !updatedBrands.some(x => x.name.toLowerCase() === brandName.toLowerCase() && x?.companyId === targetCid)) {
          const newBrand = { id: ("temp-" + crypto.randomUUID()), name: brandName, description: '', companyId: targetCid };
          updatedBrands.push(newBrand);
          brandsToUpsert.push({ id: newBrand.id, data: newBrand, company_id: targetCid });
        }
      }
    
      if (p.category) {
        const catName = String(p.category).trim();
        if (catName && !updatedCategories.some(x => x.name.toLowerCase() === catName.toLowerCase() && x?.companyId === targetCid)) {
          const newCat = { id: ("temp-" + crypto.randomUUID()), name: catName, description: '', companyId: targetCid };
          updatedCategories.push(newCat);
          categoriesToUpsert.push({ id: newCat.id, data: newCat, company_id: targetCid });
        }
      }
    });
    
    try {
      if (brandsToUpsert.length > 0) {
        const finalBrandsToUpsertMap = new Map<string, any>();
        brandsToUpsert.forEach(b => finalBrandsToUpsertMap.set(b.id, b));
        const finalBrandsToUpsert = Array.from(finalBrandsToUpsertMap.values());
    
        const res = await apiFetch('/api/settings/brands', {
          method: 'POST',
          body: JSON.stringify({ brands: finalBrandsToUpsert })
        }).then(r => r.json());
        if (!res.success) throw new Error(`Brands sync failed: ${res.error}`);
      }
      if (categoriesToUpsert.length > 0) {
        const finalCategoriesToUpsertMap = new Map<string, any>();
        categoriesToUpsert.forEach(c => finalCategoriesToUpsertMap.set(c.id, c));
        const finalCategoriesToUpsert = Array.from(finalCategoriesToUpsertMap.values());
    
        const res = await apiFetch('/api/settings/categories', {
          method: 'POST',
          body: JSON.stringify({ categories: finalCategoriesToUpsert })
        }).then(r => r.json());
        if (!res.success) throw new Error(`Categories sync failed: ${res.error}`);
      }
      if (productsToUpsert.length > 0) {
        const finalProductsToUpsertMap = new Map<string, any>();
        productsToUpsert.forEach(pr => finalProductsToUpsertMap.set(pr.id, pr));
        const finalProductsToUpsert = Array.from(finalProductsToUpsertMap.values());
    
        // Chunk products into batches of 1000
        for (let i = 0; i < finalProductsToUpsert.length; i += 1000) {
          const res = await withRetry(async () => {
             const resp = await apiFetch('/api/products/bulk-upsert', {
               method: 'POST',
               body: JSON.stringify({ p_products: finalProductsToUpsert.slice(i, i + 1000) })
             });
             const json = await resp.json();
             return { error: resp.ok ? null : new Error(json.error || 'Bulk Upsert Error') };
          });
          if (res.error) throw new Error(`Products sync failed: ${res.error.message}`);
        }
      }
    } catch (dbErr: any) {
      console.error('bulkImportProducts: DB push failed', dbErr);
      throw dbErr;
    }
    
    // Finally update local state and refs!
    get().brandsRef.current = updatedBrands;
    get().categoriesRef.current = updatedCategories;
    get().productsRef.current = updatedProductsList;
    
    useSettingsStore.getState().setLocalOnlyBrands(updatedBrands);
    useSettingsStore.getState().setLocalOnlyCategories(updatedCategories);
    get().setLocalOnlyProducts(updatedProductsList);
    
    console.log('bulkImportProducts: completed'); 
  },
  updateProduct: async (id: string, updates: Partial<Product>) => { 
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

    const product = (allProducts || []).find(p => p.id === id) || (get().paginatedProducts || []).find(p => p.id === id);
    if (!product) return;
    
    // Extract brand and category
    const initialCompanyIds = (updates?.companyIds && updates?.companyIds.length > 0) 
      ? updates?.companyIds 
      : product.companyIds || [activeCompanyIds[0] || companies[0]?.id].filter(Boolean);
    const primaryCompanyId = initialCompanyIds[0];
    
    if (updates.brand && updates.brand !== product.brand) {
      useSettingsStore.getState().setAllBrands((prev: any[]) => { 
         if (prev.some(b => b.name === updates.brand && b?.companyId === primaryCompanyId)) return prev; 
         return [...prev, { id: ("temp-" + crypto.randomUUID()), name: updates.brand as string, description: '', companyId: primaryCompanyId }]; 
      }); 
    }
    if (updates.category && updates.category !== product.category) {
      useSettingsStore.getState().setAllCategories((prev: any[]) => { 
         if (prev.some(c => c.name === updates.category && c?.companyId === primaryCompanyId)) return prev; 
         return [...prev, { id: ("temp-" + crypto.randomUUID()), name: updates.category as string, description: '', companyId: primaryCompanyId }]; 
      });
    }
    
    // Simple change detection
    const changes = ['name', 'price', 'costPrice', 'sku', 'category', 'type'].filter(
      key => (updates as any)[key] !== undefined && (updates as any)[key] !== (product as any)[key]
    );
    
    // Handle Inventory Adjustment via Movement (Transaction)
    const targetCompanyId = (updates as any)?.companyId || (product as any).companyId || (product as any).company_id || product?.companyIds?.[0] || activeCompanyIds[0] || companies?.[0]?.id;
    const qohUpdate = (updates as any).quantityOnHand;
    
    // We get current QOH from the database value first, falling back to calculation
    const currentQtyForAdjustment = product.quantityOnHand !== undefined 
      ? Number(product.quantityOnHand) 
      : ((get().allInventoryTransactions || [])
          .filter(t => t.product_id === id && t.company_id === targetCompanyId)
          .reduce((sum, t) => sum + (t.transaction_type === 'IN' ? t.quantity : -t.quantity), 0)
        );
    
    if (qohUpdate !== undefined && qohUpdate !== currentQtyForAdjustment) {
      const diff = Number(qohUpdate) - currentQtyForAdjustment;
      const valuation = Math.abs(diff * (updates.costPrice || product.costPrice || 0));
      
      // Emit Inventory Transaction for Adjustment
      const adjTransaction: any = {
        id: ("temp-" + crypto.randomUUID()),
        company_id: targetCompanyId,
        product_id: id,
        transaction_type: diff > 0 ? 'IN' : 'OUT',
        quantity: Math.abs(diff),
        reference_id: `ADJ-${id}`,
        reference_type: 'ADJUSTMENT',
        date: getOpDateBST(),
        cost_price: product.costPrice || 0,
        };
    
      
        apiFetch('/api/inventory/adjust', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
          },
          body: JSON.stringify({
            productId: id,
            quantity: diff,
            reason: `Manual UI Update`,
            companyId: targetCompanyId
          })
        }).then(res => res.json()).then(res => {
          if (!res.success) {
            console.error('Inventory Adjustment Backend Sync Failed:', res.error);
          } else {
             adjTransaction.id = res.transactionId;
          }
        }).catch(err => console.error('Inventory Adjustment API Error:', err));
    
      get().setAllInventoryTransactions(prev => [...prev, adjTransaction]);
    
      // Sync serial numbers if tracking is enabled
      if (product.trackingType === 'SERIAL' || updates.trackingType === 'SERIAL') {
        const currentSerials = (updates as any).serialNumbers || product.serialNumbers || [];
        if (qohUpdate > currentSerials.length) {
          const needed = qohUpdate - currentSerials.length;
          const newSerials = Array.from({ length: needed }, (_, i) => ("temp-" + crypto.randomUUID()));
          updates.serialNumbers = [...currentSerials, ...newSerials];
        } else if (qohUpdate < currentSerials.length) {
          updates.serialNumbers = currentSerials.slice(0, qohUpdate);
        }
      }
    
      if (valuation > 0 && (updates as any).adjustmentContactId) {
        useAccountingCoreStore.getState().addJournalEntry({
          date: getOpDateBST(),
          description: `Inventory Adjustment: ${product.name} (${diff > 0 ? '+' : ''}${diff} Units)`,
          reference: `ADJ-${product.sku || product.id}`,
          status: 'POSTED',
          lines: [
            { 
              id: ("temp-" + crypto.randomUUID()), 
              accountId: useAccountingCoreStore.getState().getAccountIdByCode('100502', targetCompanyId), 
              debit: diff > 0 ? valuation : 0, 
              credit: diff < 0 ? valuation : 0, 
              description: `Stock Adjustment: ${product.name}` 
            },
            { 
              id: ("temp-" + crypto.randomUUID()), 
              accountId: useAccountingCoreStore.getState().getAccountIdByCode('500501', targetCompanyId), 
              contactId: (updates as any).adjustmentContactId,
              debit: diff < 0 ? valuation : 0, 
              credit: diff > 0 ? valuation : 0, 
              description: `Inventory Adjustment Expense` 
            }
          ]
        }, targetCompanyId);
      }
    }
    
    const body = (updates as any).reason 
      ? `Inventory Adjustment: ${(updates as any).reason} (New Qty: ${(updates as any).quantityOnHand})`
      : changes.length > 0 ? `Product updated: ${changes.join(', ')}` : '';
    
    const newMessages = body ? [...(product.messages || []), {
      id: ("temp-" + crypto.randomUUID()),
      authorId: currentUser?.id || 'user-1',
      body,
      date: formatDateTime(new Date()),
      type: 'notification'
    }] : (product.messages || []);
    
    get().setLocalOnlyProducts(prevProducts => {
      return prevProducts.map(p => {
        if (p.id !== id) return p;
        const { adjustmentContactId, reason, ...rest } = updates as any;
        return { 
          ...p, 
          ...rest,
          messages: newMessages
        };
      });
    });
    
    get().setPaginatedProducts(prevProducts => {
      return prevProducts.map(p => {
        if (p.id !== id) return p;
        const { adjustmentContactId, reason, ...rest } = updates as any;
        return { 
          ...p, 
          ...rest,
          messages: newMessages
        };
      });
    });
    
    // SYNC TO SUPABASE
    try {
      const updatedProd = { ...product, ...updates };
      
      const { 
        adjustmentContactId, 
        reason, 
        ...restSync 
      } = updatedProd as any;
      
      
      const payload: any = {
        name: restSync.name,
        sku: restSync.sku,
        price: Number(restSync.price) || 0,
        description: restSync.description || '',
        category: restSync.category || 'All',
        brand: restSync.brand || '',
        type: restSync.type || 'Goods',
        uom: restSync.uom || 'Units',
        track_inventory: restSync.trackInventory !== false,
        can_be_sold: restSync.canBeSold !== false,
        can_be_purchased: restSync.canBePurchased !== false,
        can_be_expensed: restSync.canBeExpensed === true,
        data: restSync
      };
      
      if (restSync.isInPos !== undefined) payload.is_in_pos = restSync.isInPos;
      if (restSync.taxCode !== undefined) payload.tax_code = restSync.taxCode;
    
      console.log('Sending update for ID:', id, 'Payload:', payload); 
      // Merge ID into payload for upsert
      const upsertPayload = { id, ...payload, company_id: payload.company_id || primaryCompanyId };
      
      const res = await apiFetch('/api/products/upsert', {
        method: 'POST',
        body: JSON.stringify({ p_product: upsertPayload })
      });
      const data = await res.json();
      let error = res.ok ? null : new Error(data.error || data.detail || 'Update failed');
      
      console.log('Update result:', data);
      if (!error && !data.success) {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'DB Update blocked! ' + (data.error || 'Validation failed'), type: 'error' } }));
      }
      if (error) {
        console.error('Failed to sync updated product to Supabase:', error);
        throw new Error(JSON.stringify(error) + ' / ' + error.message);
      }
      console.log('Dummy close for updateProduct');
    } catch(e: any) { 
       console.error(e); 
       window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Product Update Error: ' + e.message, type: 'error' } }));
    } 
  },
  deleteInventoryAdjustment: async (...args: any[]) => { 
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
  deleteProducts: async (...args: any[]) => { 
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
  recalculateProductInventory: async (productId: string) => { 
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

     
  },
}));
