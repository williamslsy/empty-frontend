'use client';

import type React from 'react';
import { twMerge } from '~/utils/twMerge';
import { formatNumber } from '~/app/hooks/usePrices';
import type { PoolMetricSerialized } from '@towerfi/types';
import type { Currency } from '@towerfi/types';

interface Props {
  title: string;
  metrics?: PoolMetricSerialized;
  assets: Currency[];
  className?: string;
  isLoading?: boolean;
}

export const CellTVL: React.FC<Props> = ({ title, metrics, assets, className, isLoading }) => {
  const tvlValue = metrics?.tvl_usd || 0;

  return (
    <div className={twMerge('flex flex-col gap-2', className)}>
      <p className="text-xs text-white/50 lg:hidden">{title}</p>
      <div className="flex items-center justify-between gap-3">
        <p>{isLoading ? '...' : `${formatNumber(tvlValue, { currency: 'USD', language: navigator.language })}`}</p>
      </div>
    </div>
  );
};
