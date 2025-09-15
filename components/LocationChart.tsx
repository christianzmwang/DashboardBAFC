'use client';
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { MonthlyRevenue } from '../lib/clientUtils';

interface Props {
  data: MonthlyRevenue[];
  title: string;
  color?: string;
}

export const LocationChart: React.FC<Props> = ({ data, title, color = '#1d4ed8' }) => {
  const ref = useRef<SVGSVGElement | null>(null);
  
  useEffect(() => {
    if (!ref.current) return;
    
    const el = ref.current;
    const svg = d3.select(el);
    svg.selectAll('*').remove();

    if (!data.length) return;
    
    const width = el.clientWidth || 600;
    const height = 300;
    const margin = { top: 24, right: 32, bottom: 48, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create tooltip
    const tooltip = d3.select('body')
      .selectAll('.location-chart-tooltip')
      .data([1])
      .join('div')
      .attr('class', 'location-chart-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
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

    const months = data.map(d => d.month);
  const x = d3.scaleBand()
      .domain(months)
      .range([0, innerWidth])
      .padding(0.15);
    const maxRevenue = d3.max(data, (d: MonthlyRevenue) => d.revenue) || 0;
    const y = d3.scaleLinear()
      .domain(maxRevenue === 0 ? [0, 1] : [0, maxRevenue * 1.1])
      .range([innerHeight, 0])
      .nice();
    const colorScale = d3.scaleLinear<string>()
      .domain([0, maxRevenue || 1])
      .range([d3.color(color)!.brighter(1).toString(), color]);

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

    g.append('g').call(d3.axisLeft(y).tickFormat((d: d3.NumberValue) => `$${Number(d).toLocaleString()}`));

    // Add horizontal grid lines
    g.selectAll('.grid-line')
      .data(y.ticks())
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d: d3.NumberValue) => y(Number(d)))
      .attr('y2', (d: d3.NumberValue) => y(Number(d)))
      .attr('stroke', '#9ca3af')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.8);

  const barData = data.filter(d => d.revenue > 0);
  const bar = g.selectAll('.bar').data(barData).enter().append('g');

    bar.append('rect')
      .attr('class', 'bar')
      .attr('x', (d: MonthlyRevenue) => x(d.month)!)
      .attr('y', (d: MonthlyRevenue) => y(d.revenue))
      .attr('width', x.bandwidth())
      .attr('height', (d: MonthlyRevenue) => innerHeight - y(d.revenue))
      .attr('fill', (d: MonthlyRevenue) => colorScale(d.revenue))
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

    // Add text labels that are conditionally shown based on space
    bar.append('text')
      .attr('class', 'bar-label')
      .attr('x', (d: MonthlyRevenue) => x(d.month)! + x.bandwidth()/2)
      .attr('y', (d: MonthlyRevenue) => y(d.revenue) - 6)
      .attr('text-anchor', 'middle')
      .attr('class', 'fill-current text-xs')
      .style('opacity', 0)
      .text((d: MonthlyRevenue) => `$${Math.round(d.revenue).toLocaleString()}`);

    // Show/hide labels based on available space and number of data points
    bar.each(function(d, i) {
      const barHeight = innerHeight - y(d.revenue);
      const textElement = d3.select(this).select('text');
      
      // Only show text labels if there's enough space (bar is tall enough) and 12 months or fewer of data
      if (barHeight > 25 && data.length <= 12) {
        textElement.style('opacity', 1);
      }
    });

    if (maxRevenue === 0) {
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('class', 'fill-gray-500 text-sm')
        .text('No revenue for selected range');
    }

  }, [data, color]);

  if (!data.length) {
    return (
      <div className="w-full">
        <h3 className="text-lg font-semibold mb-2 text-center">{title}</h3>
        <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium">No data available</p>
            <p className="text-sm">No revenue data for this location in the selected time period</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-2 text-center">{title}</h3>
      <div className="w-full overflow-x-auto">
        <svg ref={ref} className="w-full h-[300px]"></svg>
      </div>
    </div>
  );
};
