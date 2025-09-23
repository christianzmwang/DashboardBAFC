import fs from 'fs';
import path from 'path';

export interface PaymentRecord {
  invoiceNumber: string;
  invoiceDueDate: string; // ISO date
  invoiceStatus: string;
  transactionAt: string;  // date time
  transactionStatus: string;
  transactionType: string;
  transactionAmount: number;
  paymentAmount: number;
  currency: string;
  payer: string;
  payerHomeLocation: string; // Added location field
  paymentMethod: string;
  invoiceId: string;
}

export interface MonthlyRevenue {
  month: string; // YYYY-MM
  revenue: number;
  count: number;
}

export interface MonthlyAmountBreakdown {
  month: string; // YYYY-MM
  amounts: Record<string, number>; // key is amount (e.g., '55') -> revenue sum
  total: number;
}

export interface LocationData {
  location: string;
  monthlyRevenue: MonthlyRevenue[];
}

export interface MemberRecord {
  client: string;
  planName: string;
  startDate: string;
  endDate: string;
  usedForFirstVisit: boolean;
  membership: boolean;
  canceled: boolean;
  clientFirstPlan: boolean;
  clientFirstMembership: boolean;
  clientHomeLocation: string;
  clientId: string;
  planId: string;
}

export interface MonthlyMembership {
  month: string; // YYYY-MM
  membershipCount: number;
  newMemberships: number;
  canceledMemberships: number;
}

export interface MonthlyProgramBreakdown {
  month: string; // YYYY-MM
  programs: Record<string, number>; // active members count per program
  total: number; // total active members that month
}

