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
