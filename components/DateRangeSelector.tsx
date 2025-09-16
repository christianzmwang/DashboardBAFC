'use client';
import React from 'react';

interface Props {
  startMonth: string;
  endMonth: string;
  availableMonths: string[];
  onStartMonthChange: (month: string) => void;
  onEndMonthChange: (month: string) => void;
}

export const DateRangeSelector: React.FC<Props> = ({
  startMonth,
  endMonth,
  availableMonths,
  onStartMonthChange,
  onEndMonthChange
}) => {
  const formatMonthDisplay = (month: string) => {
    const [y, m] = month.split('-').map(Number);
    const dt = new Date(Date.UTC(y, (m || 1) - 1, 1));
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(dt);
  };

  const getQuickRangeButtons = () => {
    if (availableMonths.length === 0) return [];
    
    const firstMonth = availableMonths[0];
    const lastMonth = availableMonths[availableMonths.length - 1];
    
    const buttons = [
      { label: 'All Time', start: firstMonth, end: lastMonth }
    ];

    // Last 12 months - take the last 12 available months from the data
    if (availableMonths.length >= 12) {
      const last12MonthsStart = availableMonths[availableMonths.length - 12];
      buttons.push({ label: 'Last 12 Months', start: last12MonthsStart, end: lastMonth });
    } else if (availableMonths.length > 0) {
      // If we have less than 12 months, show all available
      buttons.push({ label: `Last ${availableMonths.length} Months`, start: firstMonth, end: lastMonth });
    }

    // Last 6 months - take the last 6 available months from the data
    if (availableMonths.length >= 6) {
      const last6MonthsStart = availableMonths[availableMonths.length - 6];
      buttons.push({ label: 'Last 6 Months', start: last6MonthsStart, end: lastMonth });
    } else if (availableMonths.length > 0 && availableMonths.length < 6) {
      // If we have less than 6 months, this will be the same as "All Time", so don't add it
    }

    return buttons;
  };

  const getYearRangeButtons = () => {
    if (availableMonths.length === 0) return [];
    
    // Get all unique years from available months
    const years = [...new Set(availableMonths.map(month => month.split('-')[0]))].sort().reverse();
    
    return years.map(year => {
      const yearMonths = availableMonths.filter(m => m.startsWith(year));
      return {
        label: year,
        start: yearMonths[0],
        end: yearMonths[yearMonths.length - 1]
      };
    });
  };

  const quickRanges = getQuickRangeButtons();
  const yearRanges = getYearRangeButtons();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Filter by Date Range</h2>
      
      {/* Quick Range Buttons */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Ranges</h3>
        <div className="flex flex-wrap gap-2">
          {quickRanges.map((range) => (
            <button
              key={range.label}
              onClick={() => {
                onStartMonthChange(range.start);
                onEndMonthChange(range.end);
              }}
              className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                startMonth === range.start && endMonth === range.end
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Year Range Buttons */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">By Year</h3>
        <div className="flex flex-wrap gap-2">
          {yearRanges.map((range) => (
            <button
              key={range.label}
              onClick={() => {
                onStartMonthChange(range.start);
                onEndMonthChange(range.end);
              }}
              className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                startMonth === range.start && endMonth === range.end
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Range Selectors */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-month" className="block text-sm font-medium text-gray-700 mb-2">
            Start Month
          </label>
          <select
            id="start-month"
            value={startMonth}
            onChange={(e) => onStartMonthChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {formatMonthDisplay(month)}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="end-month" className="block text-sm font-medium text-gray-700 mb-2">
            End Month
          </label>
          <select
            id="end-month"
            value={endMonth}
            onChange={(e) => onEndMonthChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableMonths.filter(month => month >= startMonth).map(month => (
              <option key={month} value={month}>
                {formatMonthDisplay(month)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        Showing data from {formatMonthDisplay(startMonth)} to {formatMonthDisplay(endMonth)}
      </div>
    </div>
  );
};
