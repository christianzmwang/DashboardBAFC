'use client';
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MonthlyMembership } from '../lib/clientUtils';

interface MembershipChartProps {
  data: MonthlyMembership[];
  title?: string;
  color?: string; // base color for gradient end
}

export function MembershipChart({ data, title = 'Membership Overview', color = '#1d4ed8' }: MembershipChartProps) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const svg = d3.select(el);
    svg.selectAll('*').remove();

    if (!data || !data.length) return;

    const width = el.clientWidth || 800;
    const height = 400;
    const margin = { top: 24, right: 32, bottom: 72, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Tooltip (reuse class pattern from revenue chart for consistency)
    const tooltip = d3.select('body')
      .selectAll('.membership-chart-tooltip')
      .data([1])
      .join('div')
      .attr('class', 'membership-chart-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0,0,0,0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', '1000');

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.month))
      .range([0, innerWidth])
      .padding(0.15);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.membershipCount)! * 1.1])
      .range([innerHeight, 0])
      .nice();

    const endColor = d3.color(color) || d3.color('#1d4ed8')!;
    const startColor = endColor.brighter(1.2).formatHex();
    const colorScale = d3.scaleLinear<string>()
      .domain([0, d3.max(data, d => d.membershipCount)!])
      .range([startColor, endColor.formatHex()]);

    // Safe month/year formatter to avoid Date timezone pitfalls
    const formatMonthYear = (m: string) => {
      const [yStr, mStr] = m.split('-');
      const year = Number(yStr);
      const month = Number(mStr);
      if (!year || !month || month < 1 || month > 12) return m;
      const names = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
      ];
      return `${names[month - 1]} ${year}`;
    };

    const formatMonthLabel = (m: string) => {
      const [year, month] = m.split('-');
      const num = String(parseInt(month));
      return month === '01' ? `${num} ${year}` : num;
    };

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat(d => formatMonthLabel(String(d))))
      .selectAll('text')
      .attr('transform', 'rotate(-35)')
      .style('text-anchor', 'end');

    g.append('g')
      .call(d3.axisLeft(y).tickFormat(d => `${d}` as any));

    // Grid lines
    g.selectAll('.grid-line')
      .data(y.ticks())
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', '#9ca3af')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.8);

    const bar = g.selectAll('.bar')
      .data(data)
      .enter()
      .append('g');

    bar.append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.month)!)
      .attr('y', d => y(d.membershipCount))
      .attr('width', x.bandwidth())
      .attr('height', d => innerHeight - y(d.membershipCount))
      .attr('fill', d => colorScale(d.membershipCount))
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).style('opacity', 0.85);
        tooltip
          .style('opacity', 1)
          .html(`
            <div><strong>${formatMonthYear(d.month)}</strong></div>
            <div>Active Members: ${d.membershipCount}</div>
            <div>New: ${d.newMemberships}</div>
            <div>Canceled: ${d.canceledMemberships}</div>
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mousemove', function(event) {
        tooltip
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 1);
        tooltip.style('opacity', 0);
      });

    bar.append('text')
      .attr('x', d => x(d.month)! + x.bandwidth()/2)
      .attr('y', d => y(d.membershipCount) - 6)
      .attr('text-anchor', 'middle')
      .attr('class', 'fill-current text-xs')
      .style('opacity', 0)
      .text(d => d.membershipCount.toLocaleString());

    bar.each(function(d) {
      const barHeight = innerHeight - y(d.membershipCount);
      const textElement = d3.select(this).select('text');
      if (barHeight > 30 && data.length <= 24) {
        textElement.style('opacity', 1);
      }
    });
  }, [data, color]);

  if (!data || !data.length) {
    return (
      <div className="w-full">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>
        <div className="w-full h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">No membership data available for this period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>
      <div className="w-full overflow-x-auto bg-gray-50 rounded-lg p-2">
        <svg ref={ref} className="w-full h-[400px]"></svg>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-lg font-semibold text-blue-700">{data[data.length - 1]?.membershipCount || 0}</div>
          <div className="text-sm text-blue-600">Current Members</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-lg font-semibold text-green-700">{data.reduce((sum, item) => sum + item.newMemberships, 0)}</div>
          <div className="text-sm text-green-600">Total New Members</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-lg font-semibold text-red-700">{data.reduce((sum, item) => sum + item.canceledMemberships, 0)}</div>
          <div className="text-sm text-red-600">Total Canceled</div>
        </div>
      </div>
    </div>
  );
}
