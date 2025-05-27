'use client';
import Input from '../atoms/Input';
import { Button } from '../atoms/Button';
import { twMerge } from '~/utils/twMerge';
import { useModal } from '~/app/providers/ModalProvider';
import { ModalTypes } from '~/types/modal';

import type React from 'react';
import { Table, TableRow } from '../atoms/Table';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Pagination } from '../atoms/Pagination';
import { blockedPoolAddresses } from '~/utils/consts';
import type { PoolMetricSerialized } from '@towerfi/types';
import { useRouter } from 'next/navigation';
import { PeriodToggle, type Period } from '../atoms/PeriodToggle';
import { getAllPools, type TMockPool } from '~/lib/mockPools';

const uniV3Pools = getAllPools();

const mockMetrics: Record<string, PoolMetricSerialized> = {
  '0x5878d73d8a6306270ae6556a02ffdc2810ef999f': {
    average_apr: 12.5,
    tvl_usd: 30000000,
    token0_swap_volume: 150000000000000000,
    token1_swap_volume: 1250000000000,
    token0_decimals: 18,
    token1_decimals: 6,
    token0_denom: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9',
    token1_denom: '0xf40e9240464482db4b0e95beacb14c3de04c5715',
    pool_address: '0x5878d73d8a6306270ae6556a02ffdc2810ef999f',
    height: '',
    token0_balance: '',
    token0_price: 2000,
    token1_balance: '',
    token1_price: 1,
    lp_token_address: '',
    total_incentives: '',
    metric_start_height: null,
    metric_end_height: null,
  },
  '0x935c8743827a2a72c8e7c8e989ac1a9e16e94395': {
    average_apr: 8.2,
    tvl_usd: 10000000,
    token0_swap_volume: 850000000000000000,
    token1_swap_volume: 850000000000000000,
    token0_decimals: 18,
    token1_decimals: 18,
    token0_denom: '0x8427ca5ac3d8c857239d6a8767ce57741e253569',
    token1_denom: '0xfe8668d7a038aea654964199e16b19454cfc2b50',
    pool_address: '0x935c8743827a2a72c8e7c8e989ac1a9e16e94395',
    height: '',
    token0_balance: '',
    token0_price: 1,
    token1_balance: '',
    token1_price: 1,
    lp_token_address: '',
    total_incentives: '',
    metric_start_height: null,
    metric_end_height: null,
  },
};

const mockIncentiveAprs: Record<string, any> = {
  '0x5878d73d8a6306270ae6556a02ffdc2810ef999f': {
    rewards_per_second: 0.5,
    token_decimals: 18,
    reward_token: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9',
  },
};

