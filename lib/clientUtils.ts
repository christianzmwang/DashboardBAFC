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

function generateMonthRange(startMonth: string, endMonth: string): string[] {
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
