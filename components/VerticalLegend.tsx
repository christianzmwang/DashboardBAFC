'use client';
import React from 'react';

interface VerticalLegendProps {
  keys: string[];
  palette: string[];
  labelFormatter?: (key: string) => string;
  className?: string; // container className overrides/extends defaults
  columns?: number; // number of columns for legend items (defaults to 1)
}

/**
 * Vertical, scrollable legend list.
 * - Renders color swatches mapped by index into provided palette
 * - Designed for potentially long lists; scrolls vertically
 */
export const VerticalLegend: React.FC<VerticalLegendProps> = ({
  keys,
  palette,
  labelFormatter,
  className = '',
  columns = 1,
}) => {
  if (!keys || keys.length === 0) return null;

  return (
  <div className={`h-16 overflow-y-auto border border-gray-200 dark:border-gray-700 bg-white dark:bg-black ${className}`}>
      <ul
        className={
          columns > 1
            ? `grid ${columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-4'} gap-x-4 gap-y-1 pr-2 pl-2`
            : 'space-y-1 pr-2 pl-2'
        }
      >
        {keys.map((k, i) => (
          <li key={k} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 h-5">
            <span
              className="inline-block w-3 h-3 flex-shrink-0"
              style={{ backgroundColor: palette[i % palette.length] }}
              aria-hidden
            />
            <span className="truncate" title={labelFormatter ? labelFormatter(k) : k}>
              {labelFormatter ? labelFormatter(k) : k}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VerticalLegend;
