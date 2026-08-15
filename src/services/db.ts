/**
 * db.ts — FastAPI-backed Database Service Layer
 * All Supabase client SDK calls have been ERADICATED.
 * All reads/writes now flow through our secure FastAPI backend.
 */
import { apiFetch } from '../lib/apiFetch';

function mapLineItem(l: any) {
  if (!l) return l;
  return {
    ...l,
    productId: l.product_id || l.productId,
    unitPrice: l.unit_price || l.unitPrice,
    lineValue: l.line_value || l.lineValue,
    discountMode: l.discount_mode || l.discountMode,
    discountRate: l.discount_rate || l.discountRate,
    discountValue: l.discount_value || l.discountValue,
    serialNumbers: l.serial_numbers || l.serialNumbers,
    costPriceAtSale: l.cost_price_at_sale !== undefined ? (l.cost_price_at_sale === null ? null : Number(l.cost_price_at_sale)) : (l.costPriceAtSale !== undefined ? (l.costPriceAtSale === null ? null : Number(l.costPriceAtSale)) : null),
    accountId: l.account_id || l.accountId,
    contactId: l.contact_id || l.contactId,
    journalId: l.journal_id || l.journalId
  };
}

export function mapDatabaseRowToFrontend(row: any) {
  if (!row) return row;
  const { company_id, ...rest } = row;
  

  
  const mappedNumber = rest.invoice_number || rest.bill_number || rest.payment_number || 
                       rest.credit_note_number || rest.cn_number || rest.loan_number;

  return {
    ...rest,
    id: row.id,
    companyId: company_id || row.companyId,
    customerId: rest.customer_id || rest.customerId || null,
    vendorId: rest.vendor_id || rest.vendorId || null,
    costPrice: rest.cost_price !== undefined ? Number(rest.cost_price) : (rest.costPrice ? Number(rest.costPrice) : 0),
    price: rest.price !== undefined ? Number(rest.price) : (rest.price ? Number(rest.price) : 0),
    total: (rest.total !== undefined && rest.total !== null) ? Number(rest.total) : 0,
    subtotal: (rest.subtotal !== undefined && rest.subtotal !== null) ? Number(rest.subtotal) : 0,
    number: mappedNumber || rest.number || null,
    reference: rest.journal_number || rest.reference_number || rest.reference || null,
    journalType: rest.journal_type || rest.journalType || null,
    journalId: rest.journal_id || rest.journalId || null,
    accountId: rest.account_id || rest.accountId || null,
    contactId: rest.contact_id || rest.contactId || null,
    billId: rest.bill_id || rest.billId || null,
    invoiceId: rest.invoice_id || rest.invoiceId || null,
    createdById: rest.created_by_id || rest.createdById || null,
    preparedBy: rest.prepared_by || rest.preparedBy || null,
    roleId: rest.role_id || rest.roleId || null,
    companyIds: rest.company_ids || rest.companyIds || [],
    userUuid: rest.user_uuid || rest.userUuid || null,
    emailConfirmed: rest.email_confirmed !== undefined ? rest.email_confirmed : rest.emailConfirmed,
    invitationToken: rest.invitation_token || rest.invitationToken || null,
    createdAt: rest.created_at || rest.createdAt || null,
    updatedAt: rest.updated_at || rest.updatedAt || null,
    isSystem: rest.is_system !== undefined ? rest.is_system : rest.isSystem,
    subType: rest.sub_type !== undefined ? rest.sub_type : rest.subType,
    invoiceNumber: rest.invoice_number || rest.invoiceNumber || null,
    invoiceDate: rest.invoice_date || rest.invoiceDate || null,
    dueDate: rest.due_date || rest.dueDate || null,
    customerNote: rest.customer_note || rest.customerNote || null,
    deliveryPerson: rest.delivery_person || rest.deliveryPerson || null,
    salesperson: rest.salesperson || null,
    billNumber: rest.bill_number || rest.billNumber || null,
    billDate: rest.bill_date || rest.billDate || null,
    note: rest.note || null,
    taxTotal: rest.tax_total !== undefined ? Number(rest.tax_total) : (rest.taxTotal !== undefined ? Number(rest.taxTotal) : 0),
    discountTotal: rest.discount_total !== undefined ? Number(rest.discount_total) : (rest.discountTotal !== undefined ? Number(rest.discountTotal) : 0),
    totalProfit: rest.total_profit !== undefined ? Number(rest.total_profit) : (rest.totalProfit !== undefined ? Number(rest.totalProfit) : 0),
    principalAmount: rest.principal_amount !== undefined ? Number(rest.principal_amount) : (rest.principalAmount ? Number(rest.principalAmount) : 0),
    interestRate: rest.interest_rate !== undefined ? Number(rest.interest_rate) : (rest.interestRate ? Number(rest.interestRate) : 0),
    termMonths: rest.term_months !== undefined ? Number(rest.term_months) : (rest.termMonths ? Number(rest.termMonths) : 1),
    interestType: rest.interest_type || rest.interestType || 'REDUCING',
    startDate: rest.start_date || rest.startDate || null,
    paidPeriods: rest.paid_periods || rest.paidPeriods || [],
    amortizationSchedule: rest.amortization_schedule || rest.amortizationSchedule || [],
    journalEntryId: rest.journal_entry_id || rest.journalEntryId || null,
  };
}

