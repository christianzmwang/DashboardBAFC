'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { signOut } from 'next-auth/react';
import {
  filterDataByDateRange,
  getAvailableMonths,
  MonthlyRevenue,
  MonthlyMembership,
  filterMembershipDataByDateRange,
  MonthlyAmountBreakdown,
  filterAmountBreakdownByDateRange,
  MonthlyProgramBreakdown,
  filterProgramBreakdownByDateRange,
  MemberRow,
  MembershipFilters,
  PaymentRow,
  RevenueFilters,
  filterTransactionsByDateRange,
  filterTransactionsByFilters,
  RefundRow,
  filterRefundsByDateRange,
  filterRefundsByFilters,
} from '../lib/clientUtils';
import { RevenueChart } from '../components/RevenueChart';
import { LocationChart } from '../components/LocationChart';
import { MembershipChart } from '../components/MembershipChart';
import { MembershipMembersTable } from '../components/MembershipMembersTable';
import { LocationMembershipChart } from '../components/LocationMembershipChart';
import { DateRangeSelector } from '../components/DateRangeSelector';
import { RevenueAmountBreakdownChart, computeAmountLegendKeys, amountLegendPalette } from '../components/RevenueAmountBreakdownChart';
import { RevenueAmountPieChart } from '../components/RevenueAmountPieChart';
import { MembershipProgramBreakdownChart, programLegendPalette } from '../components/MembershipProgramBreakdownChart';
import { MembershipProgramPieChart } from '../components/MembershipProgramPieChart';
import { VerticalLegend } from '../components/VerticalLegend';
import { RevenueTransactionsTable } from '../components/RevenueTransactionsTable';
import { RefundTransactionsTable } from '../components/RefundTransactionsTable';

const COLLAPSIBLE_DEFAULTS = {
  revenueAmount: false,
  revenueLosGatosChart: false,
  revenueLosGatosComposition: false,
  revenuePleasantonChart: false,
  revenuePleasantonComposition: false,
  revenueLocationAmountPies: false,
  membershipProgram: false,
  membershipLosGatosChart: false,
  membershipLosGatosComposition: false,
  membershipPleasantonChart: false,
  membershipPleasantonComposition: false,
  membershipLocationProgramPies: false,
  // Refunds collapsibles
  refundLosGatosChart: false,
  refundLosGatosComposition: false,
  refundPleasantonChart: false,
  refundPleasantonComposition: false,
} as const;

type CollapsibleKey = keyof typeof COLLAPSIBLE_DEFAULTS;

interface LocationDataResponse {
  allData: MonthlyRevenue[];
  losGatosData: MonthlyRevenue[];
  pleasantonData: MonthlyRevenue[];
}

interface MembershipDataResponse {
  allData: MonthlyMembership[];
  losGatosData: MonthlyMembership[];
  pleasantonData: MonthlyMembership[];
}

interface LocationDataResponse {
  allData: MonthlyRevenue[];
  losGatosData: MonthlyRevenue[];
  pleasantonData: MonthlyRevenue[];
}

const TRANSACTIONS_PAGE_SIZE = 1000;