const amountToNumber = (raw: string) => Number(raw.replace(/[$,\"]/g, ''));

// Convert a date string into a Pacific Time month key without relying on host TZ.
function parseMonthPacific(raw: string | undefined | null): { month: string; year: number } | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  const monthKey = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`;
  return { month: monthKey, year };
}

function loadPaymentsFromFile(filename: string): PaymentRecord[] {
  let file: string;
  
  // Try different paths for different deployment environments
  const possiblePaths = [
    path.join(process.cwd(), 'public', filename),    // Standard Next.js public directory
    path.join(process.cwd(), filename),              // Root directory (development)
    path.join('/var/task/public', filename),         // Vercel/serverless path
    path.join('/app/public', filename),              // Docker/container path
  ];
  
  let text: string = '';
  let lastError: Error | null = null;
  
  for (const filePath of possiblePaths) {
    try {
      if (fs.existsSync(filePath)) {
        text = fs.readFileSync(filePath, 'utf8');
        break;
      }
    } catch (error) {
      lastError = error as Error;
      continue;
    }
  }
  
  if (!text) {
    throw new Error(`Could not find ${filename} in any of the expected locations. Last error: ${lastError?.message}`);
  }
  
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',');
  const idx = (h: string) => headers.indexOf(h);
  const out: PaymentRecord[] = [];
  const invoiceStatusIdx = idx('Invoice Status');
  const transactionStatusIdx = idx('Transaction Status');
  const transactionTypeIdx = idx('Transaction Type');
  const payerIdx = idx('Payer');
  const paymentMethodIdx = idx('Payment Method');
  const invoiceIdIdx = idx('Invoice ID');

  for (const l of lines) {
    if (!l.trim()) continue;
    // naive CSV split that works for this dataset (no embedded commas except with quotes around numbers we handle above)
    const parts = l.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    out.push({
      invoiceNumber: parts[idx('Invoice Number')],
      invoiceDueDate: parts[idx('Invoice Due Date')],
      invoiceStatus: invoiceStatusIdx !== -1 ? parts[invoiceStatusIdx] : '',
      transactionAt: parts[idx('Transaction At')],
      transactionStatus: transactionStatusIdx !== -1 ? parts[transactionStatusIdx] : '',
      transactionType: transactionTypeIdx !== -1 ? parts[transactionTypeIdx] : '',
      transactionAmount: amountToNumber(parts[idx('Transaction Amount')]),
      paymentAmount: amountToNumber(parts[idx('Payment Amount')]),
      currency: parts[idx('Currency Code')],
      payer: payerIdx !== -1 ? parts[payerIdx] : '',
      payerHomeLocation: parts[idx('Payer Home Location')],
      paymentMethod: paymentMethodIdx !== -1 ? parts[paymentMethodIdx] : '',
      invoiceId: invoiceIdIdx !== -1 ? parts[invoiceIdIdx] : '',
    });
  }
  return out;
}

function loadMembersFromFile(filename: string): MemberRecord[] {
  let text: string = '';
  let lastError: Error | null = null;
  
  // Try different paths for different deployment environments
  const possiblePaths = [
    path.join(process.cwd(), 'public', filename),    // Standard Next.js public directory
    path.join(process.cwd(), filename),              // Root directory (development)
    path.join('/var/task/public', filename),         // Vercel/serverless path
    path.join('/app/public', filename),              // Docker/container path
  ];
  
  for (const filePath of possiblePaths) {
    try {
      if (fs.existsSync(filePath)) {
        text = fs.readFileSync(filePath, 'utf8');
        break;
      }
    } catch (error) {
      lastError = error as Error;
      continue;
    }
  }
  
  if (!text) {
    throw new Error(`Could not find ${filename} in any of the expected locations. Last error: ${lastError?.message}`);
  }
  
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',');
  const idx = (h: string) => headers.indexOf(h);
  const out: MemberRecord[] = [];
  
  // Precompute indices; some columns may be missing depending on the CSV used
  const usedForFirstVisitIdx = idx("Used for Client's First Visit?");
  const membershipIdx = idx('Membership?');
  const canceledIdx = idx('Canceled?');
  const clientFirstPlanIdx = idx("Client's First Pass/Plan?");
  const clientFirstMembershipIdx = idx("Client's First Membership?");
  
  for (const l of lines) {
    if (!l.trim()) continue;
    // Handle CSV with potential commas in quoted strings
    const parts = l.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    
    out.push({
      client: parts[idx('Client')]?.replace(/"/g, '') || '',
      planName: parts[idx('Plan Name')]?.replace(/"/g, '') || '',
      startDate: parts[idx('Start Date')]?.replace(/"/g, '') || '',
      endDate: parts[idx('End Date')]?.replace(/"/g, '') || '',
      usedForFirstVisit: usedForFirstVisitIdx !== -1 ? (parts[usedForFirstVisitIdx]?.replace(/"/g, '') === 'Yes') : false,
      // When 'Membership?' column is missing (e.g., membersbeta.csv), treat all rows as memberships
      membership: membershipIdx !== -1 ? (parts[membershipIdx]?.replace(/"/g, '') === 'Yes') : true,
      // When 'Canceled?' column is missing (e.g., membersbeta.csv), infer cancellation from End Date
      canceled: canceledIdx !== -1 ? 
        (parts[canceledIdx]?.replace(/"/g, '') === 'Yes') : 
        !!(parts[idx('End Date')]?.replace(/"/g, '').trim()),
      clientFirstPlan: clientFirstPlanIdx !== -1 ? (parts[clientFirstPlanIdx]?.replace(/"/g, '') === 'Yes') : false,
      clientFirstMembership: clientFirstMembershipIdx !== -1 ? (parts[clientFirstMembershipIdx]?.replace(/"/g, '') === 'Yes') : false,
      clientHomeLocation: parts[idx('Client\'s Home Location')]?.replace(/"/g, '') || '',
      clientId: parts[idx('Client ID')]?.replace(/"/g, '') || '',
      planId: parts[idx('Plan ID')]?.replace(/"/g, '') || '',
    });
  }
  return out;
}

export function loadPayments(): PaymentRecord[] {
  return loadPaymentsFromFile('payments.csv');
}

export function loadMembers(filename: string = 'memberships_all.csv'): MemberRecord[] {
  return loadMembersFromFile(filename);
}


export function aggregateMonthlyMemberships(members: MemberRecord[]): MonthlyMembership[] {
  const monthlyData = new Map<string, { newMemberships: number; canceledMemberships: number }>();
  const activeMemberships = new Set<string>();
  
  // Track all membership events
  const events: { month: string; type: 'start' | 'end'; clientId: string }[] = [];
  
  for (const member of members) {
    if (!member.membership || !member.startDate) continue;

    const start = parseMonthPacific(member.startDate);
    if (!start || start.year === 2021) continue;

    events.push({ month: start.month, type: 'start', clientId: member.clientId });

    if (member.endDate && member.canceled) {
      const end = parseMonthPacific(member.endDate);
      if (end && end.year > 2021) {
        events.push({ month: end.month, type: 'end', clientId: member.clientId });
      }
    }
  }
  
  // Sort events by month
  events.sort((a, b) => a.month.localeCompare(b.month));
  
  // Process events chronologically
  for (const event of events) {
    if (!monthlyData.has(event.month)) {
      monthlyData.set(event.month, { newMemberships: 0, canceledMemberships: 0 });
    }
    
    const monthData = monthlyData.get(event.month)!;
    
    if (event.type === 'start') {
      activeMemberships.add(event.clientId);
      monthData.newMemberships += 1;
    } else if (event.type === 'end') {
      activeMemberships.delete(event.clientId);
      monthData.canceledMemberships += 1;
    }
  }
  
  // Generate final result with cumulative active counts
  const sortedMonths = Array.from(monthlyData.keys()).sort();
  const result: MonthlyMembership[] = [];
  let cumulativeActive = 0;
  
  for (const month of sortedMonths) {
    const monthData = monthlyData.get(month)!;
    cumulativeActive += monthData.newMemberships - monthData.canceledMemberships;
    
    result.push({
      month,
      membershipCount: Math.max(0, cumulativeActive), // Ensure non-negative
      newMemberships: monthData.newMemberships,
      canceledMemberships: monthData.canceledMemberships,
    });
  }
  
  return result;
}

export function aggregateMonthly(payments: PaymentRecord[]): MonthlyRevenue[] {
  const map = new Map<string, { revenue: number; count: number }>();
  for (const p of payments) {
    if (!p.transactionAt) continue;
    const dateStr = p.transactionAt.split(' ')[0];
    const month = dateStr.slice(0,7); // YYYY-MM
    
    // Filter out 2021 data
    if (month.startsWith('2021')) continue;
    
    const current = map.get(month) || { revenue: 0, count: 0 };
    current.revenue += p.paymentAmount;
    current.count += 1;
    map.set(month, current);
  }
  return Array.from(map.entries())
    .map(([month, { revenue, count }]) => ({ month, revenue, count }))
    .sort((a,b) => a.month.localeCompare(b.month));
}

export function filterDataByDateRange(data: MonthlyRevenue[], startMonth: string, endMonth: string): MonthlyRevenue[] {
  return data.filter(item => item.month >= startMonth && item.month <= endMonth);
}

export function getAvailableMonths(data: MonthlyRevenue[]): string[] {
  return data.map(item => item.month).sort();
}

export function loadMonthlyRevenue(): MonthlyRevenue[] {
  return aggregateMonthly(loadPayments());
}

export function loadLocationData(): {
  allData: MonthlyRevenue[];
  losGatosData: MonthlyRevenue[];
  pleasantonData: MonthlyRevenue[];
} {
  const allPayments = loadPaymentsFromFile('payments.csv');
  
  // Filter payments by location
  const losGatosPayments = allPayments.filter(p => 
    p.payerHomeLocation && p.payerHomeLocation.includes('Los Gatos')
  );
  
  const pleasantonPayments = allPayments.filter(p => 
    p.payerHomeLocation && p.payerHomeLocation.includes('Pleasanton')
  );

  return {
    allData: aggregateMonthly(allPayments),
    losGatosData: aggregateMonthly(losGatosPayments),
    pleasantonData: aggregateMonthly(pleasantonPayments)
  };
}

export function loadMembershipData(filename: string = 'memberships_all.csv'): {
  allData: MonthlyMembership[];
  losGatosData: MonthlyMembership[];
  pleasantonData: MonthlyMembership[];
} {
  const allMembers = loadMembersFromFile(filename);
  
  // Filter members by location
  const losGatosMembers = allMembers.filter(m => 
    m.clientHomeLocation && m.clientHomeLocation.includes('Los Gatos')
  );
  
  const pleasantonMembers = allMembers.filter(m => 
    m.clientHomeLocation && m.clientHomeLocation.includes('Pleasanton')
  );

  return {
    allData: aggregateMonthlyMemberships(allMembers),
    losGatosData: aggregateMonthlyMemberships(losGatosMembers),
    pleasantonData: aggregateMonthlyMemberships(pleasantonMembers)
  };
}

// Aggregate revenue per month, broken down by exact transaction amount value (rounded to nearest integer dollar)
export function aggregateMonthlyAmountBreakdown(payments: PaymentRecord[]): MonthlyAmountBreakdown[] {
  const map = new Map<string, { amounts: Record<string, number>; total: number }>();
  for (const p of payments) {
    if (!p.transactionAt) continue;
    const dateStr = p.transactionAt.split(' ')[0];
    const month = dateStr.slice(0, 7); // YYYY-MM
    if (month.startsWith('2021')) continue; // keep consistency with other aggregations

    // Use rounded whole dollars to form amount buckets, like '55'
    const amtKey = String(Math.round(p.paymentAmount));
    const group = map.get(month) || { amounts: {}, total: 0 };
    group.amounts[amtKey] = (group.amounts[amtKey] || 0) + p.paymentAmount;
    group.total += p.paymentAmount;
    map.set(month, group);
  }
  return Array.from(map.entries())
    .map(([month, { amounts, total }]) => ({ month, amounts, total }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function loadMonthlyAmountBreakdown(): MonthlyAmountBreakdown[] {
  const payments = loadPayments();
  return aggregateMonthlyAmountBreakdown(payments);
}

// Aggregate membership active counts by program per month
export function aggregateMonthlyProgramBreakdown(members: MemberRecord[]): MonthlyProgramBreakdown[] {
  // Build events by client and program
  type Event = { month: string; type: 'start' | 'end'; clientId: string; program: string };
  const events: Event[] = [];

  for (const m of members) {
    if (!m.membership || !m.startDate) continue;
    const start = parseMonthPacific(m.startDate);
    if (!start || start.year === 2021) continue;
    const program = (m.planName || 'Unknown').trim();
    events.push({ month: start.month, type: 'start', clientId: m.clientId, program });

    if (m.endDate && m.canceled) {
      const end = parseMonthPacific(m.endDate);
      if (end && end.year > 2021) {
        events.push({ month: end.month, type: 'end', clientId: m.clientId, program });
      }
    }
  }

  events.sort((a, b) => a.month.localeCompare(b.month));

  // Track active memberships per client per program
  const activeByProgram = new Map<string, Set<string>>();
  const monthList = Array.from(new Set(events.map(e => e.month))).sort();
  const result: MonthlyProgramBreakdown[] = [];

  for (const month of monthList) {
    // Apply all events for this month
    const monthEvents = events.filter(e => e.month === month);
    for (const e of monthEvents) {
      const set = activeByProgram.get(e.program) || new Set<string>();
      if (e.type === 'start') set.add(e.clientId);
      if (e.type === 'end') set.delete(e.clientId);
      activeByProgram.set(e.program, set);
    }

    // Snapshot counts by program
    const programs: Record<string, number> = {};
    let total = 0;
    for (const [prog, set] of activeByProgram.entries()) {
      const n = set.size;
      if (n > 0) {
        programs[prog] = n;
        total += n;
      }
    }
    result.push({ month, programs, total });
  }

  return result;
}

export function loadMonthlyProgramBreakdown(filename: string = 'memberships_all.csv') {
  const allMembers = loadMembersFromFile(filename);
  const losGatosMembers = allMembers.filter(m => m.clientHomeLocation && m.clientHomeLocation.includes('Los Gatos'));
  const pleasantonMembers = allMembers.filter(m => m.clientHomeLocation && m.clientHomeLocation.includes('Pleasanton'));

  return {
    allData: aggregateMonthlyProgramBreakdown(allMembers),
    losGatosData: aggregateMonthlyProgramBreakdown(losGatosMembers),
    pleasantonData: aggregateMonthlyProgramBreakdown(pleasantonMembers),
  };
}

export function loadLocationAmountBreakdown(): {
  allData: MonthlyAmountBreakdown[];
  losGatosData: MonthlyAmountBreakdown[];
  pleasantonData: MonthlyAmountBreakdown[];
} {
  const allPayments = loadPaymentsFromFile('payments.csv');
  const losGatosPayments = allPayments.filter(p => p.payerHomeLocation && p.payerHomeLocation.includes('Los Gatos'));
  const pleasantonPayments = allPayments.filter(p => p.payerHomeLocation && p.payerHomeLocation.includes('Pleasanton'));
  return {
    allData: aggregateMonthlyAmountBreakdown(allPayments),
    losGatosData: aggregateMonthlyAmountBreakdown(losGatosPayments),
    pleasantonData: aggregateMonthlyAmountBreakdown(pleasantonPayments),
  };
}
