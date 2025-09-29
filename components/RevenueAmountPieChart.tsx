'use client';
import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { MonthlyAmountBreakdown } from '../lib/clientUtils';
import { amountLegendPalette } from './RevenueAmountBreakdownChart';

interface RevenueAmountPieChartProps {
  breakdown?: MonthlyAmountBreakdown; // specific month breakdown
  legendKeys: string[]; // ordered legend keys including optional 'Other'
  title: string;
  height?: number;
  showTotalBelowTitle?: boolean; // if true, render total under title instead of inside pie center
  onSliceClick?: (info: { amountKey: string; value: number; month: string }) => void;
}

// Pie chart to show composition of revenue by transaction amount for a single month.
export const RevenueAmountPieChart: React.FC<RevenueAmountPieChartProps> = ({
  breakdown,
  legendKeys,
  title,
  height = 260,
  showTotalBelowTitle = false,
  onSliceClick,
}) => {
  const ref = useRef<SVGSVGElement | null>(null);

  const { data, total } = useMemo(() => {
    if (!breakdown) return { data: [] as Array<{ key: string; value: number }>, total: 0 };
    const amounts = breakdown.amounts || {};
    const topKeys = legendKeys.filter(k => k !== 'Other');
    const rows: Array<{ key: string; value: number }> = [];
    let other = 0;
    for (const [k, v] of Object.entries(amounts)) {
      if (topKeys.includes(k)) {
        rows.push({ key: k, value: v });
      } else {
        other += v;
      }
    }
    if (other > 0 && legendKeys.includes('Other')) rows.push({ key: 'Other', value: other });
    // Sort rows to match legendKeys ordering
    rows.sort((a, b) => legendKeys.indexOf(a.key) - legendKeys.indexOf(b.key));
    const total = rows.reduce((s, r) => s + r.value, 0);
    return { data: rows, total };
  }, [breakdown, legendKeys]);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    const width = ref.current.clientWidth || 320;
    const h = height;
  const radius = Math.min(width, h) / 2 - 8; // padding for labels
    const g = svg
      .attr('viewBox', `0 0 ${width} ${h}`)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${h / 2})`);

    if (total === 0) {
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('class', 'fill-gray-500 text-sm')
        .text('No revenue');
      return;
    }

    const color = d3.scaleOrdinal<string, string>()
      .domain(legendKeys)
      .range(legendKeys.map((_, i) => amountLegendPalette[i % amountLegendPalette.length]));

    const pie = d3.pie<{ key: string; value: number }>()
      .sort((a, b) => legendKeys.indexOf(a.key) - legendKeys.indexOf(b.key))
      .value(d => d.value);

    const arc = d3.arc<d3.PieArcDatum<{ key: string; value: number }>>()
      .innerRadius(0)
      .outerRadius(radius);

    const arcs = g.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc as any)
      .attr('fill', d => color(d.data.key))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer');

    // Tooltip
    const tooltip = d3.select('body')
      .selectAll('.chart-tooltip')
      .data([1])
      .join('div')
      .attr('class', 'chart-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0,0,0,0.8)')
      .style('color', '#fff')
      .style('padding', '6px 10px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000);

    arcs
      .on('mouseover', function (event, d) {
        const pct = total > 0 ? (d.data.value / total) * 100 : 0;
        d3.select(this).style('opacity', 0.85);
        tooltip
          .style('opacity', 1)
          .html(`<div><strong>${d.data.key === 'Other' ? 'Other' : '$' + d.data.key}</strong></div><div>$${Math.round(d.data.value).toLocaleString()} (${pct.toFixed(1)}%)</div>${onSliceClick ? '<div style=\"opacity:0.85\">Click to view transactions</div>' : ''}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mousemove', function (event) {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function () {
        d3.select(this).style('opacity', 1);
        tooltip.style('opacity', 0);
      })
      .on('click', function (_, d) {
        if (!onSliceClick) return;
        const month = breakdown?.month || '';
        onSliceClick({ amountKey: d.data.key, value: d.data.value, month });
      });

    if (!showTotalBelowTitle) {
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 4)
        .attr('class', 'fill-gray-700 dark:fill-gray-300 text-sm font-medium')
        .text(`$${Math.round(total).toLocaleString()}`);
    }
  }, [data, legendKeys, total, height, showTotalBelowTitle, onSliceClick, breakdown]);

  return (
    <div className="w-full overflow-hidden">
      <div className="mb-2">
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h5>
        {showTotalBelowTitle && (
          <div className="text-xs mt-0.5 text-gray-600 dark:text-gray-400 font-medium">
            {breakdown && breakdown.total > 0 ? `$${Math.round(breakdown.total).toLocaleString()}` : '$0'}
          </div>
        )}
      </div>
      <div className="w-full h-full">
        <svg ref={ref} className="w-full" style={{ height }} />
      </div>
      {data.length > 0 && (
        <div className="mt-4 overflow-hidden">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {legendKeys.map((k, i) => {
              const row = data.find(d => d.key === k);
              if (!row) return null; // Only show keys present for this month
              const pct = total > 0 ? (row.value / total) * 100 : 0;
              return (
                <li
                  key={k}
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => {
                    if (onSliceClick && breakdown) onSliceClick({ amountKey: k, value: row.value, month: breakdown.month });
                  }}
                  title="Filter by this amount"
                >
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: amountLegendPalette[i % amountLegendPalette.length] }} />
                  <span>{k === 'Other' ? 'Other' : `$${k}`} {pct >= 3 ? `(${pct.toFixed(1)}%)` : ''}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RevenueAmountPieChart;
