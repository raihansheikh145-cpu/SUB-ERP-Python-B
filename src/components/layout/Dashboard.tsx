import React, { useEffect, useState, useCallback } from 'react';
import { AccountType } from '../../types/index';
import { formatBDT } from '../../utils/constants';
import { reportingService } from '../../services/reportingService';
import { Activity, TrendingUp, TrendingDown, Wallet, LayoutDashboard, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subDays, subWeeks, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { useAccountingCoreStore } from "../../store/modules/useAccountingCoreStore";
import { useHRStore } from "../../store/modules/useHRStore";

// import { getFinancialAdvice } from '../gemini';







type DateRangeOption = 'allDates' | 'daily' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'last6Months' | 'thisYear';

const getDateRange = (range: DateRangeOption) => {
  const today = new Date();
  switch (range) {
    case 'daily':
      return { startDate: format(today, 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
    case 'yesterday': {
      const yesterday = subDays(today, 1);
      return { startDate: format(yesterday, 'yyyy-MM-dd'), endDate: format(yesterday, 'yyyy-MM-dd') };
    }
    case 'thisWeek':
      return { startDate: format(startOfWeek(today), 'yyyy-MM-dd'), endDate: format(endOfWeek(today), 'yyyy-MM-dd') };
    case 'lastWeek': {
      const lastWk = subWeeks(today, 1);
      return { startDate: format(startOfWeek(lastWk), 'yyyy-MM-dd'), endDate: format(endOfWeek(lastWk), 'yyyy-MM-dd') };
    }
    case 'thisMonth':
      return { startDate: format(startOfMonth(today), 'yyyy-MM-dd'), endDate: format(endOfMonth(today), 'yyyy-MM-dd') };
    case 'lastMonth': {
      const lastMo = subMonths(today, 1);
      return { startDate: format(startOfMonth(lastMo), 'yyyy-MM-dd'), endDate: format(endOfMonth(lastMo), 'yyyy-MM-dd') };
    }
    case 'last6Months': {
      const last6Mo = subMonths(today, 6);
      return { startDate: format(startOfMonth(last6Mo), 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
    }
    case 'thisYear':
      return { startDate: format(startOfYear(today), 'yyyy-MM-dd'), endDate: format(endOfYear(today), 'yyyy-MM-dd') };
    case 'allDates':
    default:
      return { startDate: '1900-01-01', endDate: format(today, 'yyyy-MM-dd') };
  }
};

const Dashboard: React.FC<{ store: any }> = ({  }) => {
    const { activeCompanyIds } = useAccountingCoreStore();
    const { allLoans: loans } = useHRStore();

const [advice, setAdvice] = useState<string>("Click 'Regenerate Analysis' to run AI auditor.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>('allDates');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const activeIds = activeCompanyIds?.length > 0 ? activeCompanyIds : [];
      const targetMode = activeIds.length === 1 ? activeIds[0] : 'CONSOLIDATED';
      
      const { startDate, endDate } = getDateRange(dateRange);
      
      const data = await reportingService.getDashboardSummary(
        targetMode, 
        { startDate, endDate }
      );
      setReportData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCompanyIds, dateRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const assets = reportData?.assets || 0;
  const liabilities = reportData?.liabilities || 0;
  const equity = reportData?.equity || 0;
  const revenue = reportData?.revenue || 0;
  const expenses = reportData?.expenses || 0;
  const netIncome = reportData?.netIncome || 0;
  const cashBalance = reportData?.cashBalance || 0;
  const todayCashIn = reportData?.cashInToday || 0;
  const todayCashOut = reportData?.cashOutToday || 0;

  const activeLoans = (loans || []).filter((l: any) => l.status === 'ACTIVE');
  const dueInstallments = activeLoans.flatMap((l: any) => {
    const rawPaid = l.paidPeriods || l.paid_periods || [];
    const paidStr = Array.isArray(rawPaid) ? rawPaid.map(String) : [];
    return (l.amortizationSchedule || [])
      .filter((e: any) => !paidStr.includes(String(e.period)) && e.status !== 'PAID' && new Date(e.date) <= new Date())
      .map((e: any) => ({ ...e, loanName: l.name, loanId: l.id }));
  });

  const handleFetchAdvice = useCallback(async () => {
    setIsAnalyzing(true);
    setAdvice("AI is analyzing your real-time ledger data...");
    const summary = `Assets: ${formatBDT(assets)}, Liabilities: ${formatBDT(liabilities)}, Net Income: ${formatBDT(netIncome)}`;
    try {
      const result = "AI Advice is disabled."; // AI feature removed
      setAdvice(result);
    } catch (err) {
      setAdvice("Failed to reach AI Auditor. Please check your connectivity.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [assets, liabilities, netIncome]);

  const stats = [
    { label: 'Total Assets', value: assets, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: LayoutDashboard },
    { label: 'Total Liabilities', value: liabilities, color: 'text-red-600', bg: 'bg-red-50', icon: Activity },
    { label: 'Cash Balance', value: cashBalance, color: 'text-cyan-600', bg: 'bg-cyan-50', icon: Wallet },
    { label: 'Net Income', value: netIncome, color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp },
  ];

  if (loading && !reportData) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Activity className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Dashboard Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Command Center</h2>
          <p className="text-slate-400 text-sm font-medium mt-1">Real-time financial intelligence.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <div className="pl-3 py-1 flex items-center text-slate-400 rounded-l-lg border-r border-slate-100 pr-2">
            <Calendar className="w-4 h-4 mr-2" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Date Range</span>
          </div>
          <select 
            value={dateRange || ""}
            onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 py-1.5 pl-2 pr-8 cursor-pointer rounded-r-lg"
          >
             <option value="allDates">All Dates</option>
             <option value="daily">Today</option>
             <option value="yesterday">Yesterday</option>
             <option value="thisWeek">This Week</option>
             <option value="lastWeek">Last Week</option>
             <option value="thisMonth">This Month</option>
             <option value="lastMonth">Last Month</option>
             <option value="last6Months">Last 6 Months</option>
             <option value="thisYear">This Year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-xl group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <h3 className={`text-2xl font-black tracking-tighter ${stat.color}`}>{formatBDT(stat.value)}</h3>
              <span className="text-[10px] font-bold text-slate-300 uppercase">BDT</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Treasury & Cash Flow</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Real-time monitoring of liquid assets and velocity.</p>
            </div>
            <button 
              onClick={fetchDashboardData}
              className="p-2 hover:bg-slate-50 rounded-full transition-colors"
              title="Refresh Data"
            >
              <Activity className={`w-5 h-5 text-slate-300 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Today's Performance</p>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                            <span className="text-xs font-bold text-slate-600 uppercase">Inflow</span>
                          </div>
                          <span className="text-sm font-black text-emerald-600">+{formatBDT(todayCashIn)}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                            <span className="text-xs font-bold text-slate-600 uppercase">Outflow</span>
                          </div>
                          <span className="text-sm font-black text-rose-600">-{formatBDT(todayCashOut)}</span>
                      </div>
                      <div className="pt-4 border-t border-slate-200/60 flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">Net Daily Velocity</span>
                          <span className={`text-xl font-black tabular-nums ${todayCashIn - todayCashOut >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatBDT(todayCashIn - todayCashOut)}
                          </span>
                      </div>
                    </div>
                  </div>
              </div>
              <div className="bg-indigo-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="w-10 h-10 bg-white/10 backdrop-blur-md flex items-center justify-center rounded-xl mb-6 text-white border border-white/10">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-2">Liquidity Position</p>
                      <h4 className="text-4xl font-black tracking-tighter">{formatBDT(cashBalance)}</h4>
                    </div>
                    <p className="text-[9px] font-medium text-indigo-300/60 mt-8 italic border-t border-white/5 pt-4">
                      Aggregated balance across all primary cash and bank repositories.
                    </p>
                  </div>
              </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Due Installments</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Loan repayments</p>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full uppercase border border-rose-100">
              {dueInstallments.length} Pending
            </span>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {dueInstallments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-40">
                <LayoutDashboard className="w-8 h-8 text-slate-300" />
                <p className="text-slate-400 italic text-xs font-bold uppercase">No Obligations Detected</p>
              </div>
            ) : (
              dueInstallments.map((inst: any, idx: number) => (
                <div key={`${inst.loanId}-${inst.period}`} className="group p-5 bg-slate-50/50 hover:bg-white hover:shadow-md rounded-2xl border border-slate-100 transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate max-w-[140px] group-hover:text-indigo-600 transition-colors">{inst.loanName}</p>
                    <p className="text-xs font-black text-rose-600">{formatBDT(inst.payment)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Period {inst.period} • {inst.date}</p>
                    <div className="p-1.5 bg-rose-50 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-all">
                      <TrendingDown className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-gradient-to-br from-[#1e1b4b] to-[#312e81] text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <LayoutDashboard className="w-64 h-64 rotate-12" />
          </div>
          
          <div className="max-w-4xl relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-indigo-400 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-white font-black text-xs">✨</span>
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">AI Financial intelligence</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              <div className="md:col-span-3">
                <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-10 border border-white/10 min-h-[160px] flex items-center">
                  <p className="text-lg font-medium leading-relaxed text-indigo-50 italic">
                    "{isAnalyzing ? "Our neural engine is recalculating your real-time ledger metrics..." : advice}"
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <button 
                  onClick={handleFetchAdvice}
                  disabled={isAnalyzing}
                  className="w-full py-6 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-3xl transition-all uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-900/50 active:scale-95 disabled:opacity-50"
                >
                  {isAnalyzing ? "Computing..." : "Run Analysis"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
