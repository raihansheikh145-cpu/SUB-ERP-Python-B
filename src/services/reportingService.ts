import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/apiFetch';

export interface TrialBalanceEntry {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  branch_id?: string;
  opening_balance: number;
  period_debit: number;
  period_credit: number;
  closing_balance: number;
}

export interface BalanceSheetEntry {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  branch_id?: string;
  balance: number;
}

export interface StockValuationEntry {
  company_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  unit_cost: number;
  on_hand_qty: number;
  total_value: number;
}

export interface GeneralLedgerEntry {
  date: string;
  reference: string;
  description: string;
  company_name: string;
  partner_name: string;
  prepared_by: string;
  debit: number;
  credit: number;
  running_balance: number;
  is_opening: boolean;
}

// Helper to retrieve the active API Base URL
const getApiUrl = (path: string): string => {
  let baseUrl = '';
  try {
    if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) {
      baseUrl = process.env.NEXT_PUBLIC_API_URL;
    }
  } catch (e) {}

  if (!baseUrl) {
    try {
      // @ts-ignore
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
        // @ts-ignore
        baseUrl = import.meta.env.VITE_API_URL;
      }
    } catch (e) {}
  }

  const cleanBase = baseUrl ? baseUrl.replace(/\/$/, '') : '';
  return `${cleanBase}${path}`;
};

// Helper to interact with the orchestration async backend
async function generateAsyncReport(reportType: string, companyIds: string[] | string | null, params: any): Promise<any> {
    const activeIds = Array.isArray(companyIds) ? companyIds : (companyIds && companyIds !== 'CONSOLIDATED' ? [companyIds] : []);
    const singleId = Array.isArray(companyIds) ? companyIds[0] : (companyIds === 'CONSOLIDATED' ? null : companyIds);

    const runDirectRpcFallback = async () => {
        throw new Error(`Direct RPC fallback disabled in Thin-Client architecture`);
    };

    const apiUrl = getApiUrl('/api/reports/generate');
    const isVercel = typeof window !== 'undefined' && (
        window.location.hostname.includes('vercel.app') || 
        window.location.hostname.includes('amplifyapp') || 
        window.location.hostname.includes('web.app') || 
        window.location.hostname.includes('firebaseapp')
    );
    const hasAbsoluteApiUrl = apiUrl.startsWith('http');
    const isLocalhost = typeof window !== 'undefined' && (
        window.location.hostname.includes('localhost') || 
        window.location.hostname.includes('127.0.0.1')
    );

    // If on Vercel or we lack an absolute backend URL and are not on localhost, use the direct RPC immediately
    if (isVercel || (!hasAbsoluteApiUrl && !isLocalhost)) {
        console.log('Client-only or Vercel environment detected. Generating report directly via Supabase RPCs...');
        return runDirectRpcFallback();
    }

    try {
        // Use apiFetch which handles auth tokens automatically
        const res = await apiFetch('/api/reports/generate', {
            method: 'POST',
            body: JSON.stringify({
                reportType,
                companyIds: activeIds,
                companyId: singleId,
                parameters: { ...params, companyIds: activeIds },
                requestedBy: 'SYSTEM'
            })
        });

        if (!res.ok) {
            throw new Error(`Backend report API returned status: ${res.status}`);
        }

        const responseText = await res.text();
        let payload;
        try {
            payload = JSON.parse(responseText);
        } catch (jsonErr) {
            throw new Error('Backend did not return valid JSON. Likely SPA fallback.');
        }

        const { jobId } = payload;
        if (!jobId) {
            throw new Error('No jobId returned by backend reporting API');
        }
        
        // Poll for completion
        let attempts = 0;
        while (attempts < 30) {
            await new Promise(r => setTimeout(r, 2000)); // Poll every 2 seconds
            attempts++;
            const jobRes = await apiFetch(`/api/reports/job/${jobId}`);
            if (!jobRes.ok) throw new Error('Failed to fetch job status');
            const job = await jobRes.json();
            
            if (job.status === 'COMPLETED') {
                return job.result_data;
            } else if (job.status === 'FAILED') {
                throw new Error(job.error_message || 'Job failed');
            }
        }
        throw new Error('Report generation job timed out');
    } catch (err) {
        console.warn('Backend reporting API failed. Falling back to direct Supabase RPC execution:', err);
        return runDirectRpcFallback();
    }
}

