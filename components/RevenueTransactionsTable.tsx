"use client";
import React from 'react';
import { PaymentRow, RevenueFilters } from '../lib/clientUtils';

interface Props {
  transactions: PaymentRow[];
  filters: RevenueFilters;
  onClearFilters: () => void;
  visibleCount: number;
}

const formatCurrency = (value: number) => `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (isoDate: string) => {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d));
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(dt);
};

export const RevenueTransactionsTable: React.FC<Props> = ({ transactions, filters, onClearFilters, visibleCount }) => {
  const hasFilters = Boolean(filters.month || filters.location || filters.amountKey);
  const sorted = React.useMemo(() => {
    return [...transactions].sort((a, b) => (a.transactionAt > b.transactionAt ? -1 : 1));
  }, [transactions]);

  const clampedVisibleCount = React.useMemo(() => Math.min(visibleCount, sorted.length), [visibleCount, sorted.length]);

  const visibleTransactions = React.useMemo(() => {
    return sorted.slice(0, clampedVisibleCount);
  }, [sorted, clampedVisibleCount]);

  const totalAmount = React.useMemo(() => sorted.reduce((sum, t) => sum + (t.paymentAmount || 0), 0), [sorted]);

  const activeFilters = React.useMemo(() => {
    const items: Array<{ label: string; value: string }> = [];
    if (filters.month) items.push({ label: 'Month', value: filters.month });
    if (filters.location) items.push({ label: 'Location', value: filters.location });
    if (filters.amountKey) items.push({ label: 'Amount', value: filters.amountKey === 'Other' ? 'Other amounts' : `$${filters.amountKey}` });
    return items;
  }, [filters]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Transactions</h3>
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2 text-xs bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
              {activeFilters.map(filter => (
                <span key={`${filter.label}-${filter.value}`} className="flex items-center gap-1">
                  <span>{filter.label}:</span>
                  <strong>{filter.value}</strong>
                </span>
              ))}
              <button
                onClick={onClearFilters}
                className="ml-1 px-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800"
                aria-label="Clear filters"
              >✕</button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
          <span>
            Showing {visibleTransactions.length.toLocaleString()} of {sorted.length.toLocaleString()} transactions
          </span>
          <span>•</span>
          <span>Total {formatCurrency(totalAmount)}</span>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[520px] border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Payer</th>
              <th className="px-3 py-2 text-left">Location</th>
              <th className="px-3 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {visibleTransactions.map((t, index) => (
              <tr
                key={`${t.invoiceNumber}-${t.transactionAt}-${index}`}
                className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
              >
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(t.transactionDate)}</td>
                <td className="px-3 py-2 whitespace-nowrap">{t.payer || '—'}</td>
                <td className="px-3 py-2 whitespace-nowrap">{t.payerHomeLocation || '—'}</td>
                <td className="px-3 py-2 text-right font-medium">{formatCurrency(t.paymentAmount)}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">No transactions match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
