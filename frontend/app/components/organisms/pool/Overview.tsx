import type { PoolInfo } from '@towerfi/types';
import { useState, useEffect } from 'react';
import { convertMicroDenomToDenom } from '~/utils/intl';
import Skeleton from '../../atoms/Skeleton';
import { CellPoints } from '../../atoms/cells/CellPoints';
import { type Period } from '../../atoms/PeriodToggle';
import { IncentivesOverview } from './IncentivesOverview';
import { addressShorten } from '~/utils/masks';
import { IconCopy, IconExternalLink } from '@tabler/icons-react';
import { copyToClipboard } from '~/utils/browser';
import { useToast } from '~/app/hooks';
import { TMockPool } from '~/lib/mockPools';

interface OverviewProps {
  pool: TMockPool;
  aprTimeframe: Period;
  incentiveApr?: any;
  metrics: any;
}

export const Overview: React.FC<OverviewProps> = ({ pool, aprTimeframe, incentiveApr, metrics }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const poolMetric = metrics?.[pool.id];

  const price = poolMetric ? poolMetric.token1_price / poolMetric.token0_price : 1;

  const assets = [
    {
      name: pool.token0.symbol,
      symbol: pool.token0.symbol,
      decimals: pool.token0.decimals,
      denom: pool.token0.id,
      logoURI: `/tokens/${pool.token0.symbol.toLowerCase()}.svg`,
      type: 'ibc' as const,
      portId: 'transfer',
      channelId: 'channel-0',
      coingeckoId: pool.token0.symbol.toLowerCase(),
      origin: {
        type: 'erc20' as const,
        chain: 'ethereum',
        contract: pool.token0.id,
      },
    },
    {
      name: pool.token1.symbol,
      symbol: pool.token1.symbol,
      decimals: pool.token1.decimals,
      denom: pool.token1.id,
      logoURI: `/tokens/${pool.token1.symbol.toLowerCase()}.svg`,
      type: 'ibc' as const,
      portId: 'transfer',
      channelId: 'channel-0',
      coingeckoId: pool.token1.symbol.toLowerCase(),
      origin: {
        type: 'erc20' as const,
        chain: 'ethereum',
        contract: pool.token1.id,
      },
    },
  ];

  return (
    <div className="grid items-start grid-cols-[1fr] lg:grid-cols-[max-content_1fr] gap-y-2 lg:gap-y-8 gap-x-4">
      <span className="text-sm font-medium text-white/50">Price:</span>
      <span className="text-sm">
        {isLoading ? (
          <Skeleton className="h-4 w-1/2" />
        ) : (
          <span>
            1 {pool.token0.symbol} = {price.toFixed(2)} {pool.token1.symbol}
          </span>
        )}
      </span>

      <span className="text-sm font-medium text-white/50">Points:</span>
      <span className="text-sm">
        {/* Custom points display to match the image */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <img
              src="/tower/2x.svg"
              alt="2x"
              className="w-auto h-6"
              onError={(e) => {
                e.currentTarget.src = '/favicon.svg';
              }}
            />
          </div>
          <div className="flex items-center gap-1">
            <img
              src="/union/2.5x.svg"
              alt="2.5x"
              className="w-auto h-6"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="flex items-center gap-1">
            <img
              src="/escher/1.25x.svg"
              alt="1.25x"
              className="w-auto h-6"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
      </span>

      <span className="text-sm font-medium text-white/50">Pool Contract:</span>
      <span className="text-sm flex items-center">
        {addressShorten(pool.id)}
        <button
          type="button"
          className="ml-2 hover:cursor-pointer text-white/50 hover:text-white"
          onClick={() => {
            copyToClipboard(pool.id);
            toast.info(
              {
                description: 'Copied to clipboard',
              },
              {
                removeDelay: 100,
              }
            );
          }}
        >
          <IconCopy size={16} />
        </button>
        <a href={`https://sepolia.etherscan.io/address/${pool.id}`} className="ml-2 hover:cursor-pointer text-white/50 hover:text-white" target="_blank" rel="noreferrer">
          <IconExternalLink size={16} />
        </a>
      </span>
    </div>
  );
};