// ── Helper: merge line items into parent docs after fetching ──────────────────

async function fetchRelatedLines(table: string, fkField: string, ids: string[]): Promise<any[]> {
  if (!ids.length) return [];
  const CHUNK = 50;
  let allLines: any[] = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const params = new URLSearchParams({ table, [`${fkField}`]: chunk.join(',') });
    // Use bulk fetch endpoint
    const res = await apiFetch(`/api/docs?table=${table}&company_ids=&limit=1000`);
    if (res.ok) {
      const json = await res.json();
      const lineData: any[] = (json.data || []).filter((l: any) => chunk.includes(l[fkField]));
      allLines.push(...lineData);
    }
  }
  return allLines;
}

function buildLinesMap(lines: any[], fkField: string): Record<string, any[]> {
  const map: Record<string, any[]> = {};
  for (const l of lines) {
    const key = l[fkField] || l[fkField.replace(/_/g, '')];
    if (key) {
      if (!map[key]) map[key] = [];
      map[key].push(mapLineItem(l));
    }
  }
  return map;
}

// ── Main service object ───────────────────────────────────────────────────────

export const dbService = {

  async getDocs(table: string, companyIds?: string[]) {
    // Route special tables to dedicated endpoints
    if (table === 'docs_companies') {
      const res = await apiFetch('/api/companies');
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data.data) {
          return data.data.map((row: any) => ({ ...row, id: row.id, ...row }));
        }
      }
      return [];
    }

    if (table === 'docs_accounts') {
      const res = await apiFetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data.data) {
          let accounts = data.data.map((row: any) => ({ ...row, id: row.id, ...row }));
          if (companyIds?.length) {
            accounts = accounts.filter((a: any) => companyIds.includes(a.companyId) || companyIds.includes(a.company_id));
          }
          return accounts;
        }
      }
      return [];
    }

    // Generic table fetch via /api/docs
    const params = new URLSearchParams({ table });
    if (companyIds?.length) params.set('company_ids', companyIds.join(','));

    const res = await apiFetch(`/api/docs?${params}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch ${table}`);
    }
    const json = await res.json();
    const data: any[] = json.data || [];

    // Fetch and attach related lines
    let linesMap: Record<string, any[]> = {};
    if (data.length > 0) {
      const ids = data.map((r: any) => r.id);
      if (table === 'docs_invoices') {
        const lines = await this._fetchChunked('docs_invoice_lines', ids, companyIds);
        linesMap = buildLinesMap(lines, 'invoice_id');
      } else if (table === 'docs_bills') {
        const lines = await this._fetchChunked('docs_bill_lines', ids, companyIds);
        linesMap = buildLinesMap(lines, 'bill_id');
      } else if (table === 'docs_credit_notes') {
        const lines = await this._fetchChunked('docs_credit_note_lines', ids, companyIds);
        linesMap = buildLinesMap(lines, 'credit_note_id');
      } else if (table === 'docs_journals') {
        const lines = await this._fetchChunked('docs_journal_lines', ids, companyIds);
        linesMap = buildLinesMap(lines, 'journal_id');
      }
    }

    return data.map(row => {
      const mapped = mapDatabaseRowToFrontend(row);
      if (['docs_invoices', 'docs_bills', 'docs_credit_notes'].includes(table)) {
        const lineItems = (linesMap[row.id] || []).sort((a: any, b: any) => (a.display_index ?? 0) - (b.display_index ?? 0));
        if (lineItems.length > 0) {
          const dataItems = mapped.items || [];
          mapped.items = lineItems.map((dl: any) => {
            const match = dataItems.find((di: any) => di.id === dl.id);
            return match ? { ...match, ...dl } : dl;
          });
        } else {
          mapped.items = mapped.items || [];
        }
      } else if (table === 'docs_journals') {
        mapped.lines = (linesMap[row.id] || []).filter((l: any) => Number(l.debit) !== 0 || Number(l.credit) !== 0);
      }
      return mapped;
    });
  },

  async getPaginatedDocs(table: string, options: {
    companyIds?: string[];
    limit?: number;
    offset?: number;
    filters?: any;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    countType?: string;
  }) {
    const params = new URLSearchParams({ table });
    if (options.companyIds?.length) params.set('company_ids', options.companyIds.join(','));
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));
    if (options.search) params.set('search', options.search);
    if (options.filters?.status) params.set('status', options.filters.status);

    const res = await apiFetch(`/api/docs?${params}`);
    if (!res.ok) throw new Error(`Failed to fetch ${table}`);
    const json = await res.json();
    const data: any[] = json.data || [];
    const count: number = json.count || 0;

    let linesMap: Record<string, any[]> = {};
    if (data.length > 0) {
      const ids = data.map((r: any) => r.id);
      if (table === 'docs_invoices') {
        const lines = await this._fetchChunked('docs_invoice_lines', ids, options.companyIds);
        linesMap = buildLinesMap(lines, 'invoice_id');
      } else if (table === 'docs_bills') {
        const lines = await this._fetchChunked('docs_bill_lines', ids, options.companyIds);
        linesMap = buildLinesMap(lines, 'bill_id');
      } else if (table === 'docs_credit_notes') {
        const lines = await this._fetchChunked('docs_credit_note_lines', ids, options.companyIds);
        linesMap = buildLinesMap(lines, 'credit_note_id');
      } else if (table === 'docs_journals') {
        const lines = await this._fetchChunked('docs_journal_lines', ids, options.companyIds);
        linesMap = buildLinesMap(lines, 'journal_id');
      }
    }

    const mappedData = data.map(row => {
      const mapped = mapDatabaseRowToFrontend(row);
      if (['docs_invoices', 'docs_bills', 'docs_credit_notes'].includes(table)) {
        const lineItems = (linesMap[row.id] || []).sort((a: any, b: any) => (a.display_index ?? 0) - (b.display_index ?? 0));
        if (lineItems.length > 0) {
          const dataItems = mapped.items || [];
          mapped.items = lineItems.map((dl: any) => {
            const match = dataItems.find((di: any) => di.id === dl.id);
            return match ? { ...match, ...dl } : dl;
          });
        } else {
          mapped.items = mapped.items || [];
        }
      } else if (table === 'docs_journals') {
        mapped.lines = (linesMap[row.id] || []).filter((l: any) => Number(l.debit) !== 0 || Number(l.credit) !== 0);
      }
      return mapped;
    });

    return { data: mappedData, count };
  },

  async getChunkedDocs(table: string, options: {
      companyIds?: string[];
      limit?: number; // Total limit across all chunks, e.g. 2000
      filters?: any;
    }) {
      const maxLimit = options.limit || 2000;
      const chunkSize = 200;
      let allData: any[] = [];
      let currentOffset = 0;
      let hasMore = true;

      while (hasMore && allData.length < maxLimit) {
        const fetchLimit = Math.min(chunkSize, maxLimit - allData.length);
        const { data } = await this.getPaginatedDocs(table, {
          ...options,
          limit: fetchLimit,
          offset: currentOffset,
        });

        if (data && data.length > 0) {
          allData = allData.concat(data);
          currentOffset += fetchLimit;
          if (data.length < fetchLimit) {
            hasMore = false; // Reached end of table
          }
        } else {
          hasMore = false;
        }
      }

      return { data: allData, count: allData.length };
  },



  /** Internal helper: fetch related line items in 50-row chunks */
  async _fetchChunked(table: string, parentIds: string[], companyIds?: string[]): Promise<any[]> {
    const CHUNK = 50;
    let all: any[] = [];
    for (let i = 0; i < parentIds.length; i += CHUNK) {
      const chunk = parentIds.slice(i, i + CHUNK);
      const params = new URLSearchParams({ table, limit: '5000' });
      if (companyIds?.length) params.set('company_ids', companyIds.join(','));
      // CRITICAL: pass the chunk of parent IDs so the backend only returns lines
      // for those specific parent documents. Without this, every loop iteration
      // fetches ALL lines and they accumulate via all.push(), causing duplicates
      // when parentIds.length > CHUNK (e.g. 54 journals → 2 iterations → 4x lines).
      if (chunk.length) params.set('parent_ids', chunk.join(','));
      const res = await apiFetch(`/api/docs?${params}`);
      if (res.ok) {
        const json = await res.json();
        all.push(...(json.data || []));
      }
    }
    return all;
  },

  async getAccountBalances(companyIds: string[]): Promise<Record<string, number>> {
    try {
      const params = new URLSearchParams({ company_ids: companyIds.join(',') });
      const res = await apiFetch(`/api/docs/account-balances?${params}`);
      if (!res.ok) return {};
      const json = await res.json();
      return json.data || {};
    } catch (err) {
      console.error('getAccountBalances error:', err);
      return {};
    }
  },

  async getPartnerBalances(companyIds: string[]): Promise<Record<string, number>> {
    try {
      const params = new URLSearchParams({ company_ids: companyIds.join(',') });
      const res = await apiFetch(`/api/docs/partner-balances?${params}`);
      if (!res.ok) return {};
      const json = await res.json();
      return json.data || {};
    } catch (err) {
      console.error('getPartnerBalances error:', err);
      return {};
    }
  },

  async upsertDoc(table: string, id: string, docData: any) {
    const cleanDoc = { ...docData };
    const tempKeys = ['isSyncing', 'isEditing', 'tempId', 'isTemp', '_localId', 'localId', 'syncState', 'syncAction', 'isOfflineOnly'];
    tempKeys.forEach(k => delete cleanDoc[k]);

    // Strip timestamps — backend controls these
    delete cleanDoc.createdAt;
    delete cleanDoc.updatedAt;
    delete cleanDoc.created_at;
    delete cleanDoc.updated_at;

    const res = await apiFetch('/api/docs/upsert-doc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id, payload: cleanDoc })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || `Failed to upsert ${table}`);
    }
  },

  async deleteDocs(table: string, ids: string[]) {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const validIds = ids.filter(id => UUID_RE.test(id));
    if (!validIds.length) return;

    const res = await apiFetch('/api/docs/delete-doc', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, ids: validIds })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.error || `Failed to delete from ${table}`);
    }
  }
};
