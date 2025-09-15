'use client';
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MonthlyRevenue } from '../lib/clientUtils';

interface Props {
  data: MonthlyRevenue[];
}

export const RevenueChart: React.FC<Props> = ({ data }) => {
  const ref = useRef<SVGSVGElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const width = el.clientWidth || 800;
    const height = 400;
    const margin = { top: 24, right: 32, bottom: 48, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(el);
    svg.selectAll('*').remove();

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create tooltip
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

    const months = data.map(d => d.month);
  const x = d3.scaleBand()
      .domain(months)
      .range([0, innerWidth])
      .padding(0.15);
    const maxRevenue = d3.max(data, d => d.revenue) || 0;
    const y = d3.scaleLinear()
      .domain(maxRevenue === 0 ? [0, 1] : [0, maxRevenue * 1.1])
      .range([innerHeight, 0])
      .nice();
    const color = d3.scaleLinear<string>()
      .domain([0, maxRevenue || 1])
      .range(['#bfdbfe', '#1d4ed8']);

    const formatMonthLabel = (m: string) => {
      const [year, month] = m.split('-');
      const num = String(parseInt(month));
      return month === '01' ? `${num} ${year}` : num; // numeric month, add year on January
    };

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickFormat(d => formatMonthLabel(String(d))))
      .selectAll('text')
      .attr('transform', 'rotate(-35)')
      .style('text-anchor', 'end');

    g.append('g').call(d3.axisLeft(y).tickFormat(d => `$${Number(d).toLocaleString()}` as any));

    // Add horizontal grid lines
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

  const barData = data.filter(d => d.revenue > 0);
  const bar = g.selectAll('.bar').data(barData).enter().append('g');

    bar.append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.month)!)
      .attr('y', d => y(d.revenue))
      .attr('width', x.bandwidth())
      .attr('height', d => innerHeight - y(d.revenue))
      .attr('fill', d => color(d.revenue))
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).style('opacity', 0.8);
        tooltip
          .style('opacity', 1)
          .html(`
            <div><strong>${new Date(d.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</strong></div>
            <div>Revenue: $${Math.round(d.revenue).toLocaleString()}</div>
            <div>Transactions: ${d.count}</div>
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

    // Add text labels that are hidden by default, shown on hover
    bar.append('text')
      .attr('class', 'bar-label')
      .attr('x', d => x(d.month)! + x.bandwidth()/2)
      .attr('y', d => y(d.revenue) - 6)
      .attr('text-anchor', 'middle')
      .attr('class', 'fill-current text-xs')
      .style('opacity', 0)
      .text(d => `$${Math.round(d.revenue).toLocaleString()}`);

    // Show/hide labels based on available space and number of data points
    bar.each(function(d, i) {
      const barHeight = innerHeight - y(d.revenue);
      const textElement = d3.select(this).select('text');
      
      // Show text labels if there's enough space AND 24 bars or fewer
      // When showing numbers, show them for ALL bars, not just the last 12
      if (barHeight > 30 && data.length <= 24) {
        textElement.style('opacity', 1);
      }
    });

    // If all months are zero, optionally show centered message
    if (maxRevenue === 0) {
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('class', 'fill-gray-500 text-sm')
        .text('No revenue for selected range');
    }

  }, [data]);

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={ref} className="w-full h-[400px]"></svg>
    </div>
  );
};
