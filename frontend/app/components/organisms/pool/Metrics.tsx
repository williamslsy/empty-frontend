import type { PoolInfo } from '@towerfi/types';
import Skeleton from '../../atoms/Skeleton';
import { type Period } from '../../atoms/PeriodToggle';
import { useEffect, useMemo, useState } from 'react';
import { formatNumber } from '~/app/hooks/usePrices';
import Tooltip from '../../atoms/Tooltip';
import { CellAprBreakDown } from '../../atoms/cells/CellApr';
import { TMockPool } from '~/lib/mockPools';

interface MetricsProps {
  pool: TMockPool;
  aprTimeframe: Period;
  metrics: any;
}

export const Metrics: React.FC<MetricsProps> = ({ pool, aprTimeframe, metrics }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const poolMetric = metrics?.[pool.id];

  const apr = useMemo(() => {
    const feeApr = poolMetric?.average_apr || 0;
    const incentivesApr = poolMetric?.total_incentives ? (Number(poolMetric.total_incentives) / poolMetric.tvl_usd) * 100 : 0;

    return {
      fee_apr: feeApr,
      incentives_apr: incentivesApr,
      total_apr: feeApr + incentivesApr,
    };
  }, [poolMetric]);

  const volume = useMemo(() => {
    if (!poolMetric) return 0;
    const token0Volume = (poolMetric.token0_swap_volume * poolMetric.token0_price) / Math.pow(10, poolMetric.token0_decimals);
    const token1Volume = (poolMetric.token1_swap_volume * poolMetric.token1_price) / Math.pow(10, poolMetric.token1_decimals);
    return token0Volume + token1Volume;
  }, [poolMetric]);

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  return (
    <>
      <div className="flex-1 flex flex-col space-y-4">
        <span className="text-white/50">TVL</span>
        {isLoading ? <Skeleton className="h-8 w-1/2" /> : <span className="text-2xl text-white">{formatValue(poolMetric?.tvl_usd || 0)}</span>}
      </div>
      <div className="flex-1 flex flex-col space-y-4">
        <span className="text-white/50">APR</span>
        {isLoading ? (
          <Skeleton className="h-8 w-1/2" />
        ) : (
          <Tooltip
            content={<CellAprBreakDown formattedApr={`${apr.fee_apr.toFixed(2)}%`} formattedIncentives={`${apr.incentives_apr.toFixed(2)}%`} formatted_total_apr={`${apr.total_apr.toFixed(2)}%`} />}
          >
            <span className="text-2xl text-white whitespace-nowrap">{apr?.total_apr.toFixed(2)} %</span>
          </Tooltip>
        )}
      </div>
      <div className="flex-1 flex flex-col space-y-4">
        <span className="text-white/50">Volume</span>
        {isLoading ? <Skeleton className="h-8 w-1/2" /> : <span className="text-2xl text-white">{formatValue(volume)}</span>}
      </div>
    </>
  );
};