const Pools: React.FC = () => {
  const { showModal } = useModal();
  const router = useRouter();
  const gridClass = 'grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4';

  const [isLoading, setIsLoading] = useState(true);
  const [isMetricLoading, setIsMetricLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsMetricLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const pools = uniV3Pools;
  const metrics = mockMetrics;
  const incentiveAprs = mockIncentiveAprs;

  const [searchText, setSearchText] = useState('');
  const [aprTimeframe, setAprTimeframe] = useState<Period>('7d');
  const onAprTimeframeChange = useCallback(
    (period: Period) => {
      setAprTimeframe(period);
    },
    [setAprTimeframe]
  );

  const columns = [
    { key: 'name', title: 'Pool', className: 'col-span-2 lg:col-span-1' },
    { key: 'poolLiquidity', title: 'TVL' },
    { key: 'apr', title: 'APR' },
    { key: 'volume', title: `Volume ${aprTimeframe === '1d' ? '24h' : '7d'}` },
    { key: 'points', title: 'Points' },
    { key: 'actions', title: '' },
  ];

  const filteredPools = pools
    .filter((pool: TMockPool) => !blockedPoolAddresses.includes(pool.id))
    .filter((pool: TMockPool) => `${pool.token0.symbol}/${pool.token1.symbol}`.toLowerCase().includes(searchText.toLowerCase()));

  useEffect(() => {
    setCurrentPage(0);
  }, [searchText]);

  const [currentPage, setCurrentPage] = useState(0);
  const numberPerPage = 40;
  const totalPools = Math.ceil(filteredPools.length / numberPerPage);

  const sortedPools = [...filteredPools].sort((a, b) => {
    const nameA = `${a.token0.symbol}/${a.token1.symbol}`;
    const nameB = `${b.token0.symbol}/${b.token1.symbol}`;
    return nameA.localeCompare(nameB);
  });

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="flex flex-col gap-8 px-4 pb-20 max-w-[120rem] mx-auto w-full min-h-[65vh] lg:pt-8">
      <div className="flex gap-3 justify-between items-center lg:pl-3 lg:pr-2 pl-3">
        <h1 className="text-xl">Pools</h1>
        <div className="flex gap-3 h-[42px] items-center px-2">
          <PeriodToggle onChange={onAprTimeframeChange} defaultPeriod={aprTimeframe} />
          <Input isSearch placeholder="Search" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        </div>
      </div>

      <Table columns={columns} gridClass={gridClass}>
        {sortedPools.slice(currentPage * numberPerPage, currentPage * numberPerPage + numberPerPage).map((pool, i) => {
          const poolName = `${pool.token0.symbol}/${pool.token1.symbol}`;
          const metric = metrics?.[pool.id];
          const incentive = incentiveAprs?.[pool.id];

          return (
            <TableRow key={i} gridClass={twMerge('grid cursor-pointer hover:bg-white/5', gridClass) || ''} onClick={() => router.push(`/pools/${pool.id}`)}>
              <div className="col-span-2 lg:col-span-1 flex flex-col gap-2 w-full pr-4">
                <p className="text-xs text-white/50 lg:hidden">Pool</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center -space-x-2">
                      <img
                        src={`/assets/default.png`}
                        alt={pool.token0.symbol}
                        className="w-8 h-8 rounded-full border-2 border-slate-800 bg-slate-700"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/default.png';
                        }}
                      />
                      <img
                        src={`/assets/default.png`}
                        alt={pool.token1.symbol}
                        className="w-8 h-8 rounded-full border-2 border-slate-800 bg-slate-700"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/default.png';
                        }}
                      />
                    </div>
                    <span className="text-white">{poolName}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">Concentrated</span>
                  <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">{(pool.feeTier / 10000).toFixed(2)}%</span>
                  {incentive && <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">⚡ Incentivized</span>}
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full px-4">
                <p className="text-xs text-white/50 lg:hidden">TVL</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-white">{isMetricLoading ? '...' : formatNumber(metric?.tvl_usd || 0)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full px-4">
                <p className="text-xs text-white/50 lg:hidden">APR ({aprTimeframe})</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-white">{isMetricLoading ? '...' : `${(metric?.average_apr || 0).toFixed(2)}%`}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full px-4">
                <p className="text-xs text-white/50 lg:hidden">Volume {aprTimeframe === '7d' ? '7D' : '24h'}</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-white">
                    {isMetricLoading ? '...' : formatNumber(1250000)} {/* Mock volume */}
                  </p>
                </div>
              </div>

              <div className="w-full px-1">
                <div className="flex flex-wrap items-center gap-1">
                  <img
                    src="/tower/2x.svg"
                    alt="TowerFi"
                    className="w-auto h-7"
                    onError={(e) => {
                      e.currentTarget.src = '/favicon.svg';
                    }}
                  />

                  {poolName.includes('WETH') && (
                    <img
                      src="/union/1.5x.svg"
                      alt="Union"
                      className="h-6 w-auto"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="flex items-end justify-end w-full px-4">
                <Button
                  variant="flat"
                  isDisabled={true}
                  onPress={() =>
                    showModal(ModalTypes.add_liquidity, false, {
                      pool: {
                        poolAddress: pool.id,
                        token0: pool.token0,
                        token1: pool.token1,
                        name: poolName,
                        poolType: 'concentrated',
                        config: { fee: `${pool.feeTier / 10000}%` },
                      },
                    })
                  }
                >
                  Add Liquidity
                </Button>
              </div>
            </TableRow>
          );
        })}
      </Table>
      {filteredPools.length > numberPerPage && (
        <Pagination total={totalPools} onPageChange={(page) => setCurrentPage(page - 1)} initialPage={currentPage + 1} className={{ base: 'self-center backdrop-blur-xl rounded-3xl p-1' }} />
      )}
    </div>
  );
};

export default Pools;
