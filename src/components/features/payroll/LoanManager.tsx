import { supabase } from '../../../lib/supabase';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import React, { useState, useMemo, useEffect, useRef } from "react";
import PartnerLedgerReport from "../accounting/PartnerLedgerReport";
import { motion, AnimatePresence } from "framer-motion";
import ExportButtons from "../../common/ExportButtons";
import Pagination from "../../common/Pagination";
import SearchableSelect from "../../common/SearchableSelect";
import { useAccountingCoreStore } from "../../../store/modules/useAccountingCoreStore";
import { useHRStore } from "../../../store/modules/useHRStore";
import { useCRMStore } from "../../../store/modules/useCRMStore";
import { useSalesStore } from '../../../store/modules/useSalesStore';
import { usePurchasingStore } from '../../../store/modules/usePurchasingStore';
import { useInventoryStore } from '../../../store/modules/useInventoryStore';

import {
  FileText,
  Plus,
  Search,
  Filter,
  ChevronRight,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ExternalLink,
  Info,
  History,
  TrendingUp,
  PieChart,
  ArrowLeft,
  Download,
  Printer,
  Share2,
  X,
  Check,
  CreditCard,
  Banknote,
  User,
} from "lucide-react";

const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};


import {
  Loan,
  LoanType,
  InterestType,
  ContactType,
  AmortizationEntry,
} from "../../../types/index";
import {
  formatNumber,
  exportToXLSX,
  exportToPDF,
  getOpDateBST,
} from "../../../utils/constants";


import ColumnSelector, {
  useColumns,
  ColumnDef,
} from "../../common/ColumnSelector";









interface LoanManagerProps {
  defaultCreate?: boolean;
  onNavigate?: (tab: string, filter?: any) => void;
}

const calculateAmortizationSchedule = (
  principal: number,
  rate: number,
  months: number,
  type: "REDUCING" | "FLAT",
  startDate: Date
): AmortizationEntry[] => {
  const schedule: AmortizationEntry[] = [];
  if (months <= 0 || principal <= 0) return schedule;

  const monthlyRate = rate / 100 / 12;
  
  if (type === "REDUCING") {
    const pmt = monthlyRate === 0 
      ? principal / months 
      : principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
      
    let balance = principal;
    let currentDate = new Date(startDate);
    
    for (let i = 1; i <= months; i++) {
      currentDate.setMonth(currentDate.getMonth() + 1);
      const interest = balance * monthlyRate;
      let principalPayment = pmt - interest;
      
      if (i === months) {
        principalPayment = balance;
      }
      
      balance -= principalPayment;
      
      schedule.push({
        period: i,
        date: currentDate.toISOString(),
        principal: Number(principalPayment.toFixed(2)),
        interest: Number(interest.toFixed(2)),
        payment: Number((principalPayment + interest).toFixed(2)),
        balance: Math.max(0, Number(balance.toFixed(2))),
        status: "PENDING"
      });
    }
  } else {
    // FLAT
    const totalInterest = principal * (rate / 100) * (months / 12);
    const monthlyInterest = totalInterest / months;
    const monthlyPrincipal = principal / months;
    const pmt = monthlyPrincipal + monthlyInterest;
    
    let balance = principal;
    let currentDate = new Date(startDate);
    
    for (let i = 1; i <= months; i++) {
      currentDate.setMonth(currentDate.getMonth() + 1);
      
      let principalPayment = monthlyPrincipal;
      if (i === months) {
        principalPayment = balance;
      }
      
      balance -= principalPayment;
      
      schedule.push({
        period: i,
        date: currentDate.toISOString(),
        principal: Number(principalPayment.toFixed(2)),
        interest: Number(monthlyInterest.toFixed(2)),
        payment: Number(pmt.toFixed(2)),
        balance: Math.max(0, Number(balance.toFixed(2))),
        status: "PENDING"
      });
    }
  }
  
  return schedule;
};

