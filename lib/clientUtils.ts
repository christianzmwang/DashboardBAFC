export interface MonthlyRevenue {
  month: string; // YYYY-MM
  revenue: number;
  count: number;
}

export interface MonthlyMembership {
  month: string; // YYYY-MM
  membershipCount: number;
  newMemberships: number;
  canceledMemberships: number;
}

// Revenue composition by transaction amount for each month
export interface MonthlyAmountBreakdown {
  month: string; // YYYY-MM
  // key is the transaction amount bucket as a string (e.g., '55')
  amounts: Record<string, number>; // revenue sum contributed by each amount
  total: number; // total revenue that month (sum of values in amounts)
}

// Membership composition by program type per month
export interface MonthlyProgramBreakdown {
  month: string; // YYYY-MM
  programs: Record<string, number>; // active members count per program
  total: number; // total active members that month
}

// Raw member rows returned from the drill-down endpoint (planId intentionally omitted server-side)
export interface MemberRow {
  client: string;
  planName: string;
  startDate: string;
  endDate: string;
  membership: boolean;
  canceled: boolean;
  clientHomeLocation: string;
  clientId: string;
}

export interface MembershipFilters {
  month?: string; // YYYY-MM
  program?: string;
  location?: string;
}

export interface PaymentRow {
  invoiceNumber: string;
  invoiceId: string;
  invoiceStatus: string;
  transactionAt: string;
  transactionDate: string;
  transactionTime: string;
  month: string;
  transactionStatus: string;
  transactionType: string;
  paymentMethod: string;
  payer: string;
  payerHomeLocation: string;
  paymentAmount: number;
  transactionAmount: number;
  amountBucket: string;
}

export interface RevenueFilters {
  month?: string;
  location?: string;
  amountKey?: string;
}

export function generateMonthRange(startMonth: string, endMonth: string): string[] {
  const result: string[] = [];
  const [startYear, startM] = startMonth.split('-').map(Number);
  const [endYear, endM] = endMonth.split('-').map(Number);
  let year = startYear;
  let month = startM;
  while (year < endYear || (year === endYear && month <= endM)) {
    result.push(`${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`);
    month++;
    if (month > 12) { month = 1; year++; }
  }
  return result;
}

export function filterDataByDateRange(data: MonthlyRevenue[], startMonth: string, endMonth: string): MonthlyRevenue[] {
  const map = new Map(data.filter(d => d.month >= startMonth && d.month <= endMonth).map(d => [d.month, d] as const));
  return generateMonthRange(startMonth, endMonth).map(m => {
    const existing = map.get(m);
    return existing || { month: m, revenue: 0, count: 0 } as MonthlyRevenue;
  });
}

export function filterMembershipDataByDateRange(data: MonthlyMembership[], startMonth: string, endMonth: string): MonthlyMembership[] {
  const map = new Map(data.filter(d => d.month >= startMonth && d.month <= endMonth).map(d => [d.month, d] as const));
  return generateMonthRange(startMonth, endMonth).map(m => {
    const existing = map.get(m);
    return existing || { month: m, membershipCount: 0, newMemberships: 0, canceledMemberships: 0 } as MonthlyMembership;
  });
}

export function getAvailableMonths(data: MonthlyRevenue[]): string[] {
  return data.map(item => item.month).sort();
}

export function getAvailableMembershipMonths(data: MonthlyMembership[]): string[] {
  return data.map(item => item.month).sort();
}

// Filter helper that ensures every month in range exists; fills missing months with zero totals
export function filterAmountBreakdownByDateRange(
  data: MonthlyAmountBreakdown[],
  startMonth: string,
  endMonth: string
): MonthlyAmountBreakdown[] {
  const map = new Map(data.filter(d => d.month >= startMonth && d.month <= endMonth).map(d => [d.month, d] as const));
  return generateMonthRange(startMonth, endMonth).map(m => {
    const existing = map.get(m);
    return existing || { month: m, amounts: {}, total: 0 } as MonthlyAmountBreakdown;
  });
}

// Filter helper that ensures every month in range exists for program breakdown
export function filterProgramBreakdownByDateRange(
  data: MonthlyProgramBreakdown[],
  startMonth: string,
  endMonth: string
): MonthlyProgramBreakdown[] {
  const map = new Map(data.filter(d => d.month >= startMonth && d.month <= endMonth).map(d => [d.month, d] as const));
  return generateMonthRange(startMonth, endMonth).map(m => {
    const existing = map.get(m);
    return existing || { month: m, programs: {}, total: 0 } as MonthlyProgramBreakdown;
  });
}

const sanitizeProgramName = (raw: string | undefined | null) => (raw ? raw.trim() : 'Unknown');

const stringMonth = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const comparableMonth = (isoMonth: string) => isoMonth ?? '';

const shouldCountMonth = (month: string) => {
  if (!month) return false;
  const [year] = month.split('-').map(Number);
  return Number.isFinite(year) && year > 2021;
};

export function isMemberActiveInMonth(member: MemberRow, month: string): boolean {
  if (!member.membership || !member.startDate) return false;
  if (!shouldCountMonth(month)) return false;

  const startMonth = member.startDate.slice(0, 7);
  if (!shouldCountMonth(startMonth)) return false;

  const endMonth = member.canceled && member.endDate ? member.endDate.slice(0, 7) : undefined;
  if (endMonth) {
    return comparableMonth(startMonth) <= month && month < comparableMonth(endMonth);
  }
  return comparableMonth(startMonth) <= month;
}

