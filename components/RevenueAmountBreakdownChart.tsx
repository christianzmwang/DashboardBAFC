'use client';
import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { MonthlyAmountBreakdown } from '../lib/clientUtils';

interface Props {
  data: MonthlyAmountBreakdown[];
  topN?: number; // number of top amount categories to display, rest grouped as Other
  showLegend?: boolean; // whether to render internal legend inside the SVG
}

// Shared palette for amount categories. Exported for external legends to match chart colors.
export const amountLegendPalette = d3.schemeTableau10.concat([
  '#a78bfa',
  '#34d399',
  '#f59e0b',
  '#ef4444',
]);

// Compute the ordered list of legend keys based on total contribution across the provided data
export function computeAmountLegendKeys(
  data: MonthlyAmountBreakdown[],
  topN: number = 6
): string[] {
  // Collect totals by key
  const sumByKey = new Map<string, number>();
  data.forEach(d => {
    for (const [k, v] of Object.entries(d.amounts)) {
      sumByKey.set(k, (sumByKey.get(k) || 0) + v);
    }
  });
  // First, select the topN keys by total contribution
  const selectedByContribution = Array.from(sumByKey.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([k]) => k);

  // Then order those selected keys ascending by their numeric amount (e.g., 5, 10, 20...)
  const toNum = (k: string) => {
    const n = parseFloat(k);
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
  };
  const topKeys = [...selectedByContribution].sort((a, b) => toNum(a) - toNum(b));

  // Determine if 'Other' exists
  let hasOther = false;
  for (const d of data) {
    let other = 0;
    for (const [k, v] of Object.entries(d.amounts)) {
      if (!topKeys.includes(k)) other += v;
    }
    if (other > 0) {
      hasOther = true;
      break;
    }
  }

  return hasOther ? [...topKeys, 'Other'] : topKeys;
}

export const RevenueAmountBreakdownChart: React.FC<Props> = ({ data, topN = 6, showLegend = true }) => {
  const ref = useRef<SVGSVGElement | null>(null);

  const { months, keys, stackedData, totals } = useMemo(() => {
    const months = data.map(d => d.month);

    // Collect all unique amount keys
    const allKeysSet = new Set<string>();
    data.forEach(d => Object.keys(d.amounts).forEach(k => allKeysSet.add(k)));

    // Pick topN by total contribution across all months
    const topKeys = computeAmountLegendKeys(data, topN).filter(k => k !== 'Other');

    // Build rows aligned to months with chosen keys plus 'Other' if present
    const rows = data.map(d => {
      const row: Record<string, number> = {};
      let other = 0;
      for (const k of Object.keys(d.amounts)) {
        const v = d.amounts[k];
        if (topKeys.includes(k)) {
          row[k] = v;
        } else {
          other += v;
        }
      }
      if (other > 0) row['Other'] = other;
      return row;
    });

    // Final list of keys shown in legend (stable order by contribution, with 'Other' last if present)
    const keys = computeAmountLegendKeys(data, topN);

    // Use d3.stack to compute stacked series
    const stacked = d3.stack<Record<string, number>>()
      .keys(keys)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone)(rows);

    const totals = data.map(d => d.total);
    return { months, keys, stackedData: stacked, totals };
  }, [data, topN]);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const width = el.clientWidth || 800;
    const height = 420;
    const margin = { top: 28, right: 24, bottom: 56, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(el);
    svg.selectAll('*').remove();
    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Color scale for keys (define before using in legend)
    const palette = amountLegendPalette;
    const color = d3.scaleOrdinal<string, string>()
      .domain(keys)
      .range(keys.map((_, i) => palette[i % palette.length]));

    // Optional legend at top within g
    let legendGap = 8; // minimal gap if legend is hidden
    if (showLegend && keys.length > 0) {
      const legend = g.append('g').attr('transform', `translate(0, 0)`);
      const itemsPerRow = Math.max(1, keys.length);
      const itemWidth = innerWidth / itemsPerRow;
      const legendRows = 1;
      const legendItem = legend.selectAll('.legend-item')
        .data(keys)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (_, i) => `translate(${(i % itemsPerRow) * itemWidth}, ${Math.floor(i / itemsPerRow) * 18})`);
      legendItem.append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', k => color(k))
        .attr('rx', 2);
      legendItem.append('text')
        .attr('x', 14)
        .attr('y', 9)
        .attr('class', 'text-xs fill-gray-700')
        .text(k => (k === 'Other' ? 'Other' : `$${k}`));

      // Add vertical gap below legend for readability
      legendGap = 16 + legendRows * 22;
    }
    const plot = g.append('g').attr('transform', `translate(0, ${legendGap})`);

    // X and Y scales
    const x = d3.scaleBand<string>()
      .domain(months)
      .range([0, innerWidth])
      .padding(0.15);

    const maxTotal = d3.max(totals) || 0;
    const y = d3.scaleLinear()
      .domain(maxTotal === 0 ? [0, 1] : [0, maxTotal * 1.1])
      .range([innerHeight, 0])
      .nice();

    // Axes
    const formatMonthLabel = (m: string) => {
      const [year, month] = m.split('-');
      const num = String(parseInt(month));
      return month === '01' ? `${num} ${year}` : num;
    };

    plot.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat(d => formatMonthLabel(String(d))))
      .selectAll('text')
      .attr('transform', 'rotate(-35)')
      .style('text-anchor', 'end');

    plot.append('g').call(d3.axisLeft(y).tickFormat(d => `$${Number(d).toLocaleString()}` as any));

    // Grid lines
    plot.selectAll('.grid-line')
      .data(y.ticks())
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');

    // Tooltip
    const tooltip = d3.select('body')
      .selectAll('.chart-tooltip')
      .data([1])
      .join('div')
      .attr('class', 'chart-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', '1000');

    // Draw stacks
    const series = plot.selectAll('.series')
      .data(stackedData)
      .enter()
      .append('g')
      .attr('class', 'series')
      .attr('fill', d => color(d.key));

    series.selectAll('rect')
      .data(d => d.map((v, i) => ({ key: (d as any).key as string, data: v, index: i })))
      .enter()
      .append('rect')
      .attr('x', (_, i) => x(months[i])!)
      .attr('y', ({ data }) => y(data[1]))
      .attr('height', ({ data }) => Math.max(0, y(data[0]) - y(data[1])))
      .attr('width', x.bandwidth())
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        const monthIdx = (d as any).index ?? 0;
        const month = months[monthIdx] || '';
        const amountLabel = d.key === 'Other' ? 'Other' : `$${d.key}`;
        const value = d.data[1] - d.data[0];
        d3.select(this).style('opacity', 0.85);
        tooltip
          .style('opacity', 1)
          .html(`<div><strong>${month}</strong></div><div>${amountLabel}: $${Math.round(value).toLocaleString()}</div>`)
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
      });

    if (maxTotal === 0) {
      plot.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('class', 'fill-gray-500 text-sm')
        .text('No revenue for selected range');
    }
  }, [months, keys, stackedData, totals, showLegend]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={ref} className="w-full h-[420px]"></svg>
    </div>
  );
};
