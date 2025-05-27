import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { usePriceRangeStore } from '~/stores/priceRangeStore';

interface HistoricalDataPoint {
  time: number;
  price: number;
  volume: number;
}

interface InteractivePriceChartProps {
  width: number;
  height: number;
  historicalData: HistoricalDataPoint[];
  className?: string;
}

export const InteractivePriceChart = ({ width, height, historicalData, className = '' }: InteractivePriceChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { minPrice, maxPrice, currentPrice, isDragging, dragType, setPriceRange, setDragState } = usePriceRangeStore();

  const margin = { top: 15, right: 50, bottom: 70, left: 60 };
  const dynamicWidth = containerRef.current ? containerRef.current.clientWidth : width;
  const chartWidth = dynamicWidth - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const formatPrice = (price: number): string => {
    let maxDecimals: number;

    if (price >= 1000) {
      maxDecimals = 2;
    } else if (price >= 1) {
      maxDecimals = 4;
    } else if (price >= 0.01) {
      maxDecimals = 6;
    } else {
      maxDecimals = 8;
    }

    const formatted = price.toFixed(maxDecimals);
    const withoutTrailingZeros = parseFloat(formatted);

    return withoutTrailingZeros.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: maxDecimals,
    });
  };

  const getLabelWidth = (price: number): number => {
    const formattedPrice = formatPrice(price);
    return Math.max(50, formattedPrice.length * 7 + 10);
  };

  const drawChart = useCallback(() => {
    if (!svgRef.current || !historicalData || !Array.isArray(historicalData) || historicalData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    const glowFilter = defs.append('filter').attr('id', 'glow');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const shadowFilter = defs.append('filter').attr('id', 'shadow');
    shadowFilter.append('feDropShadow').attr('dx', 0).attr('dy', 2).attr('stdDeviation', 3).attr('flood-opacity', 0.3);

    const xScale = d3
      .scaleTime()
      .domain(d3.extent(historicalData, (d: HistoricalDataPoint) => new Date(d.time)) as [Date, Date])
      .range([0, chartWidth]);

    const isStablecoinData = historicalData.every((d) => d.price >= 0.95 && d.price <= 1.05);
    const historicalPriceExtent = d3.extent(historicalData, (d: HistoricalDataPoint) => d.price) as [number, number];

    let domainMin = historicalPriceExtent[0];
    let domainMax = historicalPriceExtent[1];

    if (isStablecoinData) {
      const center = (domainMin + domainMax) / 2;
      const minRange = 0.02;
      const currentRange = domainMax - domainMin;

      if (currentRange < minRange) {
        domainMin = center - minRange / 2;
        domainMax = center + minRange / 2;
      }
    }

    if (minPrice > 0 && maxPrice > 0) {
      domainMin = Math.min(domainMin, minPrice);
      domainMax = Math.max(domainMax, maxPrice);
    }

    const padding = (domainMax - domainMin) * (isStablecoinData ? 0.2 : 0.1);
    const yScale = d3
      .scaleLinear()
      .domain([domainMin - padding, domainMax + padding])
      .range([chartHeight, 0]);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const bgGradient = defs.append('linearGradient').attr('id', 'bg-gradient').attr('gradientUnits', 'userSpaceOnUse').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', chartHeight);

    bgGradient.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(15, 23, 42, 0.8)');
    bgGradient.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(30, 41, 59, 0.4)');

    g.append('rect').attr('width', chartWidth).attr('height', chartHeight).attr('fill', 'url(#bg-gradient)').attr('rx', 8);

    const xTicks = xScale.ticks(4);
    const yTicks = yScale.ticks(6);

    const xGridGroup = g.append('g').attr('class', 'x-grid');
    xGridGroup
      .selectAll('line')
      .data(xTicks)
      .enter()
      .append('line')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', 'rgba(148, 163, 184, 0.08)')
      .attr('stroke-width', 1);

    const yGridGroup = g.append('g').attr('class', 'y-grid');
    yGridGroup
      .selectAll('line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', 'rgba(148, 163, 184, 0.08)')
      .attr('stroke-width', 1);

    const priceGradient = defs.append('linearGradient').attr('id', 'price-gradient').attr('gradientUnits', 'userSpaceOnUse').attr('x1', 0).attr('y1', chartHeight).attr('x2', 0).attr('y2', 0);

    priceGradient.append('stop').attr('offset', '0%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0.05);
    priceGradient.append('stop').attr('offset', '30%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0.2);
    priceGradient.append('stop').attr('offset', '100%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0.4);

    const line = d3
      .line<HistoricalDataPoint>()
      .x((d) => xScale(new Date(d.time)))
      .y((d) => yScale(d.price))
      .curve(d3.curveCardinal.tension(0.2));

    const area = d3
      .area<HistoricalDataPoint>()
      .x((d) => xScale(new Date(d.time)))
      .y0(chartHeight)
      .y1((d) => yScale(d.price))
      .curve(d3.curveCardinal.tension(0.2));

    g.append('path').datum(historicalData).attr('fill', 'url(#price-gradient)').attr('d', area);

    g.append('path').datum(historicalData).attr('fill', 'none').attr('stroke', '#60a5fa').attr('stroke-width', 3).attr('filter', 'url(#glow)').attr('d', line);

    if (currentPrice > 0) {
      const currentPriceGroup = g.append('g').attr('class', 'current-price');

      currentPriceGroup
        .append('line')
        .attr('x1', 0)
        .attr('x2', chartWidth)
        .attr('y1', yScale(currentPrice))
        .attr('y2', yScale(currentPrice))
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '8,4')
        .attr('filter', 'url(#glow)');

      const currentPriceLabel = currentPriceGroup.append('g').attr('transform', `translate(${chartWidth - 10}, ${yScale(currentPrice)})`);

      const currentPriceLabelWidth = getLabelWidth(currentPrice);
      currentPriceLabel
        .append('rect')
        .attr('x', -currentPriceLabelWidth + 5)
        .attr('y', -12)
        .attr('width', currentPriceLabelWidth - 5)
        .attr('height', 20)
        .attr('fill', 'rgba(245, 158, 11, 0.9)')
        .attr('rx', 4)
        .attr('filter', 'url(#shadow)');

      currentPriceLabel
        .append('text')
        .attr('x', -(currentPriceLabelWidth / 2) + 2.5)
        .attr('y', 3)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('font-family', 'system-ui, -apple-system, sans-serif')
        .text(formatPrice(currentPrice));
    }

    if (minPrice > 0 && maxPrice > 0) {
      const rangeGroup = g.append('g').attr('class', 'price-range');

      const clampedMinY = Math.max(0, Math.min(chartHeight, yScale(minPrice)));
      const clampedMaxY = Math.max(0, Math.min(chartHeight, yScale(maxPrice)));

      if (clampedMaxY < chartHeight && clampedMinY > 0) {
        const rangeGradient = defs
          .append('linearGradient')
          .attr('id', 'range-gradient')
          .attr('gradientUnits', 'userSpaceOnUse')
          .attr('x1', 0)
          .attr('y1', clampedMaxY)
          .attr('x2', 0)
          .attr('y2', clampedMinY);

        rangeGradient.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(59, 130, 246, 0.3)');
        rangeGradient.append('stop').attr('offset', '50%').attr('stop-color', 'rgba(59, 130, 246, 0.15)');
        rangeGradient.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(59, 130, 246, 0.25)');

        rangeGroup
          .append('rect')
          .attr('x', 0)
          .attr('y', clampedMaxY)
          .attr('width', chartWidth)
          .attr('height', Math.max(0, clampedMinY - clampedMaxY))
          .attr('fill', 'url(#range-gradient)')
          .attr('stroke', 'rgba(59, 130, 246, 0.6)')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3')
          .attr('rx', 4);
      }

      if (yScale(minPrice) >= 0 && yScale(minPrice) <= chartHeight) {
        const minGroup = rangeGroup.append('g').attr('class', 'min-price-group');

        minGroup
          .append('line')
          .attr('x1', 0)
          .attr('x2', chartWidth)
          .attr('y1', yScale(minPrice))
          .attr('y2', yScale(minPrice))
          .attr('stroke', '#ef4444')
          .attr('stroke-width', 3)
          .attr('filter', 'url(#glow)');

        const minHandle = minGroup
          .append('g')
          .attr('class', 'drag-handle min-handle')
          .attr('transform', `translate(${chartWidth - 20}, ${yScale(minPrice)})`)
          .style('cursor', 'ns-resize')
          .style('pointer-events', 'all')
          .call(createDragBehavior('min'));

        minHandle.append('circle').attr('r', 8).attr('fill', '#ef4444').attr('stroke', '#fff').attr('stroke-width', 3).attr('filter', 'url(#shadow)');

        minHandle.append('circle').attr('r', 4).attr('fill', '#dc2626');

        const minLabel = minGroup.append('g').attr('transform', `translate(${chartWidth - 50}, ${yScale(minPrice) + 20})`);

        const minLabelWidth = getLabelWidth(minPrice);
        minLabel
          .append('rect')
          .attr('x', -minLabelWidth / 2)
          .attr('y', -10)
          .attr('width', minLabelWidth)
          .attr('height', 18)
          .attr('fill', 'rgba(239, 68, 68, 0.9)')
          .attr('rx', 4)
          .attr('filter', 'url(#shadow)');

        minLabel
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('y', 4)
          .attr('fill', 'white')
          .attr('font-size', '10px')
          .attr('font-weight', '600')
          .attr('font-family', 'system-ui, -apple-system, sans-serif')
          .text(formatPrice(minPrice));
      }

      if (yScale(maxPrice) >= 0 && yScale(maxPrice) <= chartHeight) {
        const maxGroup = rangeGroup.append('g').attr('class', 'max-price-group');

        maxGroup
          .append('line')
          .attr('x1', 0)
          .attr('x2', chartWidth)
          .attr('y1', yScale(maxPrice))
          .attr('y2', yScale(maxPrice))
          .attr('stroke', '#10b981')
          .attr('stroke-width', 3)
          .attr('filter', 'url(#glow)');

        const maxHandle = maxGroup
          .append('g')
          .attr('class', 'drag-handle max-handle')
          .attr('transform', `translate(${chartWidth - 20}, ${yScale(maxPrice)})`)
          .style('cursor', 'ns-resize')
          .style('pointer-events', 'all')
          .call(createDragBehavior('max'));

        maxHandle.append('circle').attr('r', 8).attr('fill', '#10b981').attr('stroke', '#fff').attr('stroke-width', 3).attr('filter', 'url(#shadow)');

        maxHandle.append('circle').attr('r', 4).attr('fill', '#059669');

        const maxLabel = maxGroup.append('g').attr('transform', `translate(${chartWidth - 50}, ${yScale(maxPrice) - 12})`);

        const maxLabelWidth = getLabelWidth(maxPrice);
        maxLabel
          .append('rect')
          .attr('x', -maxLabelWidth / 2)
          .attr('y', -10)
          .attr('width', maxLabelWidth)
          .attr('height', 18)
          .attr('fill', 'rgba(16, 185, 129, 0.9)')
          .attr('rx', 4)
          .attr('filter', 'url(#shadow)');

        maxLabel
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('y', 4)
          .attr('fill', 'white')
          .attr('font-size', '10px')
          .attr('font-weight', '600')
          .attr('font-family', 'system-ui, -apple-system, sans-serif')
          .text(formatPrice(maxPrice));
      }
    }

    function createDragBehavior(type: 'min' | 'max') {
      let isDragging = false;
      let startY = 0;
      let initialPriceY = 0;

      return function (selection: d3.Selection<SVGGElement, unknown, null, undefined>) {
        selection
          .on('mousedown', function (event) {
            event.preventDefault();
            event.stopPropagation();

            isDragging = true;
            startY = event.clientY;
            initialPriceY = type === 'min' ? yScale(minPrice) : yScale(maxPrice);

            setDragState(true, type);

            const handle = d3.select(this);
            handle.select('circle:first-child').attr('r', 12);
            handle.classed('dragging', true);

            document.body.style.userSelect = 'none';
          })
          .on('mousemove', function (event) {
            if (!isDragging) return;

            event.preventDefault();
            event.stopPropagation();

            const deltaY = event.clientY - startY;
            const newY = Math.max(0, Math.min(chartHeight, initialPriceY + deltaY));
            const newPrice = yScale.invert(newY);

            const handle = d3.select(this);
            handle.attr('transform', `translate(${chartWidth - 20}, ${newY})`);

            const parentGroup = handle.node()?.parentNode as SVGGElement;
            if (parentGroup) {
              d3.select(parentGroup).select('line').attr('y1', newY).attr('y2', newY);

              const labelGroup = d3.select(parentGroup).select('g:last-child');
              labelGroup.attr('transform', `translate(${chartWidth - 50}, ${type === 'min' ? newY + 20 : newY - 12})`);

              const newLabelWidth = getLabelWidth(newPrice);
              labelGroup
                .select('rect')
                .attr('x', -newLabelWidth / 2)
                .attr('width', newLabelWidth);
              labelGroup.select('text').text(formatPrice(newPrice));
            }

            const currentMin = type === 'min' ? newPrice : minPrice;
            const currentMax = type === 'max' ? newPrice : maxPrice;

            if (currentMin < currentMax && currentMin > 0 && currentMax > 0) {
              const rangeRect = g.select('.price-range rect');
              if (!rangeRect.empty()) {
                rangeRect.attr('y', yScale(currentMax)).attr('height', Math.max(0, yScale(currentMin) - yScale(currentMax)));
              }
            }
          });

        d3.select(document).on(`mouseup.drag-${type}`, function (event) {
          if (!isDragging) return;

          event.preventDefault();
          event.stopPropagation();

          const deltaY = event.clientY - startY;
          const newY = Math.max(0, Math.min(chartHeight, initialPriceY + deltaY));
          const newPrice = yScale.invert(newY);

          const handle = selection;
          handle.select('circle:first-child').transition().duration(200).attr('r', 8);
          handle.classed('dragging', false);

          document.body.style.userSelect = '';

          if (type === 'min' && newPrice < maxPrice && newPrice > 0) {
            setPriceRange(newPrice, maxPrice);
          } else if (type === 'max' && newPrice > minPrice && newPrice > 0) {
            setPriceRange(minPrice, newPrice);
          }

          isDragging = false;
          setDragState(false, null);

          d3.select(document).on(`mouseup.drag-${type}`, null);
        });
      };
    }

    const xAxis = d3
      .axisBottom(xScale)
      .ticks(4)
      .tickFormat(d3.timeFormat('%m/%d') as any)
      .tickSize(-chartHeight)
      .tickPadding(15);

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(6)
      .tickFormat((d) => formatPrice(d as number))
      .tickSize(-chartWidth)
      .tickPadding(10);

    const xAxisGroup = g.append('g').attr('transform', `translate(0,${chartHeight})`).call(xAxis);

    xAxisGroup.selectAll('.domain').remove();
    xAxisGroup.selectAll('.tick line').remove();
    xAxisGroup.selectAll('text').attr('fill', 'rgba(148, 163, 184, 0.8)').attr('font-size', '11px').attr('font-weight', '500').attr('font-family', 'system-ui, -apple-system, sans-serif');

    const yAxisGroup = g.append('g').call(yAxis);
    yAxisGroup.selectAll('.domain').remove();
    yAxisGroup.selectAll('.tick line').remove();
    yAxisGroup.selectAll('text').attr('fill', 'rgba(148, 163, 184, 0.8)').attr('font-size', '11px').attr('font-weight', '500').attr('font-family', 'system-ui, -apple-system, sans-serif');
  }, [historicalData, minPrice, maxPrice, currentPrice, chartWidth, chartHeight, setPriceRange, setDragState]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      drawChart();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [drawChart]);

  return (
    <div
      ref={containerRef}
      className={`relative bg-gradient-to-br from-slate-900/80 to-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-2xl overflow-hidden w-full ${className}`}
      style={{
        transform: 'none',
        position: 'relative',
        left: 'auto',
        right: 'auto',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-r from-slate-800/60 to-slate-700/40 backdrop-blur-md border-b border-slate-600/30 flex items-center justify-between px-4 z-10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 text-slate-400">
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
              <span className="text-xs">Price Trend</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
              <span className="text-xs">Current Price</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-12 p-1">
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          className="overflow-visible drop-shadow-lg"
          style={{
            background: 'transparent',
            userSelect: 'none',
            touchAction: 'none',
            pointerEvents: 'auto',
          }}
        />
      </div>
    </div>
  );
};