export function filterMembersByFilters(members: MemberRow[], filters: MembershipFilters): MemberRow[] {
  const { month, program, location } = filters;
  return members.filter(member => {
    if (!member.membership || !member.startDate) return false;

    if (program && sanitizeProgramName(member.planName) !== program) return false;
    if (location && !(member.clientHomeLocation || '').includes(location)) return false;
    if (month && !isMemberActiveInMonth(member, month)) return false;
    return true;
  });
}

export function aggregateMonthlyMembershipsClient(members: MemberRow[]): MonthlyMembership[] {
  const monthlyData = new Map<string, { newMemberships: number; canceledMemberships: number }>();
  const events: Array<{ month: string; type: 'start' | 'end'; clientId: string }> = [];

  for (const member of members) {
    if (!member.membership || !member.startDate) continue;
    const start = new Date(member.startDate);
    if (isNaN(start.getTime()) || start.getFullYear() === 2021) continue;
    const startMonth = stringMonth(start);
    events.push({ month: startMonth, type: 'start', clientId: member.clientId });

    if (member.endDate && member.canceled) {
      const end = new Date(member.endDate);
      if (!isNaN(end.getTime()) && end.getFullYear() > 2021) {
        const endMonth = stringMonth(end);
        events.push({ month: endMonth, type: 'end', clientId: member.clientId });
      }
    }
  }

  if (events.length === 0) return [];

  events.sort((a, b) => a.month.localeCompare(b.month));

  const eventsByMonth = new Map<string, Array<{ type: 'start' | 'end'; clientId: string }>>();
  for (const { month, type, clientId } of events) {
    if (!monthlyData.has(month)) {
      monthlyData.set(month, { newMemberships: 0, canceledMemberships: 0 });
    }
    const list = eventsByMonth.get(month) || [];
    list.push({ type, clientId });
    eventsByMonth.set(month, list);
  }

  const activeMemberships = new Set<string>();
  const monthRange = generateMonthRange(events[0].month, events[events.length - 1].month);
  const result: MonthlyMembership[] = [];
  let cumulative = 0;

  for (const month of monthRange) {
    const monthEvents = eventsByMonth.get(month) || [];
    let monthData = monthlyData.get(month);
    if (!monthData) {
      monthData = { newMemberships: 0, canceledMemberships: 0 };
      monthlyData.set(month, monthData);
    }

    for (const event of monthEvents) {
      if (event.type === 'start') {
        activeMemberships.add(event.clientId);
        monthData.newMemberships += 1;
      } else {
        activeMemberships.delete(event.clientId);
        monthData.canceledMemberships += 1;
      }
    }

    cumulative += monthData.newMemberships - monthData.canceledMemberships;
    result.push({
      month,
      membershipCount: Math.max(0, cumulative),
      newMemberships: monthData.newMemberships,
      canceledMemberships: monthData.canceledMemberships,
    });
  }

  return result;
}

export function aggregateMonthlyProgramBreakdownClient(members: MemberRow[]): MonthlyProgramBreakdown[] {
  type Event = { month: string; type: 'start' | 'end'; clientId: string; program: string };
  const events: Event[] = [];

  for (const member of members) {
    if (!member.membership || !member.startDate) continue;
    const start = new Date(member.startDate);
    if (isNaN(start.getTime()) || start.getFullYear() === 2021) continue;
    const startMonth = stringMonth(start);
    const program = sanitizeProgramName(member.planName);
    events.push({ month: startMonth, type: 'start', clientId: member.clientId, program });

    if (member.endDate && member.canceled) {
      const end = new Date(member.endDate);
      if (!isNaN(end.getTime()) && end.getFullYear() > 2021) {
        const endMonth = stringMonth(end);
        events.push({ month: endMonth, type: 'end', clientId: member.clientId, program });
      }
    }
  }

  if (events.length === 0) return [];

  events.sort((a, b) => a.month.localeCompare(b.month));
  const eventsByMonth = new Map<string, Event[]>();
  for (const event of events) {
    const list = eventsByMonth.get(event.month) || [];
    list.push(event);
    eventsByMonth.set(event.month, list);
  }

  const activeByProgram = new Map<string, Set<string>>();
  const monthRange = generateMonthRange(events[0].month, events[events.length - 1].month);
  const result: MonthlyProgramBreakdown[] = [];

  for (const month of monthRange) {
    const monthEvents = eventsByMonth.get(month) || [];
    for (const event of monthEvents) {
      const set = activeByProgram.get(event.program) || new Set<string>();
      if (event.type === 'start') {
        set.add(event.clientId);
      } else {
        set.delete(event.clientId);
      }
      activeByProgram.set(event.program, set);
    }

    const programs: Record<string, number> = {};
    let total = 0;
    for (const [program, set] of activeByProgram.entries()) {
      if (set.size === 0) continue;
      programs[program] = set.size;
      total += set.size;
    }
    result.push({ month, programs, total });
  }

  return result;
}

export function filterTransactionsByDateRange(
  transactions: PaymentRow[],
  startMonth: string,
  endMonth: string
): PaymentRow[] {
  if (!startMonth || !endMonth) return transactions;
  return transactions.filter(t => t.month >= startMonth && t.month <= endMonth);
}

export function filterTransactionsByFilters(
  transactions: PaymentRow[],
  filters: RevenueFilters,
  topAmountKeys: string[]
): PaymentRow[] {
  const { month, location, amountKey } = filters;
  const topKeysSet = new Set(topAmountKeys);

  return transactions.filter(t => {
    if (month && t.month !== month) return false;
    if (location && !(t.payerHomeLocation || '').includes(location)) return false;
    if (amountKey) {
      if (amountKey === 'Other') {
        if (topKeysSet.has(t.amountBucket)) return false;
      } else if (t.amountBucket !== amountKey) {
        return false;
      }
    }
    return true;
  });
}