export const reportingService = {
  async getTrialBalance(companyIds: string[], startDate: string, endDate: string): Promise<TrialBalanceEntry[]> {
    return generateAsyncReport('TRIAL_BALANCE', companyIds, { startDate, endDate }) as Promise<TrialBalanceEntry[]>;
  },

  async getBalanceSheet(companyIds: string[], asOfDate: string): Promise<BalanceSheetEntry[]> {
    return generateAsyncReport('BALANCE_SHEET', companyIds, { asOfDate }) as Promise<BalanceSheetEntry[]>;
  },

  async getProfitAndLoss(companyIds: string[], startDate: string, endDate: string) {
    return generateAsyncReport('PROFIT_AND_LOSS', companyIds, { startDate, endDate });
  },

  async getStockValuation(companyId: string | null): Promise<StockValuationEntry[]> {
    return generateAsyncReport('STOCK_VALUATION', companyId, {});
  },

  async getInventoryLedger(
    companyIds: string[],
    productIds: string[] | null = null,
    startDate: string | null = null,
    endDate: string | null = null
  ): Promise<any[]> {
    const res = await apiFetch('/api/inventory/ledger', {
      method: 'POST',
      body: JSON.stringify({
        p_company_ids: companyIds,
        p_product_ids: productIds,
        p_start_date: startDate || '1970-01-01',
        p_end_date: endDate || '2099-12-31'
      })
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const data = await res.json();
    return data || [];
  },

  async getGeneralLedger(companyId: string | null, accountId: string, startDate: string, endDate: string): Promise<GeneralLedgerEntry[]> {
    const res = await apiFetch('/api/journals/account-ledger', {
      method: 'POST',
      body: JSON.stringify({
        p_company_id: companyId === 'CONSOLIDATED' ? null : (companyId || null),
        p_account_id: accountId,
        p_start_date: startDate || '1970-01-01',
        p_end_date: endDate || '2099-12-31'
      })
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const data = await res.json();
    return (data || []).map((row: any) => ({
      ...row,
      debit: Number(row.debit) || 0,
      credit: Number(row.credit) || 0
    })) as GeneralLedgerEntry[];
  },

  async getGeneralLedgerByCode(companyIds: string[], accountCode: string, startDate: string, endDate: string): Promise<GeneralLedgerEntry[]> {
    const res = await apiFetch(`/api/accounts?code=${accountCode}`);
    if (!res.ok) return [];
    const accountsData = await res.json();
    const accounts = (accountsData.data || []).filter((a: any) => companyIds.includes(a.company_id));
    if (!accounts || accounts.length === 0) return [];

    const allResults = await Promise.all(accounts.map(acc => 
      this.getGeneralLedger(acc.company_id, acc.id, startDate, endDate)
    ));

    const flattened = allResults.flat().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    return flattened.map(tx => {
      runningBalance += (tx.debit - tx.credit);
      return { ...tx, running_balance: runningBalance };
    });
  },

  async getPartnerSummary(companyIds: string[], contactType: 'CUSTOMER' | 'VENDOR' | 'LOAN_RECEIVABLE' | 'LOAN_PAYABLE', asOfDate: string | null = null): Promise<any[]> {
    if (contactType === 'LOAN_RECEIVABLE' || contactType === 'LOAN_PAYABLE') {
      const isGiven = contactType === 'LOAN_RECEIVABLE';
      const res = await apiFetch(`/api/loans?status=ACTIVE&type=${isGiven ? 'GIVEN' : 'RECEIVED'}`);
      if (!res.ok) throw new Error(await res.text());
      const loansData = await res.json();
      const loans = (loansData.data || []).filter((l: any) => companyIds.includes(l.company_id));

      const contactBalances: Record<string, number> = {};
      (loans || []).forEach((loan: any) => {
        const contactId = loan.contact_id || loan.contactId;
        if (!contactId) return;

        const schedule = loan.amortization_schedule || loan.amortizationSchedule || [];
        const paidPeriods = loan.paid_periods || loan.paidPeriods || [];

        const unpaidPrincipal = schedule
          .filter((e: any) => {
            if (asOfDate) {
              return e.date >= asOfDate || !paidPeriods.includes(e.period);
            }
            return !paidPeriods.includes(e.period);
          })
          .reduce((sum: number, e: any) => sum + (Number(e.principal) || 0), 0);

        contactBalances[contactId] = (contactBalances[contactId] || 0) + unpaidPrincipal;
      });

      return Object.entries(contactBalances).map(([contactId, bal]) => ({
        contact_id: contactId,
        balance: bal
      }));
    }

    // Use backend partner-ledger API to compute balances per partner
    const res = await apiFetch('/api/journals/partner-ledger', {
      method: 'POST',
      body: JSON.stringify({
        p_company_ids: companyIds,
        p_partner_type: contactType,
        p_start_date: '1970-01-01',
        p_end_date: asOfDate || new Date().toISOString().split('T')[0]
      })
    });
    if (!res.ok) throw new Error(await res.text());
    const rows = await res.json();

    // Aggregate balance per contact
    const balanceMap: Record<string, { contact_id: string; contact_name: string; company_id: string; balance: number }> = {};
    (rows || []).forEach((row: any) => {
      const cid = row.partner_id;
      if (!cid) return;
      if (!balanceMap[cid]) {
        balanceMap[cid] = { contact_id: cid, contact_name: row.contact_name || '', company_id: row.company_id || companyIds[0] || '', balance: 0 };
      }
      balanceMap[cid].balance += (Number(row.debit) || 0) - (Number(row.credit) || 0);
    });
    return Object.values(balanceMap).map(r => ({ ...r, balance: Number(r.balance.toFixed(2)) }));
  },

  async getPartnerLedger(
    companyIds: string[], 
    partnerIds: string[] | null, 
    startDate: string, 
    endDate: string,
    partnerType?: string
  ): Promise<any[]> {
    const isLoanType = partnerType === 'LOAN_RECEIVABLE' || partnerType === 'LOAN_PAYABLE';
    const rpcParams: any = {
      p_company_ids: companyIds,
      p_start_date: startDate || '1970-01-01',
      p_end_date: endDate || '2099-12-31'
    };
    if (partnerIds) rpcParams.p_partner_ids = partnerIds;
    if (partnerType && !isLoanType) rpcParams.p_partner_type = partnerType;

    const res = await apiFetch('/api/journals/partner-ledger', {
      method: 'POST',
      body: JSON.stringify(rpcParams)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const mapped = (data || []).map((row: any) => ({
      ...row,
      debit: Number(row.debit) || 0,
      credit: Number(row.credit) || 0
    }));

    if (partnerType === 'LOAN_RECEIVABLE') {
      return mapped.filter((r: any) => 
        String(r.account_name).toLowerCase().includes('loan receivable') || 
        String(r.accountName || '').toLowerCase().includes('loan receivable') || 
        String(r.account_id || r.accountId || '').slice(0, 4) === '1006' || 
        String(r.account_name).toLowerCase().includes('loan provided')
      );
    }

    if (partnerType === 'LOAN_PAYABLE') {
      return mapped.filter((r: any) => 
        String(r.account_name).toLowerCase().includes('loan payable') || 
        String(r.accountName || '').toLowerCase().includes('loan payable') || 
        String(r.account_id || r.accountId || '').slice(0, 4) === '2101' || 
        String(r.account_name).toLowerCase().includes('loan received')
      );
    }

    return mapped;
  },

  async getDashboardSummary(companyId: string | null, args: { asOfDate?: string, startDate?: string, endDate?: string }): Promise<any> {
    try {
      const res = await apiFetch('/api/journals/dashboard-summary', {
        method: 'POST',
        body: JSON.stringify({
          p_company_id: companyId === 'CONSOLIDATED' ? null : companyId,
          as_of_date: args.asOfDate,
          start_date: args.startDate,
          end_date: args.endDate
        })
      });
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    } catch (err) {
      console.error('getDashboardSummary failed:', err);
      return {
        assets: 0, liabilities: 0, equity: 0,
        revenue: 0, expenses: 0, netIncome: 0,
        cashBalance: 0, cashInToday: 0, cashOutToday: 0
      };
    }
  },


  async getAccountBalance(companyIds: string[] | null, accountId: string): Promise<number> {
    const res = await apiFetch('/api/reports/account-balance', {
      method: 'POST',
      body: JSON.stringify({ p_company_ids: companyIds, p_account_id: accountId })
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return Number(data) || 0;
  },

  async getPartnerBalance(companyIds: string[] | null, contactId: string): Promise<number> {
    const res = await apiFetch('/api/reports/partner-balance', {
      method: 'POST',
      body: JSON.stringify({ p_company_ids: companyIds, p_contact_id: contactId })
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return Number(data) || 0;
  },

  async getAllAccountBalances(companyIds: string[] | null, asOfDate: string): Promise<Record<string, number>> {
    try {
      const params = new URLSearchParams();
      if (companyIds && companyIds.length > 0) params.set('company_ids', companyIds.join(','));
      if (asOfDate) params.set('as_of_date', asOfDate);

      const res = await apiFetch(`/api/docs/account-balances?${params.toString()}`);
      if (!res.ok) {
        console.error('Error fetching all account balances:', await res.text());
        return {};
      }
      const json = await res.json();
      return (json?.data || {}) as Record<string, number>;
    } catch (err) {
      console.error('getAllAccountBalances failed:', err);
      return {};
    }
  },

  async getInventoryValuation(companyIds: string[], warehouseId: string = 'all'): Promise<{
    total_items: number;
    total_on_hand: number;
    total_asset_value: number;
    total_retail_value: number;
  }> {
    try {
      // Backend endpoint is GET /api/inventory/valuation?companyId=xxx
      // It only supports one companyId at a time, so we aggregate results
      let totalItems = 0, totalOnHand = 0, totalAssetValue = 0, totalRetailValue = 0;

      for (const companyId of companyIds) {
        const res = await apiFetch(`/api/inventory/valuation?companyId=${encodeURIComponent(companyId)}`);
        if (!res.ok) continue;
        const json = await res.json();
        const items = json?.data || [];
        totalItems += items.length;
        for (const item of items) {
          const qty = Number(item.quantityOnHand) || 0;
          const cost = Number(item.costPrice) || 0;
          const price = Number(item.price) || 0;
          totalOnHand += qty;
          totalAssetValue += qty * cost;
          totalRetailValue += qty * price;
        }
      }

      return {
        total_items: totalItems,
        total_on_hand: totalOnHand,
        total_asset_value: totalAssetValue,
        total_retail_value: totalRetailValue
      };
    } catch (err) {
      console.error('getInventoryValuation failed:', err);
      return { total_items: 0, total_on_hand: 0, total_asset_value: 0, total_retail_value: 0 };
    }
  }
};
