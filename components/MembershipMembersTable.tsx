"use client";
import React from 'react';
import { filterMembersByFilters, MemberRow, MembershipFilters } from '../lib/clientUtils';

interface Props {
  members: MemberRow[];
  filters: MembershipFilters;
  onClearFilters: () => void;
}

export const MembershipMembersTable: React.FC<Props> = ({ members, filters, onClearFilters }) => {
  const hasFilters = Boolean(filters.month || filters.program || filters.location);
  const filtered = React.useMemo(() => {
    if (!hasFilters) return members;
    return filterMembersByFilters(members, filters);
  }, [members, filters, hasFilters]);

  const activeFilters = React.useMemo(() => {
    const items: Array<{ label: string; value: string }> = [];
    if (filters.month) items.push({ label: 'Month', value: filters.month });
    if (filters.program) items.push({ label: 'Program', value: filters.program });
    if (filters.location) items.push({ label: 'Location', value: filters.location });
    return items;
  }, [filters]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Members</h3>
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
        <div className="text-xs text-gray-500 dark:text-gray-400">Showing {filtered.length} of {members.length}</div>
      </div>
      <div className="overflow-x-auto max-h-[480px] border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
            <tr className="text-left">
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">Program</th>
              <th className="px-3 py-2">Start</th>
              <th className="px-3 py-2">End</th>
              <th className="px-3 py-2">Location</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => {
              const baseRowClasses = i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800';
              return (
                <tr
                  key={`${m.clientId}-${i}`}
                  role={m.clientId ? 'button' : undefined}
                  tabIndex={m.clientId ? 0 : -1}
                  aria-label={m.clientId ? `Open profile for ${m.client}` : undefined}
                  onClick={() => {
                    if (m.clientId) window.open(`https://bayareafencing.pike13.com/people/${m.clientId}`,'_blank','noopener,noreferrer');
                  }}
                  onKeyDown={(e) => {
                    if (!m.clientId) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      window.open(`https://bayareafencing.pike13.com/people/${m.clientId}`,'_blank','noopener,noreferrer');
                    }
                  }}
                  className={`group ${baseRowClasses} hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition-colors`}
                >
                  <td className="px-3 py-2 font-medium whitespace-nowrap">
                    {/* Removed hover underline effect per request; color retained for affordance */}
                    <span className="text-blue-600 dark:text-blue-400">{m.client}</span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{m.planName || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{m.startDate?.slice(0,10) || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{m.endDate?.slice(0,10) || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{m.clientHomeLocation || '—'}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">No members match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