export default function Page() {
  const [allData, setAllData] = useState<MonthlyRevenue[]>([]);
  const [losGatosData, setLosGatosData] = useState<MonthlyRevenue[]>([]);
  const [pleasantonData, setPleasantonData] = useState<MonthlyRevenue[]>([]);
  const [filteredAllData, setFilteredAllData] = useState<MonthlyRevenue[]>([]);
  const [filteredLosGatosData, setFilteredLosGatosData] = useState<MonthlyRevenue[]>([]);
  const [filteredPleasantonData, setFilteredPleasantonData] = useState<MonthlyRevenue[]>([]);

  // Membership data states
  const [allMembershipData, setAllMembershipData] = useState<MonthlyMembership[]>([]);
  const [losGatosMembershipData, setLosGatosMembershipData] = useState<MonthlyMembership[]>([]);
  const [pleasantonMembershipData, setPleasantonMembershipData] = useState<MonthlyMembership[]>([]);
  const [filteredAllMembershipData, setFilteredAllMembershipData] = useState<MonthlyMembership[]>([]);
  const [filteredLosGatosMembershipData, setFilteredLosGatosMembershipData] = useState<MonthlyMembership[]>([]);
  const [filteredPleasantonMembershipData, setFilteredPleasantonMembershipData] = useState<MonthlyMembership[]>([]);

  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [startMonth, setStartMonth] = useState<string>('');
  const [endMonth, setEndMonth] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Amount breakdown state
  const [amountBreakdown, setAmountBreakdown] = useState<MonthlyAmountBreakdown[]>([]);
  const [filteredAmountBreakdown, setFilteredAmountBreakdown] = useState<MonthlyAmountBreakdown[]>([]);
  const [lgAmountBreakdown, setLgAmountBreakdown] = useState<MonthlyAmountBreakdown[]>([]);
  const [plAmountBreakdown, setPlAmountBreakdown] = useState<MonthlyAmountBreakdown[]>([]);
  const [filteredLgAmountBreakdown, setFilteredLgAmountBreakdown] = useState<MonthlyAmountBreakdown[]>([]);
  const [filteredPlAmountBreakdown, setFilteredPlAmountBreakdown] = useState<MonthlyAmountBreakdown[]>([]);
  // Refund amount breakdowns (reuse same chart components/palette)
  const [refundAmountBreakdown, setRefundAmountBreakdown] = useState<MonthlyAmountBreakdown[]>([]);
  const [filteredRefundAmountBreakdown, setFilteredRefundAmountBreakdown] = useState<MonthlyAmountBreakdown[]>([]);
  const [refundLgAmountBreakdown, setRefundLgAmountBreakdown] = useState<MonthlyAmountBreakdown[]>([]);
  const [refundPlAmountBreakdown, setRefundPlAmountBreakdown] = useState<MonthlyAmountBreakdown[]>([]);
  const [filteredRefundLgAmountBreakdown, setFilteredRefundLgAmountBreakdown] = useState<MonthlyAmountBreakdown[]>([]);
  const [filteredRefundPlAmountBreakdown, setFilteredRefundPlAmountBreakdown] = useState<MonthlyAmountBreakdown[]>([]);

  // Refund monthly aggregates for overall and by location
  const [refundAllData, setRefundAllData] = useState<MonthlyRevenue[]>([]);
  const [refundLGData, setRefundLGData] = useState<MonthlyRevenue[]>([]);
  const [refundPLData, setRefundPLData] = useState<MonthlyRevenue[]>([]);
  const [filteredRefundAllData, setFilteredRefundAllData] = useState<MonthlyRevenue[]>([]);
  const [filteredRefundLGData, setFilteredRefundLGData] = useState<MonthlyRevenue[]>([]);
  const [filteredRefundPLData, setFilteredRefundPLData] = useState<MonthlyRevenue[]>([]);
  // Month selection for new pie charts (Los Gatos & Pleasanton)
  // Month selection for membership pies (Los Gatos & Pleasanton)
  const [programPieMonth, setProgramPieMonth] = useState<string>('');
  const [amountPieMonth, setAmountPieMonth] = useState<string>('');
  // Whether to show revenue after subtracting refunds
  const [afterRefunds, setAfterRefunds] = useState<boolean>(false);
  // Membership program breakdown state
  const [programBreakdownAll, setProgramBreakdownAll] = useState<MonthlyProgramBreakdown[]>([]);
  const [programBreakdownLG, setProgramBreakdownLG] = useState<MonthlyProgramBreakdown[]>([]);
  const [programBreakdownPL, setProgramBreakdownPL] = useState<MonthlyProgramBreakdown[]>([]);
  const [filteredProgramBreakdownAll, setFilteredProgramBreakdownAll] = useState<MonthlyProgramBreakdown[]>([]);
  const [filteredProgramBreakdownLG, setFilteredProgramBreakdownLG] = useState<MonthlyProgramBreakdown[]>([]);
  const [filteredProgramBreakdownPL, setFilteredProgramBreakdownPL] = useState<MonthlyProgramBreakdown[]>([]);

  // Toggle between revenue, refunds and membership view
  const [viewMode, setViewMode] = useState<'revenue' | 'refunds' | 'membership'>('revenue');
  // Toggle within membership view between monthly table and raw members list
  // Secondary toggle inside membership view: show aggregated monthly table or raw members list
  const [membershipDetailMode, setMembershipDetailMode] = useState<'monthly' | 'members'>('monthly');
  // Raw members (returned without planId via new API route) for drill-down display
  const [rawMembers, setRawMembers] = useState<MemberRow[]>([]);
  // Drill-down filters applied across membership visuals
  const [membershipFilters, setMembershipFilters] = useState<MembershipFilters>({});
  const hasMembershipFilters = Boolean(membershipFilters.month || membershipFilters.program || membershipFilters.location);

  // Revenue transactions and filters
  const [transactions, setTransactions] = useState<PaymentRow[]>([]);
  const [visibleTransactionsCount, setVisibleTransactionsCount] = useState<number>(TRANSACTIONS_PAGE_SIZE);
  const [revenueFilters, setRevenueFilters] = useState<RevenueFilters>({});
  const hasRevenueFilters = Boolean(revenueFilters.month || revenueFilters.location || revenueFilters.amountKey);
  const [revenueDetailMode, setRevenueDetailMode] = useState<'summary' | 'transactions'>('summary');

  // Refunds
  const [refunds, setRefunds] = useState<RefundRow[]>([]);
  const [refundFilters, setRefundFilters] = useState<RevenueFilters>({});
  const hasRefundFilters = Boolean(refundFilters.month || refundFilters.location || refundFilters.amountKey);
  const [refundDetailMode, setRefundDetailMode] = useState<'summary' | 'transactions'>('summary');

  // Toggle between membership data files
  const [membershipFile, setMembershipFile] = useState<'memberships_all.csv' | 'memberships_first.csv'>('memberships_all.csv');

  const [collapsedSections, setCollapsedSections] = useState<Record<CollapsibleKey, boolean>>(
    () => ({ ...COLLAPSIBLE_DEFAULTS })
  );

  const toggleSection = (key: CollapsibleKey) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Simple theme toggle using documentElement class and localStorage
  const toggleTheme = () => {
    if (typeof document === 'undefined') return;
    const el = document.documentElement;
    const isDark = el.classList.contains('dark');
    if (isDark) {
      el.classList.remove('dark');
      try { localStorage.setItem('theme', 'light'); } catch {}
    } else {
      el.classList.add('dark');
      try { localStorage.setItem('theme', 'dark'); } catch {}
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const netParam = afterRefunds ? '?net=1' : '';
        // Fetch both revenue and membership data
        const [revenueResponse, membershipResponse, amountBreakdownResp, amountBreakdownByLocResp, programBreakdownResp, rawMembersResp, transactionsResp, refundAggResp, refundBreakdownResp, refundBreakdownByLocResp, refundTransResp] = await Promise.all([
          fetch(`/api/revenue-data${netParam}`),
          fetch(`/api/membership-data?file=${membershipFile}`),
          fetch(`/api/revenue-data/amount-breakdown${netParam}`),
          fetch(`/api/revenue-data/amount-breakdown-by-location${netParam}`),
          fetch(`/api/membership-program-breakdown?file=${membershipFile}`),
          fetch(`/api/membership-data/raw?file=${membershipFile}`),
          fetch(`/api/revenue-data/transactions${netParam}`),
          fetch('/api/refund-data'),
          fetch('/api/refund-data/amount-breakdown'),
          fetch('/api/refund-data/amount-breakdown-by-location'),
          fetch('/api/refund-data/transactions')
        ]);

        if (!revenueResponse.ok) {
          throw new Error(`Revenue API error! status: ${revenueResponse.status}`);
        }
        if (!membershipResponse.ok) {
          throw new Error(`Membership API error! status: ${membershipResponse.status}`);
        }
        if (!amountBreakdownResp.ok) {
          throw new Error(`Amount Breakdown API error! status: ${amountBreakdownResp.status}`);
        }
        if (!amountBreakdownByLocResp.ok) {
          throw new Error(`Amount Breakdown by Location API error! status: ${amountBreakdownByLocResp.status}`);
        }
        if (!programBreakdownResp.ok) {
          throw new Error(`Membership Program Breakdown API error! status: ${programBreakdownResp.status}`);
        }
        if (!rawMembersResp.ok) {
          throw new Error(`Raw Members API error! status: ${rawMembersResp.status}`);
        }
        if (!transactionsResp.ok) {
          throw new Error(`Transactions API error! status: ${transactionsResp.status}`);
        }
        if (!refundAggResp.ok) {
          throw new Error(`Refund aggregates API error! status: ${refundAggResp.status}`);
        }
        if (!refundBreakdownResp.ok) {
          throw new Error(`Refund amount breakdown API error! status: ${refundBreakdownResp.status}`);
        }
        if (!refundBreakdownByLocResp.ok) {
          throw new Error(`Refund amount breakdown by location API error! status: ${refundBreakdownByLocResp.status}`);
        }
        if (!refundTransResp.ok) {
          throw new Error(`Refund transactions API error! status: ${refundTransResp.status}`);
        }

    const revenueData: LocationDataResponse = await revenueResponse.json();
    const membershipData: MembershipDataResponse = await membershipResponse.json();
    const { breakdown } = await amountBreakdownResp.json();
    const amountByLoc = await amountBreakdownByLocResp.json();
  const programByData = await programBreakdownResp.json();
  const rawMembersJson = await rawMembersResp.json();
  const transactionsJson = await transactionsResp.json();
  const refundsAggJson = await refundAggResp.json();
  const refundBreakdownJson = await refundBreakdownResp.json();
  const refundBreakdownByLocJson = await refundBreakdownByLocResp.json();
  const refundTransJson = await refundTransResp.json();

        // Set revenue data
        setAllData(revenueData.allData);
        setLosGatosData(revenueData.losGatosData);
        setPleasantonData(revenueData.pleasantonData);

  // Set membership data
        setAllMembershipData(membershipData.allData);
        setLosGatosMembershipData(membershipData.losGatosData);
        setPleasantonMembershipData(membershipData.pleasantonData);
  // Set amount breakdown
  setAmountBreakdown(breakdown || []);
  setLgAmountBreakdown(amountByLoc?.losGatosData || []);
  setPlAmountBreakdown(amountByLoc?.pleasantonData || []);
  // Set membership program breakdown
  setProgramBreakdownAll(programByData?.allData || []);
  setProgramBreakdownLG(programByData?.losGatosData || []);
  setProgramBreakdownPL(programByData?.pleasantonData || []);
  setRawMembers(rawMembersJson?.members || []);
  setTransactions(transactionsJson?.transactions || []);
  // Refund aggregates
  setRefundAllData(refundsAggJson?.allData || []);
  setRefundLGData(refundsAggJson?.losGatosData || []);
  setRefundPLData(refundsAggJson?.pleasantonData || []);
  // Refund transactions
  setRefunds(refundTransJson?.refunds || []);
  setRefundAmountBreakdown(refundBreakdownJson?.breakdown || []);
  setRefundLgAmountBreakdown(refundBreakdownByLocJson?.losGatosData || []);
  setRefundPlAmountBreakdown(refundBreakdownByLocJson?.pleasantonData || []);

        // Set available months from revenue data only (previous behavior)
        const months = getAvailableMonths(revenueData.allData);
        setAvailableMonths(months);

        if (months.length > 0) {
          setStartMonth(months[0]);
          setEndMonth(months[months.length - 1]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, [membershipFile, afterRefunds]);

  useEffect(() => {
    if (!startMonth || !endMonth) return;

    if (allData.length > 0) {
      setFilteredAllData(filterDataByDateRange(allData, startMonth, endMonth));
      setFilteredLosGatosData(filterDataByDateRange(losGatosData, startMonth, endMonth));
      setFilteredPleasantonData(filterDataByDateRange(pleasantonData, startMonth, endMonth));
    }

    if (allMembershipData.length > 0) {
      setFilteredAllMembershipData(filterMembershipDataByDateRange(allMembershipData, startMonth, endMonth));
      setFilteredLosGatosMembershipData(filterMembershipDataByDateRange(losGatosMembershipData, startMonth, endMonth));
      setFilteredPleasantonMembershipData(filterMembershipDataByDateRange(pleasantonMembershipData, startMonth, endMonth));
    }

    if (amountBreakdown.length > 0) {
      setFilteredAmountBreakdown(filterAmountBreakdownByDateRange(amountBreakdown, startMonth, endMonth));
    }
    if (refundAmountBreakdown.length > 0) {
      setFilteredRefundAmountBreakdown(filterAmountBreakdownByDateRange(refundAmountBreakdown, startMonth, endMonth));
    }
    if (lgAmountBreakdown.length > 0) {
      setFilteredLgAmountBreakdown(filterAmountBreakdownByDateRange(lgAmountBreakdown, startMonth, endMonth));
    }
    if (plAmountBreakdown.length > 0) {
      setFilteredPlAmountBreakdown(filterAmountBreakdownByDateRange(plAmountBreakdown, startMonth, endMonth));
    }
    if (refundAllData.length > 0) {
      setFilteredRefundAllData(filterDataByDateRange(refundAllData, startMonth, endMonth));
      setFilteredRefundLGData(filterDataByDateRange(refundLGData, startMonth, endMonth));
      setFilteredRefundPLData(filterDataByDateRange(refundPLData, startMonth, endMonth));
    }
    if (refundLgAmountBreakdown.length > 0) {
      setFilteredRefundLgAmountBreakdown(filterAmountBreakdownByDateRange(refundLgAmountBreakdown, startMonth, endMonth));
    }
    if (refundPlAmountBreakdown.length > 0) {
      setFilteredRefundPlAmountBreakdown(filterAmountBreakdownByDateRange(refundPlAmountBreakdown, startMonth, endMonth));
    }

    if (programBreakdownAll.length > 0) {
      setFilteredProgramBreakdownAll(filterProgramBreakdownByDateRange(programBreakdownAll, startMonth, endMonth));
    }
    if (programBreakdownLG.length > 0) {
      setFilteredProgramBreakdownLG(filterProgramBreakdownByDateRange(programBreakdownLG, startMonth, endMonth));
    }
    if (programBreakdownPL.length > 0) {
      setFilteredProgramBreakdownPL(filterProgramBreakdownByDateRange(programBreakdownPL, startMonth, endMonth));
    }
  }, [
    startMonth,
    endMonth,
    allData,
    losGatosData,
    pleasantonData,
    allMembershipData,
    losGatosMembershipData,
    pleasantonMembershipData,
    amountBreakdown,
    refundAmountBreakdown,
    lgAmountBreakdown,
    plAmountBreakdown,
    refundLgAmountBreakdown,
    refundPlAmountBreakdown,
    refundAllData,
    refundLGData,
    refundPLData,
    programBreakdownAll,
    programBreakdownLG,
    programBreakdownPL,
  ]);

  // Initialize / adjust selected month for revenue pies when filtered data changes
  useEffect(() => {
    if (!amountPieMonth) {
      const lastWithData = [...filteredAmountBreakdown].reverse().find(d => d.total > 0);
      if (lastWithData) setAmountPieMonth(lastWithData.month);
      else if (filteredAmountBreakdown.length > 0) setAmountPieMonth(filteredAmountBreakdown[filteredAmountBreakdown.length - 1].month);
    } else {
      // If current selected month falls outside range after filters change, reset
      if (!filteredAmountBreakdown.find(d => d.month === amountPieMonth)) {
        const last = filteredAmountBreakdown[filteredAmountBreakdown.length - 1];
        if (last) setAmountPieMonth(last.month);
      }
    }
  }, [filteredAmountBreakdown, amountPieMonth]);

  // Initialize / adjust selected month for membership pies when filtered program breakdown changes
  useEffect(() => {
    if (!programPieMonth) {
      const lastWithData = [...filteredProgramBreakdownAll].reverse().find(d => d.total > 0);
      if (lastWithData) setProgramPieMonth(lastWithData.month);
      else if (filteredProgramBreakdownAll.length > 0) setProgramPieMonth(filteredProgramBreakdownAll[filteredProgramBreakdownAll.length - 1].month);
    } else {
      if (!filteredProgramBreakdownAll.find(d => d.month === programPieMonth)) {
        const last = filteredProgramBreakdownAll[filteredProgramBreakdownAll.length - 1];
        if (last) setProgramPieMonth(last.month);
      }
    }
  }, [filteredProgramBreakdownAll, programPieMonth]);

  const filteredTransactions = useMemo(() => {
    if (!startMonth || !endMonth) return [];
    const base = filterTransactionsByDateRange(transactions, startMonth, endMonth);
    const amountKeys = computeAmountLegendKeys(
      filterAmountBreakdownByDateRange(amountBreakdown, startMonth, endMonth),
      10,
    ).filter(k => k !== 'Other');
    return filterTransactionsByFilters(base, revenueFilters, amountKeys);
  }, [transactions, startMonth, endMonth, revenueFilters, amountBreakdown]);

  const prevHasRevenueFiltersRef = useRef(hasRevenueFilters);
  const revenueDetailsRef = useRef<HTMLDivElement | null>(null);
  const membershipDetailsRef = useRef<HTMLDivElement | null>(null);
  const refundDetailsRef = useRef<HTMLDivElement | null>(null);

  const scrollSectionIntoView = (element: HTMLElement | null) => {
    if (typeof window === 'undefined' || !element) return;
    window.requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const focusRevenueDetails = () => scrollSectionIntoView(revenueDetailsRef.current);
  const focusMembershipDetails = () => scrollSectionIntoView(membershipDetailsRef.current);
  const focusRefundDetails = () => scrollSectionIntoView(refundDetailsRef.current);

  const renderCollapseToggle = (key: CollapsibleKey, isCollapsed: boolean, label: string) => (
    <button
      type="button"
      onClick={() => toggleSection(key)}
      className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${label}`}
    >
      <span aria-hidden="true" className="text-lg leading-none">
        {isCollapsed ? '↓' : '—'}
      </span>
    </button>
  );

  const renderFilterHint = () => (
    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Tip: Click bars, segments, or slices to filter details below.</p>
  );

  useEffect(() => {
    setVisibleTransactionsCount(prev => {
      if (hasRevenueFilters) {
        return filteredTransactions.length;
      }
      const base = prevHasRevenueFiltersRef.current ? TRANSACTIONS_PAGE_SIZE : prev;
      const next = Math.max(base, TRANSACTIONS_PAGE_SIZE);
      return Math.min(next, filteredTransactions.length);
    });
    prevHasRevenueFiltersRef.current = hasRevenueFilters;
  }, [filteredTransactions.length, hasRevenueFilters]);

  const isViewingTransactions = viewMode === 'revenue' && revenueDetailMode === 'transactions';
  const isViewingRefundTransactions = viewMode === 'refunds' && refundDetailMode === 'transactions';

  useEffect(() => {
    if (!isViewingTransactions && !hasRevenueFilters) {
      setVisibleTransactionsCount(TRANSACTIONS_PAGE_SIZE);
    }
  }, [isViewingTransactions, hasRevenueFilters]);

  const canLoadMoreTransactions =
    !hasRevenueFilters &&
    isViewingTransactions &&
    visibleTransactionsCount < filteredTransactions.length;

  const handleLoadMoreTransactions = () => {
    setVisibleTransactionsCount(count => Math.min(count + TRANSACTIONS_PAGE_SIZE, filteredTransactions.length));
  };

  const handleStartMonthChange = (month: string) => {
    setStartMonth(month);
    if (month > endMonth) {
      setEndMonth(month);
    }
  };

  const handleEndMonthChange = (month: string) => {
    setEndMonth(month);
  };

  // Compute net revenue datasets (revenue minus refunds)
  const netAllData = useMemo(() => {
    return filteredAllData;
  }, [filteredAllData]);

  const netLGData = useMemo(() => {
    return filteredLosGatosData;
  }, [filteredLosGatosData]);

  const netPLData = useMemo(() => {
    return filteredPleasantonData;
  }, [filteredPleasantonData]);

  // Compute net amount breakdowns per month (subtract refund totals from overall monthly total only)
  const netAmountBreakdown = useMemo(() => {
    return filteredAmountBreakdown;
  }, [filteredAmountBreakdown]);

  const netLgAmountBreakdown = useMemo(() => {
    return filteredLgAmountBreakdown;
  }, [filteredLgAmountBreakdown]);

  const netPlAmountBreakdown = useMemo(() => {
    return filteredPlAmountBreakdown;
  }, [filteredPlAmountBreakdown]);

  // Legend keys for external legends on location-specific composition charts
  const lgLegendKeys = useMemo(() => computeAmountLegendKeys(filteredLgAmountBreakdown, 10), [filteredLgAmountBreakdown]);
  const plLegendKeys = useMemo(() => computeAmountLegendKeys(filteredPlAmountBreakdown, 10), [filteredPlAmountBreakdown]);
  // Legend keys for the overall composition chart
  const overallLegendKeys = useMemo(() => computeAmountLegendKeys(filteredAmountBreakdown, 10), [filteredAmountBreakdown]);
  const refundOverallLegendKeys = useMemo(() => computeAmountLegendKeys(filteredRefundAmountBreakdown, 10), [filteredRefundAmountBreakdown]);
  const refundLgLegendKeys = useMemo(() => computeAmountLegendKeys(filteredRefundLgAmountBreakdown, 10), [filteredRefundLgAmountBreakdown]);
  const refundPlLegendKeys = useMemo(() => computeAmountLegendKeys(filteredRefundPlAmountBreakdown, 10), [filteredRefundPlAmountBreakdown]);
  // Program legend keys
  // Derive all unique program categories across the filtered data (sorted by total contribution desc)
  const overallProgramKeys = useMemo(() => {
    const sum = new Map<string, number>();
    filteredProgramBreakdownAll.forEach(d => {
      for (const [k, v] of Object.entries(d.programs)) {
        sum.set(k, (sum.get(k) || 0) + v);
      }
    });
    return Array.from(sum.entries()).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }, [filteredProgramBreakdownAll]);
  const lgProgramKeys = useMemo(() => {
    const sum = new Map<string, number>();
    filteredProgramBreakdownLG.forEach(d => {
      for (const [k, v] of Object.entries(d.programs)) {
        sum.set(k, (sum.get(k) || 0) + v);
      }
    });
    return Array.from(sum.entries()).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }, [filteredProgramBreakdownLG]);
  const plProgramKeys = useMemo(() => {
    const sum = new Map<string, number>();
    filteredProgramBreakdownPL.forEach(d => {
      for (const [k, v] of Object.entries(d.programs)) {
        sum.set(k, (sum.get(k) || 0) + v);
      }
    });
    return Array.from(sum.entries()).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }, [filteredProgramBreakdownPL]);

  const filteredRefundTransactions = useMemo(() => {
    if (!startMonth || !endMonth) return [] as RefundRow[];
    const base = filterRefundsByDateRange(refunds, startMonth, endMonth);
    const amountKeys = computeAmountLegendKeys(
      filterAmountBreakdownByDateRange(refundAmountBreakdown, startMonth, endMonth),
      10,
    ).filter(k => k !== 'Other');
    return filterRefundsByFilters(base, refundFilters, amountKeys);
  }, [refunds, startMonth, endMonth, refundFilters, refundAmountBreakdown]);

  const {
    revenueAmount: isRevenueAmountCollapsed,
    revenueLosGatosChart: isRevenueLosGatosChartCollapsed,
    revenueLosGatosComposition: isRevenueLosGatosCompositionCollapsed,
    revenuePleasantonChart: isRevenuePleasantonChartCollapsed,
    revenuePleasantonComposition: isRevenuePleasantonCompositionCollapsed,
  revenueLocationAmountPies: isRevenueLocationAmountPiesCollapsed,
    membershipProgram: isMembershipProgramCollapsed,
    membershipLocationProgramPies: isMembershipLocationProgramPiesCollapsed,
    membershipLosGatosChart: isMembershipLosGatosChartCollapsed,
    membershipLosGatosComposition: isMembershipLosGatosCompositionCollapsed,
    membershipPleasantonChart: isMembershipPleasantonChartCollapsed,
    membershipPleasantonComposition: isMembershipPleasantonCompositionCollapsed,
    refundLosGatosChart: isRefundLosGatosChartCollapsed,
    refundLosGatosComposition: isRefundLosGatosCompositionCollapsed,
    refundPleasantonChart: isRefundPleasantonChartCollapsed,
    refundPleasantonComposition: isRefundPleasantonCompositionCollapsed,
  } = collapsedSections;

  if (loading) {
    return (
      <main className="w-full px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Loading...</h1>
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="w-full px-4">
        <h1 className="text-3xl font-bold text-center text-red-600">Error Loading Data</h1>
        <div className="text-center text-gray-600 mt-4 space-y-2">
          <p className="font-semibold">{error}</p>
          <p className="text-sm">
            If you&#39;re seeing this in production, please ensure the CSV files are properly deployed.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full px-4 space-y-8">
      {/* Header with toggle */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">BAFC Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
            <span>MoM visualization</span>
            <button
              type="button"
              onClick={toggleTheme}
              className="ml-1 px-2 py-0.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle theme"
            >
              <span className="inline dark:hidden">Light mode</span>
              <span className="hidden dark:inline">Dark mode</span>
            </button>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === 'revenue' && (
            <button
              type="button"
              onClick={() => setAfterRefunds(v => !v)}
              aria-pressed={afterRefunds}
              className={`px-3 py-2 text-sm font-medium border transition-colors ${afterRefunds ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-black text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              title="Show revenue after refunds"
            >
              After Refunds
            </button>
          )}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 w-fit">
            <button
              onClick={() => setViewMode('revenue')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'revenue'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setViewMode('refunds')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'refunds'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Refunds
            </button>
            <button
              onClick={() => setViewMode('membership')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'membership'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Membership
            </button>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Date Range Selector */}
      <DateRangeSelector
        startMonth={startMonth}
        endMonth={endMonth}
        availableMonths={availableMonths}
        onStartMonthChange={handleStartMonthChange}
        onEndMonthChange={handleEndMonthChange}
      />

      {viewMode === 'revenue' ? (
        <>
          {/* Overall Revenue Chart */}
          <section className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Overall Monthly Revenue</h2>
            </div>
            <RevenueChart
              data={netAllData}
              onBarClick={({ month }) => {
                setRevenueDetailMode('transactions');
                setRevenueFilters(prev => ({ ...prev, month, location: undefined, amountKey: undefined }));
                focusRevenueDetails();
              }}
            />
            {renderFilterHint()}
          </section>



          {/* Amount Breakdown by Transaction Value with legend to the right of header */}
          <section className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6">
            {renderCollapseToggle('revenueAmount', isRevenueAmountCollapsed, 'revenue composition section')}
            <div className="pr-12 sm:pr-16">
              <div className="mb-2 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Revenue Composition by Transaction Amount</h3>
                  {!isRevenueAmountCollapsed && (
                    <div className="sm:w-auto">
                      <div className="grid grid-flow-col grid-rows-2 auto-cols-max gap-x-4 gap-y-2">
                        {overallLegendKeys.map((k, i) => (
                          <div key={k} className="flex items-center gap-1.5">
                            <span
                              className="inline-block w-3 h-3"
                              style={{ backgroundColor: amountLegendPalette[i % amountLegendPalette.length] }}
                            />
                            <span className="text-xs text-gray-700 dark:text-gray-300">{k === 'Other' ? 'Other' : `$${k}`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {!isRevenueAmountCollapsed && (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Each bar shows the monthly total, built from segments proportional to common transaction amounts.</p>
                    <RevenueAmountBreakdownChart
                    data={netAmountBreakdown}
                    topN={10}
                    showLegend={false}
                    onSegmentClick={({ month, amountKey }) => {
                      setRevenueDetailMode('transactions');
                      setRevenueFilters(prev => ({ ...prev, month, amountKey, location: undefined }));
                      focusRevenueDetails();
                    }}
                  />
                  {renderFilterHint()}
                </>
              )}
            </div>
          </section>

          {/* Location Composition Pie Charts (separate collapsible section) */}
          <section className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6 mt-8 overflow-hidden">
            {renderCollapseToggle('revenueLocationAmountPies', isRevenueLocationAmountPiesCollapsed, 'location composition pies section')}
            <div className="pr-12 sm:pr-16">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Location Composition</h3>
                </div>
                {!isRevenueLocationAmountPiesCollapsed && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="amountPieMonth" className="text-xs font-medium text-gray-600 dark:text-gray-300">Month:</label>
                    <select
                      id="amountPieMonth"
                      value={amountPieMonth}
                      onChange={e => setAmountPieMonth(e.target.value)}
                      className="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {filteredAmountBreakdown.map(d => (
                        <option key={d.month} value={d.month}>{d.month}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {!isRevenueLocationAmountPiesCollapsed && (
                <div className="grid md:grid-cols-2 gap-8 pb-4">
                  <div className="overflow-hidden">
                    <RevenueAmountPieChart
                      breakdown={netLgAmountBreakdown.find(d => d.month === amountPieMonth)}
                      legendKeys={lgLegendKeys}
                      title={`Los Gatos – ${amountPieMonth || ''}`}
                      showTotalBelowTitle
                      onSliceClick={({ amountKey, month }) => {
                        setRevenueDetailMode('transactions');
                        setRevenueFilters(prev => ({ ...prev, month, amountKey, location: 'Los Gatos' }));
                        focusRevenueDetails();
                      }}
                    />
                    {renderFilterHint()}
                  </div>
                  <div className="overflow-hidden">
                    <RevenueAmountPieChart
                      breakdown={netPlAmountBreakdown.find(d => d.month === amountPieMonth)}
                      legendKeys={plLegendKeys}
                      title={`Pleasanton – ${amountPieMonth || ''}`}
                      showTotalBelowTitle
                      onSliceClick={({ amountKey, month }) => {
                        setRevenueDetailMode('transactions');
                        setRevenueFilters(prev => ({ ...prev, month, amountKey, location: 'Pleasanton' }));
                        focusRevenueDetails();
                      }}
                    />
                    {renderFilterHint()}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Location-specific Charts with Composition below each */}
          <section className="grid md:grid-cols-2 gap-8">
            {/* Los Gatos column */}
            <div className="space-y-8">
              <div className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6">
                {renderCollapseToggle('revenueLosGatosChart', isRevenueLosGatosChartCollapsed, 'Los Gatos revenue chart')}
                <div className="pr-12 sm:pr-16">
                  <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">Los Gatos Location</h3>
                  {!isRevenueLosGatosChartCollapsed && (
                    <LocationChart
                      data={netLGData}
                      title="Los Gatos Location"
                      color="#059669"
                      onBarClick={({ month }) => {
                        setRevenueDetailMode('transactions');
                        setRevenueFilters(prev => ({ ...prev, month, location: 'Los Gatos' }));
                        focusRevenueDetails();
                      }}
                      showTitle={false}
                    />
                  )}
                  {!isRevenueLosGatosChartCollapsed && renderFilterHint()}
                </div>
              </div>
              <div className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6">
                {renderCollapseToggle('revenueLosGatosComposition', isRevenueLosGatosCompositionCollapsed, 'Los Gatos revenue composition section')}
                <div className="pr-12 sm:pr-16">
                  <div className="mb-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Los Gatos Composition</h4>
                    {!isRevenueLosGatosCompositionCollapsed && (
                      <div className="sm:w-auto">
                        <div className="grid grid-flow-col grid-rows-2 auto-cols-max gap-x-4 gap-y-2">
                          {lgLegendKeys.map((k, i) => (
                            <div key={k} className="flex items-center gap-1.5">
                              <span
                                className="inline-block w-3 h-3"
                                style={{ backgroundColor: amountLegendPalette[i % amountLegendPalette.length] }}
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">{k === 'Other' ? 'Other' : `$${k}`}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {!isRevenueLosGatosCompositionCollapsed && (
                    <RevenueAmountBreakdownChart
                      data={netLgAmountBreakdown}
                      topN={10}
                      showLegend={false}
                      onSegmentClick={({ month, amountKey }) => {
                        setRevenueDetailMode('transactions');
                        setRevenueFilters(prev => ({ ...prev, month, amountKey, location: 'Los Gatos' }));
                        focusRevenueDetails();
                      }}
                    />
                  )}
                  {!isRevenueLosGatosCompositionCollapsed && renderFilterHint()}
                </div>
              </div>
            </div>

            {/* Pleasanton column */}
            <div className="space-y-8">
              <div className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6">
                {renderCollapseToggle('revenuePleasantonChart', isRevenuePleasantonChartCollapsed, 'Pleasanton revenue chart')}
                <div className="pr-12 sm:pr-16">
                  <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">Pleasanton Location</h3>
                  {!isRevenuePleasantonChartCollapsed && (
                    <LocationChart
                      data={netPLData}
                      title="Pleasanton Location"
                      color="#dc2626"
                      onBarClick={({ month }) => {
                        setRevenueDetailMode('transactions');
                        setRevenueFilters(prev => ({ ...prev, month, location: 'Pleasanton' }));
                        focusRevenueDetails();
                      }}
                      showTitle={false}
                    />
                  )}
                  {!isRevenuePleasantonChartCollapsed && renderFilterHint()}
                </div>
              </div>
              <div className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6">
                {renderCollapseToggle('revenuePleasantonComposition', isRevenuePleasantonCompositionCollapsed, 'Pleasanton revenue composition section')}
                <div className="pr-12 sm:pr-16">
                  <div className="mb-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Pleasanton Composition</h4>
                    {!isRevenuePleasantonCompositionCollapsed && (
                      <div className="sm:w-auto">
                        <div className="grid grid-flow-col grid-rows-2 auto-cols-max gap-x-4 gap-y-2">
                          {plLegendKeys.map((k, i) => (
                            <div key={k} className="flex items-center gap-1.5">
                              <span
                                className="inline-block w-3 h-3"
                                style={{ backgroundColor: amountLegendPalette[i % amountLegendPalette.length] }}
                              />
                              <span className="text-xs text-gray-700 dark:text-gray-300">{k === 'Other' ? 'Other' : `$${k}`}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {!isRevenuePleasantonCompositionCollapsed && (
                    <RevenueAmountBreakdownChart
                      data={netPlAmountBreakdown}
                      topN={10}
                      showLegend={false}
                      onSegmentClick={({ month, amountKey }) => {
                        setRevenueDetailMode('transactions');
                        setRevenueFilters(prev => ({ ...prev, month, amountKey, location: 'Pleasanton' }));
                        focusRevenueDetails();
                      }}
                    />
                  )}
                  {!isRevenuePleasantonCompositionCollapsed && renderFilterHint()}
                </div>
              </div>
            </div>
          </section>

          {/* Data Table / Transactions */}
          <section
            ref={revenueDetailsRef}
            className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6"
          >
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Revenue Details</h2>
              <div className="flex items-center gap-2">
                {canLoadMoreTransactions && (
                  <button
                    onClick={handleLoadMoreTransactions}
                    className="px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Load more
                  </button>
                )}
                <button
                  onClick={() => setRevenueDetailMode(revenueDetailMode === 'summary' ? 'transactions' : 'summary')}
                  className="px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  {revenueDetailMode === 'summary' ? 'Show Transactions' : 'Show Summary'}
                </button>
                {hasRevenueFilters && revenueDetailMode === 'transactions' && (
                  <button
                    onClick={() => setRevenueFilters({})}
                    className="px-3 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                  >Clear Filters</button>
                )}
              </div>
            </div>
            {revenueDetailMode === 'summary' ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-black">
                      <th className="px-4 py-2 text-left">Month</th>
                      <th className="px-4 py-2 text-right">Total Revenue</th>
                      <th className="px-4 py-2 text-right">Los Gatos</th>
                      <th className="px-4 py-2 text-right">Pleasanton</th>
                    </tr>
                  </thead>
                  <tbody>
                    {netAllData.map((item: any, index: number) => {
                      const lgItem = netLGData.find((lg: any) => lg.month === item.month);
                      const plItem = netPLData.find((pl: any) => pl.month === item.month);

                      return (
                        <tr key={item.month} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-850' : 'bg-white dark:bg-black'}>
                          <td className="px-4 py-2 font-medium">{item.month}</td>
                          <td className="px-4 py-2 text-right">${Math.round(item.revenue).toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">
                            {lgItem ? `$${Math.round(lgItem.revenue).toLocaleString()}` :
                             <span className="text-gray-400 dark:text-gray-500 italic">No data</span>}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {plItem ? `$${Math.round(plItem.revenue).toLocaleString()}` :
                             <span className="text-gray-400 dark:text-gray-500 italic">No data</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <RevenueTransactionsTable
                transactions={filteredTransactions}
                filters={revenueFilters}
                onClearFilters={() => setRevenueFilters({})}
                visibleCount={visibleTransactionsCount}
              />
            )}

            {revenueDetailMode === 'summary' && filteredAllData.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No data available for the selected date range.
              </div>
            )}
          </section>
        </>
      ) : viewMode === 'membership' ? (
        <>
          {/* Overall Membership Chart */}
          <section className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Overall Membership Overview</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Data source: {membershipFile === 'memberships_all.csv' ? 'All Memberships' : 'First Memberships Only'}
                </p>
              </div>

              {/* Membership File Toggle */}
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-700 p-1 w-fit">
                <button
                  onClick={() => setMembershipFile('memberships_all.csv')}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    membershipFile === 'memberships_all.csv'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  All Memberships
                </button>
                <button
                  onClick={() => setMembershipFile('memberships_first.csv')}
                  className={`px-3 py-2 text-xs font-medium transition-colors ${
                    membershipFile === 'memberships_first.csv'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  First Memberships Only
                </button>
              </div>
            </div>
            <MembershipChart
              data={filteredAllMembershipData}
              onBarClick={({ month }) => {
                setMembershipDetailMode('members');
                setMembershipFilters(prev => {
                  const next: MembershipFilters = { ...prev, month };
                  if (next.program) delete next.program;
                  if (next.location) delete next.location;
                  return next;
                });
                focusMembershipDetails();
              }}
            />
            {renderFilterHint()}
          </section>

          {/* Membership Composition by Program (Overall) */}
          <section className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6">
            {renderCollapseToggle('membershipProgram', isMembershipProgramCollapsed, 'membership composition section')}
            <div className="pr-12 sm:pr-16">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Membership Composition by Program</h3>
                    {!isMembershipProgramCollapsed && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Each bar shows total active members per month, split by program.</p>
                    )}
                  </div>
                  {!isMembershipProgramCollapsed && (
                    <VerticalLegend
                      keys={overallProgramKeys}
                      palette={programLegendPalette}
                      labelFormatter={(k) => (k === 'Other' ? 'Other' : k)}
                      className="sm:ml-auto w-full sm:w-[32rem]"
                      columns={2}
                    />
                  )}
                </div>
              </div>
              {!isMembershipProgramCollapsed && (
                <MembershipProgramBreakdownChart
                  data={filteredProgramBreakdownAll}
                  topN={10}
                  showLegend={false}
                  showAllCategories={true}
                  onSegmentClick={({ month, program }) => {
                    setMembershipDetailMode('members');
                    setMembershipFilters(prev => {
                      const next: MembershipFilters = { ...prev, month, program };
                      if (next.location) delete next.location;
                      return next;
                    });
                    focusMembershipDetails();
                  }}
                />
              )}
              {!isMembershipProgramCollapsed && renderFilterHint()}
            </div>
          </section>

          {/* Membership Location Composition Pie Charts (separate collapsible section) */}
          <section className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6 mt-8 overflow-hidden">
            {renderCollapseToggle('membershipLocationProgramPies', isMembershipLocationProgramPiesCollapsed, 'membership location composition pies section')}
            <div className="pr-12 sm:pr-16">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Location Composition</h3>
                </div>
                {!isMembershipLocationProgramPiesCollapsed && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="programPieMonth" className="text-xs font-medium text-gray-600 dark:text-gray-300">Month:</label>
                    <select
                      id="programPieMonth"
                      value={programPieMonth}
                      onChange={e => setProgramPieMonth(e.target.value)}
                      className="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {filteredProgramBreakdownAll.map(d => (
                        <option key={d.month} value={d.month}>{d.month}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {!isMembershipLocationProgramPiesCollapsed && (
                <div className="grid md:grid-cols-2 gap-8 pb-4">
                  <div className="overflow-hidden">
                    <MembershipProgramPieChart
                      breakdown={filteredProgramBreakdownLG.find(d => d.month === programPieMonth)}
                      legendKeys={lgProgramKeys}
                      title={`Los Gatos – ${programPieMonth || ''}`}
                      showTotalBelowTitle
                      onSliceClick={({ program, month }) => {
                        setMembershipDetailMode('members');
                        setMembershipFilters(prev => ({ ...prev, month, program, location: 'Los Gatos' }));
                        focusMembershipDetails();
                      }}
                    />
                    {renderFilterHint()}
                  </div>
                  <div className="overflow-hidden">
                    <MembershipProgramPieChart
                      breakdown={filteredProgramBreakdownPL.find(d => d.month === programPieMonth)}
                      legendKeys={plProgramKeys}
                      title={`Pleasanton – ${programPieMonth || ''}`}
                      showTotalBelowTitle
                      onSliceClick={({ program, month }) => {
                        setMembershipDetailMode('members');
                        setMembershipFilters(prev => ({ ...prev, month, program, location: 'Pleasanton' }));
                        focusMembershipDetails();
                      }}
                    />
                    {renderFilterHint()}
                  </div>
                </div>
              )}
            </div>
          </section>


          {/* Location-specific Membership Charts (refactored to two-column grid to avoid large gaps when collapsing) */}
          <section className="grid md:grid-cols-2 gap-8">
            {/* Los Gatos column */}
            <div className="space-y-8">
              <div className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6">
                {renderCollapseToggle('membershipLosGatosChart', isMembershipLosGatosChartCollapsed, 'Los Gatos membership chart')}
                <div className="pr-12 sm:pr-16">
                  <h3 className={`text-lg font-semibold text-gray-800 dark:text-gray-100 ${
                    isMembershipLosGatosChartCollapsed ? '' : 'mb-4'
                  }`}>Los Gatos Membership</h3>
                  {!isMembershipLosGatosChartCollapsed && (
                    <LocationMembershipChart
                      data={filteredLosGatosMembershipData}
                      title="Los Gatos Membership"
                      color="#059669"
                      onBarClick={({ month }) => {
                        setMembershipDetailMode('members');
                        setMembershipFilters(prev => {
                          const next: MembershipFilters = { ...prev, month, location: 'Los Gatos' };
                          if (next.program) delete next.program;
                          return next;
                        });
                        focusMembershipDetails();
                      }}
                      showTitle={false}
                    />
                  )}
                  {!isMembershipLosGatosChartCollapsed && renderFilterHint()}
                </div>
              </div>
              <div className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6">
                {renderCollapseToggle('membershipLosGatosComposition', isMembershipLosGatosCompositionCollapsed, 'Los Gatos membership composition section')}
                <div className="pr-12 sm:pr-16">
                  <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 ${
                    isMembershipLosGatosCompositionCollapsed ? '' : 'mb-3'
                  }`}>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Los Gatos Composition</h4>
                    {!isMembershipLosGatosCompositionCollapsed && (
                      <VerticalLegend
                        keys={lgProgramKeys}
                        palette={programLegendPalette}
                        labelFormatter={(k) => (k === 'Other' ? 'Other' : k)}
                        className="sm:ml-auto w-full sm:w-64"
                      />
                    )}
                  </div>
                  {!isMembershipLosGatosCompositionCollapsed && (
                    <MembershipProgramBreakdownChart
                      data={filteredProgramBreakdownLG}
                      topN={10}
                      showLegend={false}
                      showAllCategories={true}
                      onSegmentClick={({ month, program }) => {
                        setMembershipDetailMode('members');
                        setMembershipFilters(prev => ({ ...prev, month, program, location: 'Los Gatos' }));
                        focusMembershipDetails();
                      }}
                    />
                  )}
                  {!isMembershipLosGatosCompositionCollapsed && renderFilterHint()}
                </div>
              </div>
            </div>

            {/* Pleasanton column */}
            <div className="space-y-8">
              <div className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6">
                {renderCollapseToggle('membershipPleasantonChart', isMembershipPleasantonChartCollapsed, 'Pleasanton membership chart')}
                <div className="pr-12 sm:pr-16">
                  <h3 className={`text-lg font-semibold text-gray-800 dark:text-gray-100 ${
                    isMembershipPleasantonChartCollapsed ? '' : 'mb-4'
                  }`}>Pleasanton Membership</h3>
                  {!isMembershipPleasantonChartCollapsed && (
                    <LocationMembershipChart
                      data={filteredPleasantonMembershipData}
                      title="Pleasanton Membership"
                      color="#dc2626"
                      onBarClick={({ month }) => {
                        setMembershipDetailMode('members');
                        setMembershipFilters(prev => {
                          const next: MembershipFilters = { ...prev, month, location: 'Pleasanton' };
                          if (next.program) delete next.program;
                          return next;
                        });
                        focusMembershipDetails();
                      }}
                      showTitle={false}
                    />
                  )}
                  {!isMembershipPleasantonChartCollapsed && renderFilterHint()}
                </div>
              </div>
              <div className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6">
                {renderCollapseToggle('membershipPleasantonComposition', isMembershipPleasantonCompositionCollapsed, 'Pleasanton membership composition section')}
                <div className="pr-12 sm:pr-16">
                  <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 ${
                    isMembershipPleasantonCompositionCollapsed ? '' : 'mb-3'
                  }`}>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Pleasanton Composition</h4>
                    {!isMembershipPleasantonCompositionCollapsed && (
                      <VerticalLegend
                        keys={plProgramKeys}
                        palette={programLegendPalette}
                        labelFormatter={(k) => (k === 'Other' ? 'Other' : k)}
                        className="sm:ml-auto w-full sm:w-64"
                      />
                    )}
                  </div>
                  {!isMembershipPleasantonCompositionCollapsed && (
                    <MembershipProgramBreakdownChart
                      data={filteredProgramBreakdownPL}
                      topN={10}
                      showLegend={false}
                      showAllCategories={true}
                      onSegmentClick={({ month, program }) => {
                        setMembershipDetailMode('members');
                        setMembershipFilters(prev => ({ ...prev, month, program, location: 'Pleasanton' }));
                        focusMembershipDetails();
                      }}
                    />
                  )}
                  {!isMembershipPleasantonCompositionCollapsed && renderFilterHint()}
                </div>
              </div>
            </div>
          </section>

          {/* Membership Data Table / Members List Toggle */}
          <section
            ref={membershipDetailsRef}
            className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6"
          >
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Monthly Membership Breakdown</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMembershipDetailMode(membershipDetailMode === 'monthly' ? 'members' : 'monthly');
                    if (membershipDetailMode === 'members') setMembershipFilters({});
                  }}
                  className="px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  {membershipDetailMode === 'monthly' ? 'Show Members' : 'Show Monthly Table'}
                </button>
                {hasMembershipFilters && membershipDetailMode === 'members' && (
                  <button
                    onClick={() => setMembershipFilters({})}
                    className="px-3 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                  >Clear Filters</button>
                )}
              </div>
            </div>
            {membershipDetailMode === 'monthly' ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-black">
                    <th className="px-4 py-2 text-left">Month</th>
                    <th className="px-4 py-2 text-right">Total Members</th>
                    <th className="px-4 py-2 text-right">Los Gatos</th>
                    <th className="px-4 py-2 text-right">Pleasanton</th>
                    <th className="px-4 py-2 text-right">New Members</th>
                    <th className="px-4 py-2 text-right">Canceled</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAllMembershipData.map((item: any, index: number) => {
                    const lgItem = filteredLosGatosMembershipData.find((lg: any) => lg.month === item.month);
                    const plItem = filteredPleasantonMembershipData.find((pl: any) => pl.month === item.month);

                    return (
                      <tr key={item.month} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-850' : 'bg-white dark:bg-black'}>
                        <td className="px-4 py-2 font-medium">{item.month}</td>
                        <td className="px-4 py-2 text-right">{item.membershipCount}</td>
                        <td className="px-4 py-2 text-right">
                          {lgItem ? lgItem.membershipCount :
                           <span className="text-gray-400 dark:text-gray-500 italic">No data</span>}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {plItem ? plItem.membershipCount :
                           <span className="text-gray-400 dark:text-gray-500 italic">No data</span>}
                        </td>
                        <td className="px-4 py-2 text-right">{item.newMemberships}</td>
                        <td className="px-4 py-2 text-right">{item.canceledMemberships}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            ) : (
              <MembershipMembersTable
                members={rawMembers}
                filters={membershipFilters}
                onClearFilters={() => setMembershipFilters({})}
              />
            )}
            {membershipDetailMode === 'monthly' && filteredAllMembershipData.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No membership data available for the selected date range.</div>
            )}
          </section>
        </>
      ) : (
        <>
          {/* Refunds Charts (mirror Revenue) */}
          <section className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Overall Monthly Refunds</h2>
            <RevenueChart
              data={filteredRefundAmountBreakdown.map(d => ({ month: d.month, revenue: d.total, count: 0 }))}
              onBarClick={({ month }) => {
                setRefundDetailMode('transactions');
                setRefundFilters(prev => ({ ...prev, month, location: undefined, amountKey: undefined }));
                focusRefundDetails();
              }}
            />
            {renderFilterHint()}
          </section>

          <section className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6">
            {renderCollapseToggle('revenueAmount', isRevenueAmountCollapsed, 'refund composition section')}
            <div className="pr-12 sm:pr-16">
              <div className="mb-2 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Refund Composition by Transaction Amount</h3>
                  {!isRevenueAmountCollapsed && (
                    <div className="sm:w-auto">
                      <div className="grid grid-flow-col grid-rows-2 auto-cols-max gap-x-4 gap-y-2">
                        {refundOverallLegendKeys.map((k, i) => (
                          <div key={k} className="flex items-center gap-1.5">
                            <span
                              className="inline-block w-3 h-3"
                              style={{ backgroundColor: amountLegendPalette[i % amountLegendPalette.length] }}
                            />
                            <span className="text-xs text-gray-700 dark:text-gray-300">{k === 'Other' ? 'Other' : `$${k}`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {!isRevenueAmountCollapsed && (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Each bar shows the monthly total refunds, built from segments proportional to common refund amounts.</p>
                  <RevenueAmountBreakdownChart
                    data={filteredRefundAmountBreakdown}
                    topN={10}
                    showLegend={false}
                    onSegmentClick={({ month, amountKey }) => {
                      setRefundDetailMode('transactions');
                      setRefundFilters(prev => ({ ...prev, month, amountKey, location: undefined }));
                      focusRefundDetails();
                    }}
                  />
                  {renderFilterHint()}
                </>
              )}
            </div>
          </section>

          <section className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6 mt-8 overflow-hidden">
            {renderCollapseToggle('revenueLocationAmountPies', isRevenueLocationAmountPiesCollapsed, 'refund location composition pies section')}
            <div className="pr-12 sm:pr-16">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Location Composition</h3>
                </div>
                {!isRevenueLocationAmountPiesCollapsed && (
                  <div className="flex items-center gap-2">
                    <label htmlFor="amountPieMonth" className="text-xs font-medium text-gray-600 dark:text-gray-300">Month:</label>
                    <select
                      id="amountPieMonth"
                      value={amountPieMonth}
                      onChange={e => setAmountPieMonth(e.target.value)}
                      className="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {filteredRefundAmountBreakdown.map(d => (
                        <option key={d.month} value={d.month}>{d.month}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              {!isRevenueLocationAmountPiesCollapsed && (
                <div className="grid md:grid-cols-2 gap-8 pb-4">
                  <div className="overflow-hidden">
                    <RevenueAmountPieChart
                      breakdown={filteredRefundLgAmountBreakdown.find(d => d.month === amountPieMonth)}
                      legendKeys={refundLgLegendKeys}
                      title={`Los Gatos – ${amountPieMonth || ''}`}
                      showTotalBelowTitle
                      onSliceClick={({ amountKey, month }) => {
                        setRefundDetailMode('transactions');
                        setRefundFilters(prev => ({ ...prev, month, amountKey, location: 'Los Gatos' }));
                        focusRefundDetails();
                      }}
                    />
                    {renderFilterHint()}
                  </div>
                  <div className="overflow-hidden">
                    <RevenueAmountPieChart
                      breakdown={filteredRefundPlAmountBreakdown.find(d => d.month === amountPieMonth)}
                      legendKeys={refundPlLegendKeys}
                      title={`Pleasanton – ${amountPieMonth || ''}`}
                      showTotalBelowTitle
                      onSliceClick={({ amountKey, month }) => {
                        setRefundDetailMode('transactions');
                        setRefundFilters(prev => ({ ...prev, month, amountKey, location: 'Pleasanton' }));
                        focusRefundDetails();
                      }}
                    />
                    {renderFilterHint()}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Refunds Table (simplified columns) */}
          {/* Location-specific Refund Charts and Composition */}
          <section className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="space-y-8">
              <div className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6">
                {renderCollapseToggle('refundLosGatosChart', isRefundLosGatosChartCollapsed, 'Los Gatos refunds chart')}
                <div className="pr-12 sm:pr-16">
                  <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">Los Gatos Refunds</h3>
                  {!isRefundLosGatosChartCollapsed && (
                    <LocationChart
                      data={filteredRefundLGData}
                      title="Los Gatos Refunds"
                      color="#059669"
                      tooltipValueLabel="Refunds"
                      valueFormatter={(v) => `-$${Math.round(v).toLocaleString()}`}
                      onBarClick={({ month }) => {
                        setRefundDetailMode('transactions');
                        setRefundFilters(prev => ({ ...prev, month, location: 'Los Gatos' }));
                        focusRefundDetails();
                      }}
                      showTitle={false}
                    />
                  )}
                  {!isRefundLosGatosChartCollapsed && renderFilterHint()}
                </div>
              </div>
              <div className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6">
                {renderCollapseToggle('refundLosGatosComposition', isRefundLosGatosCompositionCollapsed, 'Los Gatos refund composition section')}
                <div className="pr-12 sm:pr-16">
                  <div className="mb-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Los Gatos Composition</h4>
                    {!isRefundLosGatosCompositionCollapsed && (
                      <div className="sm:w-auto">
                        <div className="grid grid-flow-col grid-rows-2 auto-cols-max gap-x-4 gap-y-2">
                          {refundLgLegendKeys.map((k, i) => (
                            <div key={k} className="flex items-center gap-1.5">
                              <span className="inline-block w-3 h-3" style={{ backgroundColor: amountLegendPalette[i % amountLegendPalette.length] }} />
                              <span className="text-xs text-gray-700 dark:text-gray-300">{k === 'Other' ? 'Other' : `$${k}`}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {!isRefundLosGatosCompositionCollapsed && (
                    <RevenueAmountBreakdownChart
                      data={filteredRefundLgAmountBreakdown}
                      topN={10}
                      showLegend={false}
                      onSegmentClick={({ month, amountKey }) => {
                        setRefundDetailMode('transactions');
                        setRefundFilters(prev => ({ ...prev, month, amountKey, location: 'Los Gatos' }));
                        focusRefundDetails();
                      }}
                    />
                  )}
                  {!isRefundLosGatosCompositionCollapsed && renderFilterHint()}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6">
                {renderCollapseToggle('refundPleasantonChart', isRefundPleasantonChartCollapsed, 'Pleasanton refunds chart')}
                <div className="pr-12 sm:pr-16">
                  <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-100">Pleasanton Refunds</h3>
                  {!isRefundPleasantonChartCollapsed && (
                    <LocationChart
                      data={filteredRefundPLData}
                      title="Pleasanton Refunds"
                      color="#dc2626"
                      tooltipValueLabel="Refunds"
                      valueFormatter={(v) => `-$${Math.round(v).toLocaleString()}`}
                      onBarClick={({ month }) => {
                        setRefundDetailMode('transactions');
                        setRefundFilters(prev => ({ ...prev, month, location: 'Pleasanton' }));
                        focusRefundDetails();
                      }}
                      showTitle={false}
                    />
                  )}
                  {!isRefundPleasantonChartCollapsed && renderFilterHint()}
                </div>
              </div>
              <div className="relative bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6">
                {renderCollapseToggle('refundPleasantonComposition', isRefundPleasantonCompositionCollapsed, 'Pleasanton refund composition section')}
                <div className="pr-12 sm:pr-16">
                  <div className="mb-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Pleasanton Composition</h4>
                    {!isRefundPleasantonCompositionCollapsed && (
                      <div className="sm:w-auto">
                        <div className="grid grid-flow-col grid-rows-2 auto-cols-max gap-x-4 gap-y-2">
                          {refundPlLegendKeys.map((k, i) => (
                            <div key={k} className="flex items-center gap-1.5">
                              <span className="inline-block w-3 h-3" style={{ backgroundColor: amountLegendPalette[i % amountLegendPalette.length] }} />
                              <span className="text-xs text-gray-700 dark:text-gray-300">{k === 'Other' ? 'Other' : `$${k}`}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {!isRefundPleasantonCompositionCollapsed && (
                    <RevenueAmountBreakdownChart
                      data={filteredRefundPlAmountBreakdown}
                      topN={10}
                      showLegend={false}
                      onSegmentClick={({ month, amountKey }) => {
                        setRefundDetailMode('transactions');
                        setRefundFilters(prev => ({ ...prev, month, amountKey, location: 'Pleasanton' }));
                        focusRefundDetails();
                      }}
                    />
                  )}
                  {!isRefundPleasantonCompositionCollapsed && renderFilterHint()}
                </div>
              </div>
            </div>
          </section>

          {/* Refund Details: Summary/Transactions toggle */}
          <section
            ref={refundDetailsRef}
            className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow p-6"
          >
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Refund Details</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRefundDetailMode(refundDetailMode === 'summary' ? 'transactions' : 'summary')}
                  className="px-3 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  {refundDetailMode === 'summary' ? 'Show Transactions' : 'Show Summary'}
                </button>
                {hasRefundFilters && refundDetailMode === 'transactions' && (
                  <button
                    onClick={() => setRefundFilters({})}
                    className="px-3 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                  >Clear Filters</button>
                )}
              </div>
            </div>

            {refundDetailMode === 'summary' ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-black">
                      <th className="px-4 py-2 text-left">Month</th>
                      <th className="px-4 py-2 text-right">Total Refunds</th>
                      <th className="px-4 py-2 text-right">Los Gatos</th>
                      <th className="px-4 py-2 text-right">Pleasanton</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRefundAllData.map((item: any, index: number) => {
                      const lgItem = filteredRefundLGData.find((lg: any) => lg.month === item.month);
                      const plItem = filteredRefundPLData.find((pl: any) => pl.month === item.month);
                      return (
                        <tr key={item.month} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-850' : 'bg-white dark:bg-black'}>
                          <td className="px-4 py-2 font-medium">{item.month}</td>
                          <td className="px-4 py-2 text-right">-${Math.round(item.revenue).toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">{lgItem ? `-$${Math.round(lgItem.revenue).toLocaleString()}` : <span className="text-gray-400 dark:text-gray-500 italic">No data</span>}</td>
                          <td className="px-4 py-2 text-right">{plItem ? `-$${Math.round(plItem.revenue).toLocaleString()}` : <span className="text-gray-400 dark:text-gray-500 italic">No data</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <RefundTransactionsTable
                refunds={filteredRefundTransactions}
                filters={refundFilters}
                onClearFilters={() => setRefundFilters({})}
              />
            )}

            {refundDetailMode === 'summary' && filteredRefundAllData.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">No data available for the selected date range.</div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
