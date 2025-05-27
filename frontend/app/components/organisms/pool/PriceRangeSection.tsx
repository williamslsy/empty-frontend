import React, { useEffect, useRef } from 'react';
import { InteractivePriceChart } from '../chart/LiquidityChartRange';
import { usePriceRangeStore, RangeType } from '~/stores/priceRangeStore';
import { TMockPool } from '~/lib/mockPools';
import { useTokenPrices } from '~/app/hooks/useTokenPrices';
import { useHistoricalPrices } from '~/app/hooks/useHistoricalPrices';
import { Tab, TabList, Tabs } from '../../atoms/Tabs';

interface PriceRangeSectionProps {
  pool: TMockPool;
  onRangeChange?: (min: number, max: number) => void;
}

const RANGE_TYPES: RangeType[] = ['Full Range', 'Wide', 'Common', 'Narrow'];

export const PriceRangeSection: React.FC<PriceRangeSectionProps> = ({ pool, onRangeChange }) => {
  const { getTokenPriceOnly } = useTokenPrices();
  const prevPoolRef = useRef<TMockPool | null>(null);
  const prevPriceRef = useRef<number>(0);

  const { rangeType, minPrice, maxPrice, currentPrice, minPriceInput, maxPriceInput, setRangeType, setManualInputs, setCurrentPrice, setPool, validateAndUpdateRange } = usePriceRangeStore();

  const token0Price = getTokenPriceOnly(pool.token0.id);
  const token1Price = getTokenPriceOnly(pool.token1.id);
  const calculatedCurrentPrice = token0Price > 0 && token1Price > 0 ? token0Price / token1Price : 0;

  const { data: historicalData = [], isLoading: isLoadingHistory } = useHistoricalPrices(pool.token0?.symbol || 'token0', pool.token1?.symbol || 'token1', calculatedCurrentPrice);

  useEffect(() => {
    if (!pool) return;

    if (prevPoolRef.current?.token0?.id !== pool.token0?.id || prevPoolRef.current?.token1?.id !== pool.token1?.id) {
      setPool(pool);
      prevPoolRef.current = pool;
    }
  }, [pool?.token0?.id, pool?.token1?.id]);

  useEffect(() => {
    if (calculatedCurrentPrice > 0) {
      if (Math.abs(prevPriceRef.current - calculatedCurrentPrice) > 0.000001) {
        setCurrentPrice(calculatedCurrentPrice);
        prevPriceRef.current = calculatedCurrentPrice;
        console.log(`Updated current price: ${calculatedCurrentPrice.toFixed(6)}`);
      }
    }
  }, [calculatedCurrentPrice, setCurrentPrice]);

  useEffect(() => {
    if (onRangeChange && minPrice > 0 && maxPrice > 0) {
      onRangeChange(minPrice, maxPrice);
    }
  }, [minPrice, maxPrice, onRangeChange]);

  const calculateEfficiency = () => {
    if (!currentPrice || minPrice === 0 || maxPrice === 0) return null;

    const isInRange = currentPrice >= minPrice && currentPrice <= maxPrice;
    const rangeWidth = maxPrice - minPrice;
    const concentration = currentPrice / rangeWidth;

    const minDeviation = Math.abs(((currentPrice - minPrice) / currentPrice) * 100);
    const maxDeviation = Math.abs(((maxPrice - currentPrice) / currentPrice) * 100);
    const avgDeviation = (minDeviation + maxDeviation) / 2;

    if (!isInRange) {
      return {
        isInRange: false,
        concentration: '0.00',
        rangeWidthPercent: avgDeviation.toFixed(1),
        capitalEfficiency: '0.0',
        aprBoost: '0',
      };
    }

    const capitalEfficiency = (100 / ((rangeWidth / currentPrice) * 100)).toFixed(1);
    const aprBoost = (100 / ((rangeWidth / currentPrice) * 100)).toFixed(0);

    return {
      isInRange: true,
      concentration: concentration.toFixed(2),
      rangeWidthPercent: avgDeviation.toFixed(1),
      capitalEfficiency,
      aprBoost,
    };
  };

  const efficiency = calculateEfficiency();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mt-4">
        <h3 className="text-lg font-semibold text-white">Set Price Range</h3>
        {efficiency && (
          <div className="flex items-center gap-2 text-xs">
            <div className={`px-2 py-1 rounded ${efficiency.isInRange ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {efficiency.isInRange ? 'In Range' : 'Out of Range'}
            </div>
            <div className="text-white/50">Range: ±{efficiency.rangeWidthPercent}%</div>
          </div>
        )}
      </div>

      <Tabs defaultKey="Common" selectedKey={rangeType} onSelectionChange={(key) => setRangeType(key as RangeType)} className="w-full">
        <TabList className="grid grid-cols-4 bg-white/5 p-1 rounded-full w-full">
          {RANGE_TYPES.map((type) => (
            <Tab key={type} tabKey={type} className="flex items-center justify-center py-3 px-4 text-center min-h-[40px]">
              <span className="text-sm font-medium">{type}</span>
            </Tab>
          ))}
        </TabList>
      </Tabs>

      <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50">
        <div className="h-[420px] overflow-hidden">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-white/60">Loading chart data...</div>
            </div>
          ) : historicalData && historicalData.length > 0 ? (
            <div className="flex gap-4 items-start h-full">
              <div className="flex-1 min-w-0 h-full">
                <InteractivePriceChart width={400} height={400} historicalData={historicalData} className="h-full" />
              </div>

              <div className="flex flex-col gap-3 w-[130px] flex-shrink-0">
                <div className="bg-white/5 rounded-lg p-3">
                  <label className="block text-xs text-white/50 mb-1">Max Price</label>
                  <div className="space-y-1">
                    <div className="text-white font-medium text-sm">{maxPrice > 0 ? maxPrice.toFixed(6) : '0.000000'}</div>
                    <div className="text-[10px] text-white/40">
                      {pool.token0.symbol} per {pool.token1.symbol}
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <label className="block text-xs text-white/50 mb-1">Min Price</label>
                  <div className="space-y-1">
                    <div className="text-white font-medium text-sm">{minPrice > 0 ? minPrice.toFixed(6) : '0.000000'}</div>
                    <div className="text-[10px] text-white/40">
                      {pool.token0.symbol} per {pool.token1.symbol}
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <label className="block text-xs text-white/50 mb-1">Current Price</label>
                  <div className="space-y-1">
                    <div className="text-yellow-400 font-medium text-sm">{currentPrice > 0 ? currentPrice.toFixed(6) : '0.000000'}</div>
                    <div className="text-[10px] text-white/40">
                      {pool.token0.symbol} per {pool.token1.symbol}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-white/60">No chart data available</div>
            </div>
          )}
        </div>
      </div>

      {efficiency && !efficiency.isInRange && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-yellow-400 text-sm">⚠️</div>
            <div className="text-yellow-400 text-sm">
              <div className="font-medium mb-1">Price Out of Range</div>
              <div className="text-xs text-yellow-400/80">
                Current price is outside your selected range. You won't earn fees until the price moves back into range. Capital efficiency and APR boost are 0% while out of range.
              </div>
            </div>
          </div>
        </div>
      )}

      {minPrice > 0 && maxPrice > 0 && (maxPrice - minPrice) / currentPrice > 10 && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-blue-400 text-sm">💡</div>
            <div className="text-blue-400 text-sm">
              <div className="font-medium mb-1">Wide Range Selected</div>
              <div className="text-xs text-blue-400/80">Your range is very wide. Consider narrowing it for higher capital efficiency and fees.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
