'use client';
import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { MonthlyProgramBreakdown } from '../lib/clientUtils';

interface Props {
  data: MonthlyProgramBreakdown[];
  topN?: number; // number of top program categories to display, rest grouped as Other (ignored when showAllCategories=true)
  showLegend?: boolean; // whether to render internal legend inside the SVG
  showAllCategories?: boolean; // when true, label all categories explicitly and never group into 'Other'
}

export const programLegendPalette = d3.schemeTableau10.concat([
  '#a78bfa',
  '#34d399',
  '#f59e0b',
  '#ef4444',
]);

export function computeProgramLegendKeys(
  data: MonthlyProgramBreakdown[],
  topN: number = 6
): string[] {
  const sumByKey = new Map<string, number>();
  data.forEach(d => {
    for (const [k, v] of Object.entries(d.programs)) {
      sumByKey.set(k, (sumByKey.get(k) || 0) + v);
    }
  });
  const topKeys = Array.from(sumByKey.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([k]) => k);

  // Determine if 'Other' exists
  let hasOther = false;
  for (const d of data) {
    let other = 0;
    for (const [k, v] of Object.entries(d.programs)) {
      if (!topKeys.includes(k)) other += v;
    }
    if (other > 0) { hasOther = true; break; }
  }
  return hasOther ? [...topKeys, 'Other'] : topKeys;
}

export const MembershipProgramBreakdownChart: React.FC<Props> = ({ data, topN = 6, showLegend = true, showAllCategories = true }) => {
  const ref = useRef<SVGSVGElement | null>(null);

  const { months, keys, stackedData, totals } = useMemo(() => {
    const months = data.map(d => d.month);
    let keys: string[];
    let rows: Array<Record<string, number>>;

    if (showAllCategories) {
      // Use all categories across the provided data, ordered by total contribution desc
      const sumByKey = new Map<string, number>();
      data.forEach(d => {
        for (const [k, v] of Object.entries(d.programs)) {
          sumByKey.set(k, (sumByKey.get(k) || 0) + v);
        }
      });
      keys = Array.from(sumByKey.entries()).sort((a, b) => b[1] - a[1]).map(([k]) => k);
      rows = data.map(d => {
        const row: Record<string, number> = {};
        for (const k of keys) {
          if (d.programs[k]) row[k] = d.programs[k];
        }
        return row;
      });
    } else {
      const topKeys = computeProgramLegendKeys(data, topN).filter(k => k !== 'Other');
      rows = data.map(d => {
        const row: Record<string, number> = {};
        let other = 0;
        for (const [k, v] of Object.entries(d.programs)) {
          if (topKeys.includes(k)) row[k] = v; else other += v;
        }
        if (other > 0) row['Other'] = other;
        return row;
      });
      keys = computeProgramLegendKeys(data, topN);
    }

    const stacked = d3.stack<Record<string, number>>()
      .keys(keys)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone)(rows);

    const totals = data.map(d => d.total);
    return { months, keys, stackedData: stacked, totals };
  }, [data, topN, showAllCategories]);

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

    const palette = programLegendPalette;
    const color = d3.scaleOrdinal<string, string>()
      .domain(keys)
      .range(keys.map((_, i) => palette[i % palette.length]));

    let legendGap = 8;
    if (showLegend && keys.length > 0) {
      const legend = g.append('g').attr('transform', `translate(0, 0)`);
      const itemsPerRow = Math.max(1, keys.length);
      const itemWidth = innerWidth / itemsPerRow;
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
        .text(k => (k === 'Other' ? 'Other' : k));
      legendGap = 16 + 22;
    }

    const plot = g.append('g').attr('transform', `translate(0, ${legendGap})`);

    // Friendly month formatter without constructing Date objects
    const formatMonthYear = (m: string) => {
      const [yStr, mStr] = m.split('-');
      const year = Number(yStr);
      const month = Number(mStr);
      if (!year || !month || month < 1 || month > 12) return m;
      const names = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      return `${names[month - 1]} ${year}`;
    };

    const x = d3.scaleBand<string>()
      .domain(months)
      .range([0, innerWidth])
      .padding(0.15);

    const maxTotal = d3.max(totals) || 0;
    const y = d3.scaleLinear()
      .domain(maxTotal === 0 ? [0, 1] : [0, maxTotal * 1.1])
      .range([innerHeight, 0])
      .nice();

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

    plot.append('g').call(d3.axisLeft(y).tickFormat(d => `${Number(d).toLocaleString()}` as any));

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

    const tooltip = d3.select('body')
      .selectAll('.program-chart-tooltip')
      .data([1])
      .join('div')
      .attr('class', 'program-chart-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', '1000');

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
        const label = d.key === 'Other' ? 'Other' : d.key;
        const value = d.data[1] - d.data[0];
        d3.select(this).style('opacity', 0.85);
        tooltip
          .style('opacity', 1)
          .html(`<div><strong>${formatMonthYear(month)}</strong></div><div>${label}: ${Math.round(value).toLocaleString()}</div>`)
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
        .text('No memberships for selected range');
    }
  }, [months, keys, stackedData, totals, showLegend, showAllCategories]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={ref} className="w-full h-[420px]"></svg>
    </div>
  );
};