const LoanManager: React.FC<LoanManagerProps> = ({
  defaultCreate,
  onNavigate,
}) => {
  const {
    activeCompanyIds,
    activeCompanies,
    allEntries: entries,
    allAccounts: accounts,
    restoreRecord,
    permanentDeleteRecord,
    hasPermission,
  } = useAccountingCoreStore();
  const {
    allLoans: loans,
    addLoan,
    updateLoan,
    postLoan,
    deleteLoan,
    recordLoanPayment,
    recordInterestOnlyPayment,
    updateLoanAmortizationEntry,
  } = useHRStore();
  const { allContacts, fetchContacts, searchContactsOnDemand, addContact } =
    useCRMStore();
  const { currentUser } = useHRStore();
  const contacts = allContacts;
  const currentCompany = activeCompanies?.[0] || {
    id: activeCompanyIds?.[0] || "",
    name: "",
    currency: "$",
    registrationNumber: "",
    taxId: "",
    address: "",
  };

  const [view, setView] = useState<"list" | "detail">("list");

  const [showModal, setShowModal] = useState(defaultCreate || false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    period: 0,
    date: getOpDateBST(),
    principal: 0,
    interest: 0,
  });
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedule" | "ledger" | "notes">(
    "schedule",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(80);

  const [columns, setColumns] = useColumns("loan_list", [
    { id: "number", label: "Contract ID", visible: true },
    { id: "description", label: "Description", visible: true },
    { id: "partner", label: "Lender", visible: true },
    { id: "principal", label: "Original Principal", visible: true },
    { id: "outstanding", label: "Remaining", visible: true },
    { id: "rate", label: "Rate", visible: true },
    { id: "status", label: "Status", visible: true },
  ]);

  const [editingCell, setEditingCell] = useState<{
    period: number;
    field: "principal" | "interest" | "date";
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const handleEditCell = (
    period: number,
    field: "principal" | "interest" | "date",
    value: number | string,
  ) => {
    setEditingCell({ period, field });
    setEditValue(value.toString());
  };

  const handleSaveCell = (loanId: string) => {
    if (!editingCell) return;
    if (editingCell.field === "date") {
      updateLoanAmortizationEntry(loanId, editingCell.period, {
        date: editValue,
      });
    } else {
      const val = parseFloat(editValue);
      if (!isNaN(val))
        updateLoanAmortizationEntry(loanId, editingCell.period, {
          [editingCell.field]: val,
        });
    }
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, loanId: string) => {
    if (e.key === "Enter") {
      handleSaveCell(loanId);
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const selectedLoan = useMemo(
    () => (loans || []).find((l: any) => l.id === selectedLoanId) || null,
    [loans, selectedLoanId],
  );

  const cleanContactName = (name: string) => {
    if (!name) return name;
    return name.replace(/\s*\((customer|vendor|employee)\)/gi, "");
  };

  const contactOptions = useMemo(() => {
    return (contacts || [])
      .filter(
        (c: any) =>
          c.type === "LENDER" || c.type === "LOAN" || c.is_lender || c.isLender,
      )
      .map((c: any) => ({
        id: c.id,
        name: cleanContactName(c.name),
        extra: c.type,
        subExtra: c.email || c.phone || "",
      }));
  }, [contacts, loans]);

  useEffect(() => {
    if (defaultCreate) setShowModal(true);
  }, [defaultCreate]);

  const [isEditing, setIsEditing] = useState(false);
  const fetchedContactIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchMissing = async () => {
      const missingContactIds = Array.from(new Set((loans || [])
        .map((l: any) => l.contactId || l.contact_id)
        .filter(Boolean)
        .filter((id: string) => !fetchedContactIds.current.has(id) && !(allContacts || []).find((c: any) => c.id === id))
      ));
      
      if (missingContactIds.length > 0) {
        missingContactIds.forEach(id => fetchedContactIds.current.add(id));
        try {
          const results = await Promise.all(
            missingContactIds.map(id => 
              apiFetch(`/api/docs/single?table=docs_contacts&id=${id}`)
                .then(res => res.json())
                .then(json => json.data || null)
                .catch(() => null)
            )
          );
          
          const map: any = {};
          results.filter(Boolean).forEach((d: any) => {
            let name = d.name;
            if (!name && d.data) {
                try {
                    const parsed = typeof d.data === 'string' ? JSON.parse(d.data) : d.data;
                    name = parsed.name || parsed.companyName || parsed.firstName;
                } catch (e) {}
            }
            map[d.id] = { ...d, name };
          });
          
          if (Object.keys(map).length > 0) {
            setContactMap(prev => ({ ...prev, ...map }));
          }
        } catch (e) {
          console.error("Failed to fetch missing contacts", e);
        }
      }
    };
    fetchMissing();
  }, [loans, allContacts]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [contactMap, setContactMap] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState({
    number: `LOAN-${generateUUID().slice(-6)}`,
    name: "",
    type: "RECEIVED" as LoanType,
    principalAmount: 0,
    interestRate: 9,
    termMonths: 12,
    startDate: getOpDateBST(),
    interestType: "REDUCING" as InterestType,
    contactId: "",
    notes: "",
  });

  const [loanJournalEntries, setLoanJournalEntries] = useState<any[]>([]);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);
  const [ledgerViewType, setLedgerViewType] = useState<"ALL" | "PRINCIPAL" | "INTEREST">("ALL");
  const [ledgerDateFrom, setLedgerDateFrom] = useState("");
  const [ledgerDateTo, setLedgerDateTo] = useState("");
  const [ledgerFilterKeyword, setLedgerFilterKeyword] = useState("");

  useEffect(() => {
    let active = true;
    if (selectedLoan && (activeTab === "ledger" || activeTab === "schedule")) {
      const fetchLoanJournalEntries = async () => {
        setIsLedgerLoading(true);
        try {
          const { apiFetch } = await import("../../../lib/apiFetch");
          
          const loanJournalId = selectedLoan.journalEntryId || (selectedLoan as any).journal_entry_id;
          const contactId = selectedLoan.contactId || selectedLoan.contact_id;
          
          // 1. Fetch all ledger lines tagged with this contact
          const ledgerRes = await apiFetch("/api/journals/partner-ledger", {
            method: "POST",
            body: JSON.stringify({
              p_partner_ids: [contactId],
              p_company_ids: activeCompanyIds || [currentCompany?.id].filter(Boolean),
            })
          });
          
          const journalMap = new Map();
          
          if (ledgerRes.ok) {
            const data = await ledgerRes.json();
            const lines = Array.isArray(data) ? data : (data.data || []);
            
            lines.forEach((line: any) => {
               if (!journalMap.has(line.journal_id)) {
                   journalMap.set(line.journal_id, {
                       id: line.journal_id,
                       date: line.date,
                       description: line.journal_description || line.description || "",
                       reference: line.reference_number || line.reference || "",
                       lines: []
                   });
               }
               const j = journalMap.get(line.journal_id);
               j.lines.push({
                   id: line.line_id || line.id,
                   journalId: line.journal_id,
                   accountId: line.account_id,
                   accountName: line.account_name,
                   contactId: contactId,
                   debit: Number(line.debit || 0),
                   credit: Number(line.credit || 0),
                   description: line.journal_description || line.description
               });
            });
          }

          // 2. Fallback: If the loan's primary journal isn't in the partner ledger, fetch it directly
          if (loanJournalId && !journalMap.has(loanJournalId)) {
            const jRes = await apiFetch(`/api/docs/single?table=docs_journals&id=${loanJournalId}`);
            if (jRes.ok) {
                const jData = (await jRes.json()).data;
                const jlRes = await apiFetch(`/api/docs?table=docs_journal_lines&parent_ids=${loanJournalId}`);
                const jLines = jlRes.ok ? (await jlRes.json()).data || [] : [];
                
                journalMap.set(loanJournalId, {
                    id: jData.id,
                    date: jData.journal_date || jData.date,
                    description: jData.description,
                    reference: jData.reference || jData.journal_number,
                    lines: jLines.map((l: any) => ({
                        id: l.id,
                        journalId: l.journal_id,
                        accountId: l.account_id,
                        accountName: l.account?.name || l.account_name,
                        contactId: l.contact_id,
                        debit: Number(l.debit || 0),
                        credit: Number(l.credit || 0),
                        description: l.description || jData.description,
                    }))
                });
            }
          }

          if (active) {
            setLoanJournalEntries(Array.from(journalMap.values()));
          }
        } catch (e: any) {
          console.error("Failed to fetch loan journal postings:", e);
          console.error("Ledger fetch error", e);
        } finally {
          if (active) setIsLedgerLoading(false);
        }
      };
      fetchLoanJournalEntries();
    } else {
      setLoanJournalEntries([]);
    }
    return () => {
      active = false;
    };
  }, [selectedLoan, activeTab, activeCompanyIds, currentCompany?.id]);

  const ledgerEntries = useMemo(() => {
    // Find matching entries in store
    const localMatches = (entries || []).filter(
      (e: any) =>
        e.id === (selectedLoan?.journalEntryId || (selectedLoan as any)?.journal_entry_id) ||
        String(e.reference || "").includes(selectedLoan?.number || "") ||
        String(e.description || "").includes(selectedLoan?.name || "") ||
        String(e.description || "").includes(
          (selectedLoan?.name || "").split("-")[1]?.trim() ||
            selectedLoan?.name ||
            "X",
        ) ||
        (e.lines || []).some(
          (l: any) =>
            l.contactId === selectedLoan?.contactId ||
            l.contact_id === selectedLoan?.contactId,
        ),
    );

    // Combine localMatches and loanJournalEntries, de-duplicating by ID
    const merged = [...localMatches];
    loanJournalEntries.forEach((entry: any) => {
      if (!merged.some((m) => m.id === entry.id)) {
        merged.push(entry);
      }
    });

    return merged.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [entries, loanJournalEntries, selectedLoan]);

  const loanLedgerRows = useMemo(() => {
    if (!selectedLoan) return [];

    const loanContactId = selectedLoan.contactId || (selectedLoan as any).contact_id;
    const loanJournalId = selectedLoan.journalEntryId || (selectedLoan as any).journal_entry_id;

    // Fallback: If we can't find the exact account via store, we will rely on lines that either match our known loan contact,
    // or just assume lines matching the loanAccountCode if the account details are fully hydrated in lines.
    // Actually, we can get ALL possible IDs for the loan account codes across all companies to be safe,
    // since the ledger entries are already filtered for this specific loan.
    const loanAccountCode =
      selectedLoan.type === "RECEIVED" ? "210100" : "100601";
    const isLiability = selectedLoan.type === "RECEIVED";

    const possibleLoanAccountIds = (accounts || [])
      .filter((a: any) => String(a.code) === loanAccountCode)
      .map((a: any) => a.id);
      
    const possibleInterestAccountIds = (accounts || [])
      .filter((a: any) => 
        String(a.code) === '500208' || 
        String(a.code) === '600000' || 
        String(a.code) === '400200' || 
        String(a.name || "").toLowerCase().includes('interest')
      )
      .map((a: any) => a.id);

    const rows: any[] = [];
    ledgerEntries.forEach((entry: any) => {
      (entry.lines || []).forEach((line: any) => {
        // A line belongs to the loan ledger if it hits the loan account, OR if the account is unknown but the line specifies the loan contact.
        // We only care about lines mapped to the loan account, 
        // OR if somehow it's unmapped we guess by description
        const lineContactId = line.contactId || line.contact_id;
        const lineAccountId = line.accountId || line.account_id;
        
        const isLoanContact = Boolean(loanContactId) && lineContactId === loanContactId;
        const isLoanAccount = possibleLoanAccountIds.includes(lineAccountId);
        const isInterestAccount = possibleInterestAccountIds.includes(lineAccountId);


        const isExplicitDisbursement = String(entry.id || "").toUpperCase() === `JE-LOAN-${String(selectedLoan.id || "").toUpperCase()}`;
        const isExplicitPayment = String(entry.id || "").toUpperCase().includes(`JE-LPAY-`) || String(entry.id || "").toUpperCase().includes(`JE-LOAN-PAY`);
        
        // Ensure we only include the actual loan account line, not the offset cash line!
        // For RECEIVED loans (Liability), the principal is CREDITED on disbursement, and DEBITED on payment.
        // So the offset (Cash) is DEBITED on disbursement, CREDITED on payment.
        let isCorrectSide = true;
        if (isExplicitDisbursement) {
            isCorrectSide = isLiability ? line.credit > 0 : line.debit > 0;
        } else if (isExplicitPayment) {
            isCorrectSide = isLiability ? line.debit > 0 : line.credit > 0;
        }
        
        const isPrincipalLine = (isLoanAccount || (isLoanContact && isCorrectSide) || String(line.description || "").includes("Principal") || (isExplicitDisbursement && isCorrectSide)) && !isInterestAccount;
        
        const interestAcc = (accounts || []).find((a: any) => a.id === lineAccountId);
        const isInterestLine = isInterestAccount || 
          String(line.description || "").toLowerCase().includes("interest") ||
          String(interestAcc?.name || "").toLowerCase().includes("interest") ||
          String(line.accountName || "").toLowerCase().includes("interest");
          
        const isExplicitPrincipal = isExplicitPayment && !isInterestLine && isCorrectSide && (line.debit > 0 || line.credit > 0);

        if (isPrincipalLine || isInterestLine || isExplicitPrincipal) {
          rows.push({
            id: line.id || generateUUID(),
            journalId: entry.id,
            date: entry.date,
            description: line.description || entry.description || "",
            reference: entry.reference || entry.id,
            debit: line.debit || 0,
            credit: line.credit || 0,
            isInterest: isInterestLine && !isPrincipalLine && !isExplicitPrincipal,
          });
        }
      });
    });

    // Check if disbursement entry exists. If not, inject a synthetic opening balance row.
    const hasDisbursement = rows.some((r) => 
      String(r.journalId || "").toUpperCase() === `JE-LOAN-${String(selectedLoan.id || "").toUpperCase()}` || 
      String(r.description || "").toLowerCase().includes("disbursement") || 
      String(r.description || "").toLowerCase().includes("opening") ||
      String(r.reference || "").toLowerCase().includes("opln")
    );
    
    if (!hasDisbursement) {
      const amt = Number(selectedLoan.principal_amount || selectedLoan.amount || 0);
      if (amt > 0) {
        rows.push({
          id: 'synthetic-opening-balance',
          journalId: 'SYS-OP-BAL',
          date: selectedLoan.startDate || (selectedLoan as any).start_date || (selectedLoan as any).created_at || new Date().toISOString(),
          description: 'Opening Balance (Disbursement)',
          reference: 'OP-BAL',
          debit: isLiability ? 0 : amt,
          credit: isLiability ? amt : 0,
          isInterest: false,
        });
      }
    }

    // Sort ascending by date for running balance
    rows.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      
      // if same date, prioritize "opening" or "disbursement"
      const isOpeningA =
        String(a.description).toLowerCase().includes("opening") ||
        String(a.description).toLowerCase().includes("disbursement") ||
        String(a.reference).toLowerCase().includes("opln") ||
        String(a.journalId).toUpperCase().includes("JE-LOAN-") ||
        a.id === 'synthetic-opening-balance'
          ? -1
          : 1;
      const isOpeningB =
        String(b.description).toLowerCase().includes("opening") ||
        String(b.description).toLowerCase().includes("disbursement") ||
        String(b.reference).toLowerCase().includes("opln") ||
        String(b.journalId).toUpperCase().includes("JE-LOAN-") ||
        b.id === 'synthetic-opening-balance'
          ? -1
          : 1;
      
      if (isOpeningA !== isOpeningB) return isOpeningA - isOpeningB;
      
      // Put principal before interest on the same date
      if (a.isInterest && !b.isInterest) return 1;
      if (!a.isInterest && b.isInterest) return -1;
      
      return 0;
    });

    let runningBalance = 0;
    return rows.map((r) => {
      if (!r.isInterest) {
        if (isLiability) {
          runningBalance += r.credit - r.debit;
        } else {
          runningBalance += r.debit - r.credit;
        }
      }
      return { ...r, balance: runningBalance };
    });
  }, [ledgerEntries, selectedLoan, accounts]);

  const filteredLoanLedgerRows = useMemo(() => {
    let rows = [...loanLedgerRows];
    if (ledgerFilterKeyword) {
      const kw = ledgerFilterKeyword.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.description || "").toLowerCase().includes(kw) ||
          (r.reference || "").toLowerCase().includes(kw),
      );
    }
    if (ledgerDateFrom) {
      rows = rows.filter((r) => new Date(r.date) >= new Date(ledgerDateFrom));
    }
    if (ledgerDateTo) {
      rows = rows.filter((r) => new Date(r.date) <= new Date(ledgerDateTo));
    }
    
    if (ledgerViewType === "PRINCIPAL") {
      rows = rows.filter(r => !r.isInterest);
    } else if (ledgerViewType === "INTEREST") {
      rows = rows.filter(r => r.isInterest);
    }
    
    return rows;
  }, [loanLedgerRows, ledgerDateFrom, ledgerDateTo, ledgerViewType]);

  // Load defaults from localStorage
  useEffect(() => {
    const lastRate = localStorage.getItem("last_loan_interest_rate");
    const lastTerm = localStorage.getItem("last_loan_term_months");
    if (lastRate || lastTerm) {
      setFormData((prev) => ({
        ...prev,
        interestRate: lastRate ? parseFloat(lastRate) : prev.interestRate,
        termMonths: lastTerm ? parseInt(lastTerm) : prev.termMonths,
      }));
    }
  }, []);

  const filteredLoans = useMemo(() => {
    console.log("DEBUG store loans =>", loans);
    return (loans || []).filter((l: any) => {
      // Soft Delete Filter
      if (l.status === "DELETED" && !showDeleted) return false;
      if (l.status !== "DELETED" && showDeleted) return false;

      return (
        String(l.name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        String(l.number || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    });
  }, [loans, searchQuery, showDeleted]);

  const totalPages = Math.ceil(filteredLoans.length / pageSize);
  const paginatedLoans = filteredLoans.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleExport = (format: "excel" | "pdf", scope: "page" | "all") => {
    const dataToExport = scope === "page" ? paginatedLoans : filteredLoans;

    if (dataToExport.length === 0) return alert("No loans to export.");

    const totalPrincipal = dataToExport.reduce(
      (sum, l) => sum + (l.principalAmount || 0),
      0,
    );

    const headers = [
      "Contract ID",
      "Description",
      "Type",
      "Lender",
      "Principal",
      "Interest Rate",
      "Term (Months)",
      "Status",
    ];
    const rows = [
      headers,
      ...dataToExport.map((loan: Loan) => {
        const contact =
          (allContacts || contacts || []).find(
            (c: any) => c.id === loan.contactId || c.id === loan.contact_id,
          ) || contactMap[loan.contactId || loan.contact_id];
        return [
          loan.number,
          loan.name,
          loan.type === "RECEIVED" ? "Loan Payable" : "Loan Receivable",
          contact?.name || "N/A",
          loan.principalAmount,
          `${loan.interestRate}% ${loan.interestType}`,
          loan.termMonths,
          loan.status,
        ];
      }),
      ["TOTAL", "", "", "", totalPrincipal, "", "", ""],
    ];

    if (format === "excel") {
      exportToXLSX("Loans", rows);
    } else {
      exportToPDF("Loans", rows);
    }
  };

  const handleLedgerExport = (format: "excel" | "pdf") => {
    if (filteredLoanLedgerRows.length === 0)
      return alert("No ledger postings to export.");

    const headers = [
      "Date",
      "Description",
      "Reference",
      "Debit",
      "Credit",
      "Balance",
    ];

    // Convert text balance to number for aggregation row
    const lastRow = filteredLoanLedgerRows[filteredLoanLedgerRows.length - 1];
    const totalDebit = filteredLoanLedgerRows.reduce(
      (sum: number, r: any) => sum + (r.debit || 0),
      0,
    );
    const totalCredit = filteredLoanLedgerRows.reduce(
      (sum: number, r: any) => sum + (r.credit || 0),
      0,
    );

    const rows = [
      headers,
      ...filteredLoanLedgerRows.map((r: any) => [
        r.date,
        r.description,
        r.reference,
        r.debit || 0,
        r.credit || 0,
        Math.abs(r.balance) + (r.balance < 0 ? " CR" : " DR"),
      ]),
      ["TOTAL", "", "", totalDebit, totalCredit, ""],
    ];

    if (format === "excel") {
      exportToXLSX(`Loan_Ledger_${selectedLoan?.number || "Export"}`, rows);
    } else {
      exportToPDF(`Loan_Ledger_${selectedLoan?.number || "Export"}`, rows);
    }
  };

  const stats = useMemo(() => {
    try {
      const activeLoans = (loans || []).filter(
        (l: any) => l.status === "ACTIVE",
      );
      const totalExposure = activeLoans.reduce((sum: number, l: any) => {
        const rawPaid = l.paidPeriods || l.paid_periods || [];
        const paidStr = Array.isArray(rawPaid) ? rawPaid.map(String) : [];
        const totalPaidPrincipal = (l.amortizationSchedule || [])
          .filter(
            (e: any) =>
              paidStr.includes(String(e.period)) || e.status === "PAID",
          )
          .reduce((s: number, e: any) => s + (e.principal || 0), 0);
        const unpaidPrincipal =
          (l.principalAmount || l.amount || 0) - totalPaidPrincipal;
        return sum + unpaidPrincipal;
      }, 0);

      const overdueAmount = activeLoans.reduce((sum: number, l: any) => {
        const rawPaid = l.paidPeriods || l.paid_periods || [];
        const paidStr = Array.isArray(rawPaid) ? rawPaid.map(String) : [];
        const totalPaidPrincipal = (l.amortizationSchedule || [])
          .filter(
            (e: any) =>
              paidStr.includes(String(e.period)) || e.status === "PAID",
          )
          .reduce((s: number, e: any) => s + (e.principal || 0), 0);
        const outstanding = Math.max(
          0,
          (l.principalAmount || l.amount || 0) - totalPaidPrincipal,
        );
        if (outstanding <= 0) return sum;

        const today = new Date();
        const overdue = (l.amortizationSchedule || [])
          .filter(
            (e: any) =>
              !paidStr.includes(String(e.period)) &&
              new Date(e.date) < today &&
              e.status !== "PAID",
          )
          .reduce(
            (s: number, e: any) => s + ((e.principal || 0) + (e.interest || 0)),
            0,
          );
        return sum + overdue;
      }, 0);

      return {
        totalExposure,
        activeCount: activeLoans.length,
        overdueAmount,
        totalInterest: activeLoans.reduce((sum: number, l: any) => {
          const rawPaid = l.paidPeriods || l.paid_periods || [];
          const paidStr = Array.isArray(rawPaid) ? rawPaid.map(String) : [];
          const remainingInterest = (l.amortizationSchedule || [])
            .filter(
              (e: any) =>
                !paidStr.includes(String(e.period)) && e.status !== "PAID",
            )
            .reduce((s: number, e: any) => s + (e.interest || 0), 0);
          return sum + remainingInterest;
        }, 0),
      };
    } catch (e) {
      console.error("stats calc error", e);
      return {
        totalExposure: 0,
        activeCount: 0,
        overdueAmount: 0,
        totalInterest: 0,
      };
    }
  }, [loans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission("ledger_edit")) {
      alert("You do not have permission to modify loans.");
      return;
    }
    if (!formData.contactId) {
      alert("Please select a partner (Contact) for this loan.");
      return;
    }

    try {
      const schedule = calculateAmortizationSchedule(
        formData.principalAmount || formData.amount || 0,
        formData.interestRate,
        formData.termMonths,
        formData.interestType as any,
        new Date(formData.startDate)
      );

      const loanPayload = {
        ...formData,
        amortizationSchedule: schedule
      };

      if (isEditing && selectedLoanId) {
        await updateLoan(selectedLoanId, loanPayload);
      } else {
        await addLoan(loanPayload);
      }
    } catch (err: any) {
      alert("Error saving loan: " + err.message);
      return;
    }

    // Save defaults to localStorage
    localStorage.setItem(
      "last_loan_interest_rate",
      formData.interestRate.toString(),
    );
    localStorage.setItem(
      "last_loan_term_months",
      formData.termMonths.toString(),
    );

    setShowModal(false);
    setIsEditing(false);
    setFormData({
      number: `LOAN-${generateUUID().slice(-6)}`,
      name: "",
      type: "RECEIVED",
      principalAmount: 0,
      interestRate: 9,
      termMonths: 12,
      startDate: getOpDateBST(),
      interestType: "REDUCING",
      contactId: "",
      notes: "",
    });
  };

  const handlePostLoan = async (loanId: string) => {
    try {
      await postLoan(loanId);
    } catch (error: any) {
      alert(`Failed to post loan: ${error.message}`);
    }
  };

  const handleSavePayment = async () => {
    if (!selectedLoan || !paymentData.period) return;
    try {
      await recordLoanPayment(
        selectedLoan.id,
        paymentData.period,
        paymentData.date,
        Number(paymentData.interest),
        Number(paymentData.principal),
      );
      setShowPaymentModal(false);
      // alert('Payment recorded successfully!');
    } catch (e: any) {
      alert("Error recording payment: " + e.message);
    }
  };

  const handleRecordPayment = async (
    loanId: string,
    period: number,
    date: string,
  ) => {
    let p = 0;
    let i = 0;
    let d = date;
    const loan = (loans || []).find((l: any) => l.id === loanId);
    if (loan) {
      const sched =
        loan.amortizationSchedule || loan.amortization_schedule || [];
      const entry = sched.find((s: any) => s.period === period);
      if (entry) {
        p = entry.principal || 0;
        i = 0; // Default to 0 as requested
      }
    }

    if (editingCell && editingCell.period === period) {
      const val = parseFloat(editValue);
      if (editingCell.field === "principal" && !isNaN(val)) p = val;
      if (editingCell.field === "interest" && !isNaN(val)) i = val;
      if (editingCell.field === "date") d = editValue;
      setEditingCell(null);
    }

    setPaymentData({
      period,
      date: d || new Date().toISOString().split("T")[0],
      principal: Number(p),
      interest: Number(i),
    });
    setShowPaymentModal(true);
  };

  const handleRecordInterestOnly = async (
    loanId: string,
    period: number,
    date: string,
  ) => {
    try {
      await recordInterestOnlyPayment(loanId, period, date);
    } catch (error: any) {
      alert(`Failed to record interest payment: ${error.message}`);
    }
  };

  const handleDeleteLoan = (loanId: string) => {
    if (deleteConfirmId === loanId) {
      deleteLoan(loanId);
      if (selectedLoanId === loanId) {
        setSelectedLoanId(null);
        setView("list");
      }
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(loanId);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "PAID":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "DRAFT":
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      case "VOID":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "DELETED":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  const dynamicSchedule = useMemo(() => {
    if (!selectedLoan || !selectedLoan.amortizationSchedule) return [];
    
    const todayStr = getOpDateBST();
    const today = new Date(todayStr);
    today.setHours(0, 0, 0, 0);
    
    let firstUnpaidFound = false;
    let shiftDate = new Date();
    
    return selectedLoan.amortizationSchedule.map((entry: any) => {
      const isPaid = selectedLoan.paidPeriods?.includes(entry.period.toString());
      const isPrincipalPaid = selectedLoan.paidPrincipalPeriods?.includes(entry.period.toString());
      const fullyPaid = isPaid || isPrincipalPaid;
      
      let dynamicDateStr = entry.date;
      
      if (!fullyPaid && !firstUnpaidFound) {
        firstUnpaidFound = true;
        const entryDate = new Date(entry.date.includes("T") ? entry.date.split("T")[0] : entry.date);
        entryDate.setHours(0, 0, 0, 0);
        
        // If it's overdue, shift it to today
        if (entryDate < today) {
          dynamicDateStr = todayStr;
          shiftDate = new Date(todayStr);
        } else {
          shiftDate = new Date(entry.date);
        }
      } else if (!fullyPaid && firstUnpaidFound) {
        // Subsequent unpaid periods shift based on the first unpaid period's date
        shiftDate.setMonth(shiftDate.getMonth() + 1);
        dynamicDateStr = shiftDate.toISOString().split("T")[0];
      }
      
      return {
        ...entry,
        dynamicDate: dynamicDateStr.includes("T") ? dynamicDateStr.split("T")[0] : dynamicDateStr
      };
    });
  }, [selectedLoan]);

  return (
    <div className="flex flex-col h-full bg-[#f5f6f7] text-slate-900 font-sans overflow-hidden">
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* App Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 shrink-0 shadow-sm z-10 sticky top-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <h1 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    Loan & Financing{" "}
                    <span className="bg-indigo-100 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest border border-indigo-200">
                      v2.2
                    </span>
                  </h1>
                  <div className="h-6 w-px bg-slate-200"></div>

                  <div className="flex items-center space-x-4 text-xs font-bold text-slate-500">
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-400 uppercase tracking-widest text-[9px]">
                        Exposure:
                      </span>
                      <span className="text-slate-800">
                        {currentCompany.currency}{" "}
                        {formatNumber(stats.totalExposure)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-400 uppercase tracking-widest text-[9px]">
                        Overdue:
                      </span>
                      <span className="text-rose-600">
                        {currentCompany.currency}{" "}
                        {formatNumber(stats.overdueAmount)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors">
                    <Printer size={16} />
                  </button>
                  <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors">
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        number: `LOAN-${generateUUID().slice(-6)}`,
                        name: "",
                        type: "GIVEN",
                        principalAmount: 0,
                        contactId: "",
                        notes: "",
                      }));
                      setIsEditing(false);
                      setShowModal(true);
                    }}
                    className="bg-[#354a5f] text-white px-3.5 py-1.5 rounded text-xs font-bold flex items-center space-x-1.5 hover:bg-[#2c3d4f] transition-all shadow-sm active:scale-95"
                  >
                    <ArrowUpRight size={14} className="text-emerald-400" />
                    <span>Give Loan</span>
                  </button>
                  <button
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        number: `LOAN-${generateUUID().slice(-6)}`,
                        name: "",
                        type: "RECEIVED",
                        principalAmount: 0,
                        contactId: "",
                        notes: "",
                      }));
                      setIsEditing(false);
                      setShowModal(true);
                    }}
                    className="bg-[#714B67] text-white px-3.5 py-1.5 rounded text-xs font-bold flex items-center space-x-1.5 hover:bg-[#5b3c53] transition-all shadow-sm active:scale-95"
                  >
                    <ArrowDownLeft size={14} className="text-amber-400" />
                    <span>Receive Loan</span>
                  </button>
                </div>
              </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Exposure
                  </span>
                  <TrendingUp size={14} className="text-emerald-500" />
                </div>
                <p className="text-xl font-bold text-slate-800">
                  {currentCompany.currency} {formatNumber(stats.totalExposure)}
                </p>
                <div className="mt-2 flex items-center text-[10px] text-slate-400">
                  <Clock size={10} className="mr-1" />
                  <span>Updated just now</span>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Active Contracts
                  </span>
                  <FileText size={14} className="text-blue-500" />
                </div>
                <p className="text-xl font-bold text-slate-800">
                  {stats.activeCount}
                </p>
                <div className="mt-2 flex items-center text-[10px] text-slate-400">
                  <span className="text-emerald-500 font-bold mr-1">+2</span>
                  <span>since last month</span>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-rose-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Overdue Amount
                  </span>
                  <AlertCircle size={14} className="text-rose-500" />
                </div>
                <p className="text-xl font-bold text-rose-600">
                  {currentCompany.currency} {formatNumber(stats.overdueAmount)}
                </p>
                <div className="mt-2 flex items-center text-[10px] text-rose-500 font-bold">
                  <span>Needs immediate attention</span>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Future Interest
                  </span>
                  <PieChart size={14} className="text-indigo-500" />
                </div>
                <p className="text-xl font-bold text-slate-800">
                  {currentCompany.currency} {formatNumber(stats.totalInterest)}
                </p>
                <div className="mt-2 flex items-center text-[10px] text-slate-400">
                  <span>Projected revenue/cost</span>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search by contract name, number or lender..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0070d2]/20 focus:border-[#0070d2] outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <button className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <Filter size={16} />
                  <span>Adapt Filters</span>
                </button>
                <div
                  className="flex items-center space-x-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-[#0070d2] transition-colors cursor-pointer"
                  onClick={() => setShowDeleted(!showDeleted)}
                >
                  <input
                    type="checkbox"
                    id="showDeletedLoans"
                    checked={showDeleted}
                    onChange={(e) => {
                      setShowDeleted(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-[#0070d2] focus:ring-[#0070d2]"
                  />
                  <label
                    htmlFor="showDeletedLoans"
                    className="text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer select-none"
                  >
                    Show Deleted
                  </label>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-xs text-slate-400 font-medium">
                  Showing {paginatedLoans.length} of {filteredLoans.length}{" "}
                  contracts
                </div>
                <ExportButtons onExport={handleExport} />
              </div>
            </div>

            {/* Data Table */}
            <div className="flex-1 overflow-auto p-6">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table
                  id="loan-ledger-table"
                  className="w-full text-left border-collapse"
                >
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {columns.find((c) => c.id === "number")?.visible && (
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Contract ID
                        </th>
                      )}
                      {columns.find((c) => c.id === "description")?.visible && (
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Description
                        </th>
                      )}
                      {columns.find((c) => c.id === "partner")?.visible && (
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Lender
                        </th>
                      )}
                      {columns.find((c) => c.id === "principal")?.visible && (
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Original Principal
                        </th>
                      )}
                      {columns.find((c) => c.id === "outstanding")?.visible && (
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Remaining
                        </th>
                      )}
                      {columns.find((c) => c.id === "rate")?.visible && (
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Rate
                        </th>
                      )}
                      {columns.find((c) => c.id === "status")?.visible && (
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                      )}
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right w-10">
                        <ColumnSelector
                          columns={columns}
                          onChange={setColumns}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedLoans.map((loan: Loan) => {
                      const contact =
                        (allContacts || contacts || []).find(
                          (c: any) =>
                            c.id === loan.contactId || c.id === loan.contact_id,
                        ) || contactMap[loan.contactId || loan.contact_id];
                      const rawPaidPeriods =
                        loan.paidPeriods || (loan as any).paid_periods || [];
                      const paidStr = Array.isArray(rawPaidPeriods)
                        ? rawPaidPeriods.map(String)
                        : [];
                      const totalPaidPrincipal =
                        loan.status === "PAID"
                          ? loan.principalAmount ||
                            (loan as any).principal_amount ||
                            (loan as any).amount ||
                            0
                          : (
                              loan.amortizationSchedule ||
                              (loan as any).amortization_schedule ||
                              []
                            )
                              .filter(
                                (e: any) =>
                                  paidStr.includes(String(e.period)) ||
                                  e.status === "PAID",
                              )
                              .reduce(
                                (s: number, e: any) => s + (e.principal || 0),
                                0,
                              );
                      const outstanding = Math.max(
                        0,
                        (loan.principalAmount ||
                          (loan as any).principal_amount ||
                          (loan as any).amount ||
                          0) - totalPaidPrincipal,
                      );

                      return (
                        <tr
                          key={loan.id}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                          onClick={() => {
                            setSelectedLoanId(loan.id);
                            setView("detail");
                          }}
                        >
                          {columns.find((c) => c.id === "number")?.visible && (
                            <td className="px-6 py-4">
                              <span className="text-xs font-bold text-[#0070d2] hover:underline">
                                {loan.number}
                              </span>
                            </td>
                          )}
                          {columns.find((c) => c.id === "description")
                            ?.visible && (
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-800">
                                  {loan.name}
                                </span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-tight">
                                  {loan.type === "RECEIVED"
                                    ? "Loan Payable"
                                    : "Loan Receivable"}
                                </span>
                              </div>
                            </td>
                          )}
                          {columns.find((c) => c.id === "partner")?.visible && (
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                  {String(contact?.name || "").charAt(0) || "?"}
                                </div>
                                <span className="text-sm text-slate-600">
                                  {contact?.name || "N/A"}
                                </span>
                              </div>
                            </td>
                          )}
                          {columns.find((c) => c.id === "principal")
                            ?.visible && (
                            <td className="px-6 py-4 font-mono text-sm font-bold text-slate-700">
                              {currentCompany.currency}{" "}
                              {formatNumber(
                                (loan as any).principalAmount ||
                                  (loan as any).principal_amount ||
                                  loan.amount ||
                                  0
                              )}
                            </td>
                          )}
                          {columns.find((c) => c.id === "outstanding")
                            ?.visible && (
                            <td className="px-6 py-4 font-mono text-sm font-bold text-indigo-600">
                              {currentCompany.currency}{" "}
                              {formatNumber(outstanding)}
                            </td>
                          )}
                          {columns.find((c) => c.id === "rate")?.visible && (
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600">
                                {loan.interestRate}%
                              </span>
                            </td>
                          )}
                          {columns.find((c) => c.id === "status")?.visible && (
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded text-[10px] font-bold border ${getStatusColor(loan.status)}`}
                              >
                                {loan.status}
                              </span>
                            </td>
                          )}
                          <td
                            className="px-6 py-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex justify-end items-center space-x-1 opacity-100 transition-opacity transition-opacity">
                              {loan.status !== "DELETED" ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedLoanId(loan.id);
                                      setView("detail");
                                    }}
                                    className="p-2 text-slate-400 hover:text-[#0070d2] hover:bg-[#0070d2]/5 rounded-lg transition-all"
                                  >
                                    <ChevronRight size={18} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteLoan(loan.id);
                                    }}
                                    className={`p-2 rounded-lg transition-all ${deleteConfirmId === loan.id ? "text-rose-600 bg-rose-100" : "text-slate-400 hover:text-rose-500 hover:bg-rose-500/5"}`}
                                    title={
                                      deleteConfirmId === loan.id
                                        ? "Click again to confirm delete"
                                        : "Delete"
                                    }
                                  >
                                    {deleteConfirmId === loan.id ? (
                                      <span className="text-[10px] font-bold px-1">
                                        CONFIRM
                                      </span>
                                    ) : (
                                      <Trash2 size={16} />
                                    )}
                                  </button>
                                </>
                              ) : (
                                currentUser?.roleId === "role-admin" && (
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        restoreRecord("loan", loan.id);
                                      }}
                                      className="px-2 py-1 text-[9px] font-black uppercase text-[#0070d2] bg-[#0070d2]/5 border border-[#0070d2]/20 rounded transition-all hover:bg-[#0070d2]/10"
                                    >
                                      Restore
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (
                                          confirm(
                                            "Permanently delete this loan?",
                                          )
                                        )
                                          permanentDeleteRecord(
                                            "loan",
                                            loan.id,
                                          );
                                      }}
                                      className="px-2 py-1 text-[9px] font-black uppercase text-rose-600 bg-rose-50 border border-rose-100 rounded transition-all hover:bg-rose-100"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredLoans.length}
                  itemsPerPage={pageSize}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setPageSize}
                />
                {filteredLoans.length === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                      <Search size={24} className="opacity-20" />
                    </div>
                    <p className="text-sm font-medium">
                      No contracts found matching your criteria.
                    </p>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="mt-2 text-[#0070d2] text-xs font-bold hover:underline"
                    >
                      Clear search query
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Object Page Header */}
            <div className="bg-white border-b border-slate-200 shadow-sm z-20 sticky top-0">
              <div className="px-6 py-2 flex items-center justify-between border-b border-slate-50">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setView("list")}
                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="h-6 w-px bg-slate-200 mx-1"></div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {selectedLoan?.number}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${getStatusColor(selectedLoan?.status || "")}`}
                      >
                        {selectedLoan?.status}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-800 leading-tight">
                      {selectedLoan?.name}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="hidden lg:flex items-center space-x-6 border-r border-slate-100 pr-6 mr-2">
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                        Principal
                      </p>
                      <p className="text-xs font-bold text-slate-800 font-mono">
                        {currentCompany.currency}{" "}
                        {formatNumber(selectedLoan?.principalAmount || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                        Rate
                      </p>
                      <p className="text-xs font-bold text-slate-800 font-mono">
                        {selectedLoan?.interestRate}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {(selectedLoan?.status === "DRAFT" ||
                      selectedLoan?.status === "ACTIVE") && (
                      <>
                        {selectedLoan?.status === "DRAFT" && (
                          <button
                            onClick={() => handlePostLoan(selectedLoan.id)}
                            className="bg-[#0070d2] text-white px-4 py-1 rounded text-xs font-bold hover:bg-[#005fb2] transition-all shadow-sm active:scale-95"
                          >
                            Post
                          </button>
                        )}
                        {selectedLoan?.status === "ACTIVE" && (
                          <button
                            onClick={() => {
                              if (
                                selectedLoan.status !== "POSTED" &&
                                selectedLoan.status !== "ACTIVE"
                              ) {
                                alert(
                                  "Loan must be posted before making payments.",
                                );
                                return;
                              }
                              const period =
                                (Array.isArray(selectedLoan.paidPeriods)
                                  ? selectedLoan.paidPeriods
                                  : selectedLoan.paid_periods || []
                                ).length + 1;
                              setPaymentData({
                                period: period,
                                date: getOpDateBST(),
                                principal: 0,
                                interest: 0,
                              });
                              setShowPaymentModal(true);
                            }}
                            className="bg-emerald-600 text-white px-4 py-1 rounded text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm active:scale-95"
                          >
                            {selectedLoan.type === "RECEIVED"
                              ? "Make Payment"
                              : "Receive Payment"}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setFormData({
                              number: selectedLoan.number,
                              name: selectedLoan.name,
                              type: selectedLoan.type,
                              principalAmount: selectedLoan.principalAmount,
                              interestRate: selectedLoan.interestRate,
                              termMonths: selectedLoan.termMonths,
                              startDate: selectedLoan.startDate,
                              interestType: selectedLoan.interestType,
                              contactId:
                                selectedLoan.contactId ||
                                (selectedLoan as any).contact_id ||
                                "",
                              notes: selectedLoan.notes || "",
                            });
                            setIsEditing(true);
                            setShowModal(true);
                          }}
                          className="px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200 rounded hover:bg-slate-50 transition-all"
                        >
                          Edit
                        </button>
                      </>
                    )}
                    {(selectedLoan?.journalEntryId || (selectedLoan as any)?.journal_entry_id) && onNavigate && (
                      <button
                        onClick={() =>
                          onNavigate("journal", {
                            reference: selectedLoan.journalEntryId || (selectedLoan as any).journal_entry_id,
                          })
                        }
                        className="px-3 py-1 flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-all shadow-sm active:scale-95"
                      >
                        <ExternalLink size={14} className="mr-1" />
                        View Journal
                      </button>
                    )}
                    <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors border border-slate-200">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs - Compact */}
              <div className="px-6 flex items-center space-x-6">
                <button
                  onClick={() => setActiveTab("schedule")}
                  className={`py-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === "schedule" ? "border-[#0070d2] text-[#0070d2]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                >
                  Schedule
                </button>
                <button
                  onClick={() => setActiveTab("ledger")}
                  className={`py-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === "ledger" ? "border-[#0070d2] text-[#0070d2]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                >
                  Ledger
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`py-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === "notes" ? "border-[#0070d2] text-[#0070d2]" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                >
                  Notes
                </button>
              </div>
            </div>

            {/* Object Page Content */}
            <div className="flex-1 overflow-auto p-6 bg-[#f5f6f7]">
              <div className="max-w-6xl mx-auto space-y-6">
                {activeTab === "schedule" && (
                  <div className="space-y-6">
                    {/* Schedule Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Paid Principal
                            </p>
                            <p className="text-xl font-bold text-slate-800">
                              {currentCompany.currency}{" "}
                              {(() => {
                                if (selectedLoan?.status === "PAID")
                                  return formatNumber(
                                    selectedLoan?.principalAmount ||
                                      selectedLoan?.amount ||
                                      0,
                                  );
                                const lastPrincipalRow = [...loanLedgerRows].filter(r => !r.isInterest).pop();
                                const accurateRemainingBalance = lastPrincipalRow ? lastPrincipalRow.balance : (selectedLoan?.amount || 0);
                                const totalPaid = (selectedLoan?.amount || 0) - accurateRemainingBalance;
                                return formatNumber(Math.max(0, totalPaid));
                              })()}
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-1000"
                            style={{
                              width:
                                selectedLoan?.status === "PAID"
                                  ? "100%"
                                  : `${Math.min(100, ((Array.isArray(selectedLoan?.paidPeriods || (selectedLoan as any)?.paid_periods) ? (selectedLoan?.paidPeriods || (selectedLoan as any)?.paid_periods).length : 0) / (selectedLoan?.termMonths || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                          {(() => {
                            if (selectedLoan?.status === "PAID")
                              return formatNumber(
                                selectedLoan?.principalAmount ||
                                  selectedLoan?.amount ||
                                  0,
                              );
                            const rawPaid =
                              (selectedLoan as any)?.paid_periods ||
                              selectedLoan?.paidPeriods ||
                              [];
                            const paidStr = Array.isArray(rawPaid)
                              ? rawPaid.map(String)
                              : [];
                            const totalPeriods = selectedLoan?.termMonths || 1;
                            return `${paidStr.length} of ${totalPeriods} installments completed`;
                          })()}
                        </p>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                            <Clock size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Remaining Balance
                            </p>
                            <p className="text-xl font-bold text-slate-800">
                              {currentCompany.currency}{" "}
                              {(() => {
                                if (selectedLoan?.status === "PAID") return "0.00";
                                const lastPrincipalRow = [...loanLedgerRows].filter(r => !r.isInterest).pop();
                                const accurateRemainingBalance = lastPrincipalRow ? lastPrincipalRow.balance : (selectedLoan?.amount || 0);
                                return formatNumber(Math.max(0, accurateRemainingBalance));
                              })()}
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-500 h-full transition-all duration-1000"
                            style={{
                              width:
                                selectedLoan?.status === "PAID"
                                  ? "0%"
                                  : `${Math.max(0, (1 - (Array.isArray(selectedLoan?.paidPeriods || (selectedLoan as any)?.paid_periods) ? (selectedLoan?.paidPeriods || (selectedLoan as any)?.paid_periods).length : 0) / (selectedLoan?.termMonths || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">
                          Principal outstanding as of today
                        </p>
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <TrendingUp size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Total Interest Cost
                            </p>
                            <p className="text-xl font-bold text-slate-800">
                              {currentCompany.currency}{" "}
                              {formatNumber(
                                selectedLoan?.amortizationSchedule.reduce(
                                  (sum: number, e: any) => sum + e.interest,
                                  0,
                                ) || 0,
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {selectedLoan?.interestType} METHOD
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center">
                          <Calendar size={16} className="mr-2 text-slate-400" />
                          Installment Timeline
                        </h4>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 mr-4">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">
                              Paid
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 mr-4">
                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">
                              Overdue
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">
                              Due
                            </span>
                          </div>
                        </div>
                      </div>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Period
                            </th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              Due Date
                            </th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                              Principal
                            </th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                              Interest
                            </th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                              Total Payment
                            </th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                              Balance
                            </th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                              Status
                            </th>
                            <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {(() => {
                            let runningBalance =
                              selectedLoan?.principal_amount || 
                              selectedLoan?.principalAmount ||
                              selectedLoan?.amount ||
                              0;
                              
                            return (
                              <>
                              {dynamicSchedule.map((entry: any) => {
                              const isPaid =
                                (
                                  selectedLoan?.paidPeriods ||
                                  selectedLoan?.paid_periods ||
                                  []
                                )
                                  .map(String)
                                  .includes(String(entry.period)) ||
                                entry.status === "PAID" ||
                                selectedLoan?.status === "PAID";
                                
                              let displayPrincipal = entry.principal || 0;
                              let displayInterest = entry.interest || 0;
                              let isPartiallyPaid = false;
                              
                              if (isPaid) {
                                  const matchingRows = loanLedgerRows.filter(r => 
                                      String(r.journalId).endsWith(`-${entry.period}`) || 
                                      String(r.reference).includes(`PAY-${entry.period}`) ||
                                      String(r.description).includes(`Period ${entry.period}:`)
                                  );
                                  
                                  let foundPrincipal = 0;
                                  let foundInterest = 0;
                                  matchingRows.forEach(r => {
                                      const amount = selectedLoan?.type === 'RECEIVED' ? r.debit : r.credit;
                                      if (amount > 0) {
                                          if (r.isInterest) foundInterest += amount;
                                          else foundPrincipal += amount;
                                      }
                                  });
                                  if (matchingRows.length > 0) {
                                      displayPrincipal = foundPrincipal;
                                      displayInterest = foundInterest;
                                  }
                              }
                              
                              const isPaidRow = isPaid ? displayPrincipal >= (entry.principal || 0) : false;
                              runningBalance -= displayPrincipal;

                              const isInterestPaid = entry.interestPaid || isPaid || (isPaid ? displayInterest >= (entry.interest || 0) : false);
                              const isPrincipalPaid = entry.principalPaid || isPaid || isPaidRow;

                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const entryDate = new Date(entry.dynamicDate);
                              entryDate.setHours(0, 0, 0, 0);

                              const isOverdue =
                                !isPaid &&
                                !isPrincipalPaid &&
                                entryDate < today &&
                                selectedLoan.status === "ACTIVE";
                              const isDue =
                                !isPaid &&
                                !isPrincipalPaid &&
                                !isOverdue &&
                                entryDate.getMonth() === today.getMonth() &&
                                entryDate.getFullYear() === today.getFullYear();

                              return (
                                <tr
                                  key={entry.period}
                                  className={`hover:bg-slate-50/50 transition-colors ${isOverdue ? "bg-rose-50/30" : isDue ? "bg-amber-50/30" : ""} ${entry.isEdited ? "bg-indigo-50/50" : entry.recalculated ? "bg-blue-50/30 animate-pulse" : ""}`}
                                >
                                  <td className="px-6 py-3 text-xs font-mono text-slate-400">
                                    {(entry.period || 0)
                                      .toString()
                                      .padStart(2, "0")}
                                  </td>
                                  <td className="px-6 py-3">
                                    {editingCell?.period === entry.period &&
                                    editingCell?.field === "date" ? (
                                      <input
                                        autoFocus
                                        type="date"
                                        value={editValue}
                                        onChange={(e) =>
                                          setEditValue(e.target.value)
                                        }
                                        onBlur={() =>
                                          handleSaveCell(selectedLoan.id)
                                        }
                                        onKeyDown={(e) =>
                                          handleKeyDown(e, selectedLoan.id)
                                        }
                                        className="w-24 text-xs font-bold text-slate-800 bg-white border border-indigo-500 rounded px-1 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                      />
                                    ) : (
                                      <span
                                        className={`text-xs font-bold ${isOverdue ? "text-rose-600" : "text-slate-600"} cursor-pointer hover:text-indigo-600`}
                                        onClick={() =>
                                          handleEditCell(
                                            entry.period,
                                            "date",
                                            entry.dynamicDate,
                                          )
                                        }
                                      >
                                        {entry.dynamicDate}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-3 text-right font-mono text-xs">
                                    {editingCell?.period === entry.period &&
                                    editingCell?.field === "principal" ? (
                                      <input
                                        autoFocus
                                        className="w-24 px-2 py-1 text-right border border-indigo-300 rounded outline-none focus:ring-1 focus:ring-indigo-500"
                                        value={editValue || ""}
                                        onChange={(e) =>
                                          setEditValue(e.target.value)
                                        }
                                        onBlur={() =>
                                          handleSaveCell(selectedLoan.id)
                                        }
                                        onKeyDown={(e) =>
                                          handleKeyDown(e, selectedLoan.id)
                                        }
                                      />
                                    ) : (
                                      <span
                                        className={`${isPrincipalPaid ? "text-emerald-600 line-through opacity-50" : "text-slate-700"} cursor-pointer hover:text-indigo-600`}
                                        onClick={() =>
                                          !isPrincipalPaid &&
                                          handleEditCell(
                                            entry.period,
                                            "principal",
                                            displayPrincipal,
                                          )
                                        }
                                      >
                                        {formatNumber(displayPrincipal)}
                                        {entry.isEdited &&
                                          editingCell?.period !==
                                            entry.period && (
                                            <span className="ml-1 text-[8px] text-indigo-500 font-bold uppercase">
                                              Edited
                                            </span>
                                          )}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-3 text-right font-mono text-xs">
                                    {editingCell?.period === entry.period &&
                                    editingCell?.field === "interest" ? (
                                      <input
                                        autoFocus
                                        className="w-24 px-2 py-1 text-right border border-indigo-300 rounded outline-none focus:ring-1 focus:ring-indigo-500"
                                        value={editValue || ""}
                                        onChange={(e) =>
                                          setEditValue(e.target.value)
                                        }
                                        onBlur={() =>
                                          handleSaveCell(selectedLoan.id)
                                        }
                                        onKeyDown={(e) =>
                                          handleKeyDown(e, selectedLoan.id)
                                        }
                                      />
                                    ) : (
                                      <span
                                        className={`${isInterestPaid ? "text-emerald-600 line-through opacity-50" : "text-rose-500"} cursor-pointer hover:text-indigo-600`}
                                        onClick={() =>
                                          !isInterestPaid &&
                                          handleEditCell(
                                            entry.period,
                                            "interest",
                                            displayInterest,
                                          )
                                        }
                                      >
                                        {formatNumber(displayInterest)}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-3 text-right font-mono text-xs font-bold text-slate-800">
                                    {formatNumber(
                                      displayPrincipal + displayInterest,
                                    )}
                                  </td>
                                  <td className="px-6 py-3 text-right font-mono text-xs text-slate-600 font-bold bg-slate-50/50">
                                    {formatNumber(Math.max(0, runningBalance))}
                                  </td>
                                  <td className="px-6 py-3 text-center">
                                    {isPaid ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-100 text-emerald-600">
                                        <Check size={8} className="mr-1" /> Paid
                                      </span>
                                    ) : isOverdue ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase bg-rose-100 text-rose-600">
                                        <AlertCircle
                                          size={8}
                                          className="mr-1"
                                        />{" "}
                                        Overdue
                                      </span>
                                    ) : isDue ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-100 text-amber-600">
                                        <Clock size={8} className="mr-1" /> Due
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase bg-slate-100 text-slate-400">
                                        Pending
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-3 text-right">
                                    {!isPaid && (
                                        <div className="flex justify-end space-x-1">
                                          {!isInterestPaid && (
                                            <button
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                if (selectedLoan.status !== "ACTIVE" && selectedLoan.status !== "POSTED") {
                                                  alert("Please post this loan first by clicking the 'Post' button at the top of the screen before making payments.");
                                                  return;
                                                }
                                                handleRecordInterestOnly(
                                                  selectedLoan.id,
                                                  entry.period,
                                                  entry.dynamicDate,
                                                );
                                              }}
                                              className="px-2 py-1 text-[8px] font-black uppercase text-[#0070d2] hover:bg-[#0070d2]/5 rounded transition-all"
                                              title="Pay Interest Only"
                                            >
                                              Int. Only
                                            </button>
                                          )}
                                          {!isPrincipalPaid && (
                                            <button
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                if (selectedLoan.status !== "ACTIVE" && selectedLoan.status !== "POSTED") {
                                                  alert("Please post this loan first by clicking the 'Post' button at the top of the screen before making payments.");
                                                  return;
                                                }
                                                handleRecordPayment(
                                                  selectedLoan.id,
                                                  entry.period,
                                                  entry.dynamicDate,
                                                );
                                              }}
                                              className={`px-3 py-1 text-white text-[8px] font-black uppercase rounded transition-all shadow-sm ${selectedLoan.status === "ACTIVE" || selectedLoan.status === "POSTED" ? "bg-[#0070d2] hover:bg-[#005fb2]" : "bg-slate-300 hover:bg-slate-400"}`}
                                            >
                                              {isInterestPaid
                                                ? "Principal"
                                                : "Full Pay"}
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    {isPaid &&
                                      onNavigate && (
                                        <div className="flex justify-end">
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              onNavigate("journal", {
                                                reference: `JE-LPAY-${selectedLoan.id}-${entry.period}`,
                                              });
                                            }}
                                            className="px-2 py-1 flex items-center text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-all shadow-sm active:scale-95"
                                            title="View Journal"
                                          >
                                            <ExternalLink
                                              size={10}
                                              className="mr-1"
                                            />
                                            View Journal
                                          </button>
                                        </div>
                                      )}
                                  </td>
                                </tr>
                              );
                            })}
                            </>
                          );
                        })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "ledger" && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
                    <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-50/50 gap-4">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center">
                        <History size={16} className="mr-2 text-slate-400" />
                        Loan Statement & Ledger
                      </h4>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <label className="text-[10px] uppercase font-bold text-slate-500">
                            From
                          </label>
                          <input
                            type="date"
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none"
                            value={ledgerDateFrom}
                            onChange={(e) => setLedgerDateFrom(e.target.value)}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-[10px] uppercase font-bold text-slate-500">
                            To
                          </label>
                          <input
                            type="date"
                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none"
                            value={ledgerDateTo}
                            onChange={(e) => setLedgerDateTo(e.target.value)}
                          />
                        </div>
                        <ExportButtons
                          onExport={(format) => handleLedgerExport(format)}
                        />
                      </div>
                    </div>
                    <div className="px-6 py-2 bg-white border-b border-slate-100 flex items-center space-x-2">
                        <button
                          onClick={() => setLedgerViewType("ALL")}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${ledgerViewType === "ALL" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                        >
                          All Entries
                        </button>
                        <button
                          onClick={() => setLedgerViewType("PRINCIPAL")}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${ledgerViewType === "PRINCIPAL" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                        >
                          Principal Only
                        </button>
                        <button
                          onClick={() => setLedgerViewType("INTEREST")}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${ledgerViewType === "INTEREST" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                        >
                          Interest Only
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto">
                      {isLedgerLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                          <div className="w-6 h-6 border-2 border-t-2 border-[#0070d2] rounded-full animate-spin mb-2"></div>
                          <p className="text-xs italic">
                            Loading ledger transactions...
                          </p>
                        </div>
                      ) : filteredLoanLedgerRows.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                          <History size={32} className="opacity-10 mb-2" />
                          <p className="text-xs italic">
                            No ledger postings found for this contract.
                          </p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                            <tr>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50">
                                Date
                              </th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50">
                                Description
                              </th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50">
                                Reference
                              </th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right bg-slate-50">
                                Debit
                              </th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right bg-slate-50">
                                Credit
                              </th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right bg-slate-50">
                                Balance
                              </th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center bg-slate-50">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredLoanLedgerRows.map((row: any) => (
                              <tr
                                key={row.id}
                                className="hover:bg-slate-50/50 transition-colors"
                              >
                                <td className="px-6 py-3 text-xs font-bold text-slate-600 truncate max-w-[100px]">
                                  {row.date}
                                </td>
                                <td className="px-6 py-3 text-sm text-slate-800">
                                  <div className="flex items-center gap-2">
                                    {row.description}
                                    {row.isInterest && (
                                      <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 rounded">
                                        Interest
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">
                                  {row.reference}
                                </td>
                                <td className="px-6 py-3 text-sm font-mono text-right text-slate-600">
                                  {row.debit > 0
                                    ? formatNumber(row.debit)
                                    : "-"}
                                </td>
                                <td className="px-6 py-3 text-sm font-mono text-right text-slate-600">
                                  {row.credit > 0
                                    ? formatNumber(row.credit)
                                    : "-"}
                                </td>
                                <td
                                  className={`px-6 py-3 text-sm font-mono text-right font-bold ${row.isInterest ? "text-slate-400 opacity-60" : row.balance < 0 ? "text-rose-600" : "text-slate-800"}`}
                                >
                                  {formatNumber(Math.abs(row.balance))}{" "}
                                  {row.balance < 0 ? "CR" : "DR"}
                                </td>
                                <td className="px-6 py-3 text-center">
                                  {row.journalId && onNavigate && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        onNavigate("journal", {
                                          reference: row.journalId,
                                        });
                                      }}
                                      className="px-2 py-1 inline-flex items-center text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-all shadow-sm active:scale-95"
                                      title="View Journal"
                                    >
                                      <ExternalLink
                                        size={10}
                                        className="mr-1"
                                      />
                                      View Journal
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                          <Info size={16} className="mr-2 text-slate-400" />
                          Contract Notes
                        </h4>
                        <textarea
                          className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#0070d2]/20 focus:border-[#0070d2] transition-all resize-none"
                          placeholder="Add internal notes, terms, or conditions for this contract..."
                          value={selectedLoan?.notes || ""}
                          readOnly
                        />
                        <div className="mt-4 flex justify-end">
                          <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all">
                            Save Notes
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                          <Share2 size={16} className="mr-2 text-slate-400" />
                          Attachments
                        </h4>
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-[#0070d2] transition-all group cursor-pointer">
                          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#0070d2]/5 group-hover:text-[#0070d2] transition-all mb-3">
                            <Plus size={24} />
                          </div>
                          <p className="text-xs font-bold text-slate-600">
                            Upload Documents
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">
                            PDF, PNG, JPG up to 10MB
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Record Payment Modal */}

      {showPaymentModal && selectedLoan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Banknote size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {selectedLoan.type === "RECEIVED"
                      ? "Make Payment"
                      : "Receive Payment"}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Period {paymentData.period}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-all"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentData.date}
                  onChange={(e) =>
                    setPaymentData({
                      ...paymentData,
                      date: e.target.value,
                    })
                  }
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Principal Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    {currentCompany.currency}
                  </span>
                  <input
                    type="number"
                    value={paymentData.principal}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        principal: Number(e.target.value),
                      })
                    }
                    className="w-full h-11 pl-12 pr-4 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Interest Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    {currentCompany.currency}
                  </span>
                  <input
                    type="number"
                    value={paymentData.interest}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        interest: Number(e.target.value),
                      })
                    }
                    className="w-full h-11 pl-12 pr-4 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <span className="text-sm font-bold text-slate-600">
                  Total Amount
                </span>
                <span className="text-lg font-black text-emerald-600">
                  {currentCompany.currency}{" "}
                  {formatNumber(paymentData.principal + paymentData.interest)}
                </span>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePayment}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm active:scale-95 flex items-center space-x-2"
              >
                <Banknote size={16} />
                <span>Confirm Payment</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Initialize Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
          >
            <div className="px-8 py-6 bg-[#354a5f] flex justify-between items-center text-white">
              <div>
                <h3 className="text-xl font-bold tracking-tight">
                  {formData.type === "RECEIVED"
                    ? "Initialize Received Loan (Borrowing)"
                    : "Initialize Given Loan (Lending)"}
                </h3>
                <p className="text-xs text-white/60 mt-1 uppercase tracking-widest font-bold">
                  Standard ERP Document Creation
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Contract Name
                    </label>
                    <div className="relative">
                      <FileText
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#0070d2]/20 focus:border-[#0070d2] transition-all"
                        placeholder="e.g. Q1 Expansion Loan"
                        value={formData.name || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        Type
                      </label>
                      <select
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#0070d2]/20 focus:border-[#0070d2] transition-all"
                        value={formData.type || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            type: e.target.value as LoanType,
                          })
                        }
                      >
                        <option value="RECEIVED">
                          Receive Loan (Borrow / Liability)
                        </option>
                        <option value="GIVEN">Give Loan (Lend / Asset)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        Interest Method
                      </label>
                      <select
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#0070d2]/20 focus:border-[#0070d2] transition-all"
                        value={formData.interestType || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            interestType: e.target.value as InterestType,
                          })
                        }
                      >
                        <option value="REDUCING">Reducing Balance</option>
                        <option value="FIXED">Flat Rate</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Lender (Contact)
                    </label>
                    <SearchableSelect
                      className="w-full"
                      placeholder="Select Lender..."
                      emptyMessage="No lenders found. Type to create new."
                      options={contactOptions}
                      value={formData.contactId || ""}
                      onSelect={(id) =>
                        setFormData({ ...formData, contactId: id })
                      }
                      onFocus={() =>
                        fetchContacts({
                          limit: 1000,
                          filters: { type: "LENDER" },
                        })
                      }
                      onSearchChange={searchContactsOnDemand}
                      quickCreateLabel="Lender"
                      onQuickCreate={async (name) => {
                        try {
                          const newId = generateUUID();
                          await addContact({
                            id: newId,
                            name,
                            type: "LENDER",
                            email: "",
                            phone: "",
                            companyIds:
                              activeCompanyIds?.length > 0
                                ? activeCompanyIds
                                : [currentCompany?.id].filter(Boolean),
                          });
                          setFormData({ ...formData, contactId: newId });
                          return newId;
                        } catch (err: any) {
                          toast.error(err?.message || "Failed to create lender");
                          throw err;
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Principal Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                        {currentCompany.currency}
                      </span>
                      <input
                        type="number"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-[#0070d2]/20 focus:border-[#0070d2] transition-all"
                        value={
                          isNaN(formData.principalAmount)
                            ? ""
                            : formData.principalAmount
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            principalAmount: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        APR (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-[#0070d2]/20 focus:border-[#0070d2] transition-all"
                        value={
                          isNaN(formData.interestRate)
                            ? ""
                            : formData.interestRate
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            interestRate: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        Term (Months)
                      </label>
                      <input
                        type="number"
                        required
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-[#0070d2]/20 focus:border-[#0070d2] transition-all"
                        value={
                          isNaN(formData.termMonths) ? "" : formData.termMonths
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            termMonths: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Start Date
                    </label>
                    <div className="relative">
                      <Calendar
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="date"
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-[#0070d2]/20 focus:border-[#0070d2] transition-all"
                        value={formData.startDate || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Monthly Payment Preview */}
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                        Est. Monthly Payment
                      </span>
                      <span className="text-lg font-black text-indigo-700">
                        {(() => {
                          const p = formData.principalAmount || 0;
                          const r = (formData.interestRate || 0) / 100 / 12;
                          const n = formData.termMonths || 1;
                          if (formData.interestType === "REDUCING") {
                            const payment =
                              r > 0
                                ? (p * r * Math.pow(1 + r, n)) /
                                  (Math.pow(1 + r, n) - 1)
                                : p / n;
                            return `${currentCompany.currency} ${formatNumber(payment)}`;
                          } else {
                            const totalInterest =
                              p * (formData.interestRate / 100) * (n / 12);
                            const payment = (p + totalInterest) / n;
                            return `${currentCompany.currency} ${formatNumber(payment)}`;
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0070d2] text-white px-10 py-2.5 rounded-lg text-sm font-bold hover:bg-[#005fb2] transition-all shadow-lg shadow-[#0070d2]/20 active:scale-95"
                >
                  Execute Contract
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
export default LoanManager;
