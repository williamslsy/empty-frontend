'use client';

import BackButton from '../atoms/BackButton';
import PoolSkeleton from '../molecules/skeletons/PoolSkeleton';

import { Fragment, useCallback, useState, useEffect } from 'react';

import { type Period } from '../atoms/PeriodToggle';
import { useAccount } from '@cosmi/react';
import { Button } from '../atoms/Button';
import { ModalTypes } from '~/types/modal';
import { IconPlus, IconRefresh } from '@tabler/icons-react';
import { useModal } from '~/app/providers/ModalProvider';
import { ModalAddLiquidity } from '../molecules/modals/ModalAddLiquidity';
import { FadeInOut } from '../atoms/FadeInOut';

import { type TMockPool } from '~/lib/mockPools';
import { getPoolById } from '~/lib/mockPools';
import { useUserPositions } from '~/app/hooks/useUserPositions';
import { UserPositions } from '../organisms/pool/UserPositions';
import Link from 'next/link';
import AssetsStacked from '../atoms/AssetsStacked';
import { Metrics } from '../organisms/pool/Metrics';
import { Overview } from '../organisms/pool/Overview';

const mockMetrics: Record<string, any> = {
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
    token0_price: 2000,
    token1_price: 1,
    total_incentives: '',
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
    token0_price: 1,
    token1_price: 1,
    total_incentives: '',
  },
};

const mockIncentiveApr = {
  rewards_per_second: 0.5,
  token_decimals: 18,
  reward_token: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9',
};

const Pool: React.FC<{
  address: string;
}> = ({ address }) => {
  const pool = getPoolById(address);

  if (!pool) {
    return (
      <div className="flex flex-col gap-3 justify-center items-center lg:pl-3 lg:pr-2 pl-3">
        <h1 className="text-3xl">
          Pool not found, return to <Link href="/pools">Pools</Link>
        </h1>
      </div>
    );
  }

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const { address: userAddress } = useAccount();
  const { showModal } = useModal();

  const [userPositionsKey, setUserPositionsKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const reloadUserPositions = () => {
    setUserPositionsKey((prev) => prev + 1);
  };

  const [selectedUserAction, setSelectedUserAction] = useState<'' | 'add-liquidity' | 'swap'>('');
  const toggleDuration = 300;
  const toggleUserAction = useCallback(
    (action: 'add-liquidity' | 'swap') => {
      setSelectedUserAction((prev) => {
        if (prev === action) {
          return '';
        }

        if (prev !== '') {
          setTimeout(() => {
            setSelectedUserAction(action);
          }, toggleDuration);

          return '';
        }

        return action;
      });
    },
    [setSelectedUserAction]
  );
  const { refetch: refetchUserPositions } = useUserPositions();
  const { token0, token1, tvl, volume24h, id } = pool as TMockPool;

  const handleRefreshPositions = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refetchUserPositions();
      reloadUserPositions();
    } catch (error) {
      console.error('Failed to refresh positions:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const [aprTimeframe, setAprTimeframe] = useState<Period>('7d');
  const onAprTimeframeChange = useCallback(
    (period: Period) => {
      setAprTimeframe(period);
    },
    [setAprTimeframe]
  );

  return (
    <div className="flex flex-col gap-8 px-4 pb-20 max-w-[84.5rem] mx-auto w-full min-h-[65vh] lg:pt-8">
      <div>
        <BackButton text="Pools" returnToURL="/pools" />
      </div>

      {isLoading && <PoolSkeleton />}
      {!isLoading && (
        <Fragment>
          <div className="flex flex-col lg:flex-row lg:space-x-14 space-y-6">
            <div className="flex-1 lg:p-4">
              <div className="flex items-center mb-4">
                <AssetsStacked assets={[token0, token1]} size="lg" />
                <h1 className="text-3xl">
                  {token0.symbol} / {token1.symbol}
                </h1>
              </div>
              <div className="flex flex-col lg:flex-row justify-between mb-8 items-center space-y-4 lg:space-y-0"></div>

              <div className="w-full flex-1 flex items-center justify-center border border-white/10 rounded-2xl p-4 lg:py-6 lg:px-10 flex-col mb-10">
                <div className="flex w-full space-x-4 justify-between">
                  <Metrics pool={pool as TMockPool} aprTimeframe={aprTimeframe} metrics={mockMetrics} />
                </div>
              </div>
              <div className="border border-white/10 rounded-2xl p-6 lg:p-10">
                <Overview pool={pool as TMockPool} aprTimeframe={aprTimeframe} incentiveApr={mockIncentiveApr} metrics={mockMetrics} />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl">My Positions</h2>
                {userAddress && (
                  <Button variant="flat" size="sm" onPress={handleRefreshPositions} className="gap-2" isIconOnly isDisabled={isRefreshing}>
                    <IconRefresh size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    <span className="hidden lg:block ml-1">Refresh</span>
                  </Button>
                )}
              </div>

              {!userAddress && (
                <div className="w-full flex items-center justify-between border border-white/10 p-4 rounded-3xl">
                  <span className="text-white/75">Connect your wallet to see your position</span>
                  <Button onClick={() => showModal(ModalTypes.connect_wallet)}>Connect Wallet</Button>
                </div>
              )}
              {userAddress && <UserPositions key={userPositionsKey} userAddress={userAddress} pool={pool as TMockPool} isRefreshing={isRefreshing} />}

              <div className="flex gap-4 h-[42px] items-center mt-8 mb-4">
                <Button
                  variant={selectedUserAction === 'add-liquidity' ? 'solid' : 'flat'}
                  size="lg"
                  onPress={() => {
                    toggleUserAction('add-liquidity');
                  }}
                  className="gap-2"
                >
                  <IconPlus size={18} />
                  New Position
                </Button>
              </div>

              <div>
                <FadeInOut isVisible={selectedUserAction === 'add-liquidity'} duration={toggleDuration}>
                  <ModalAddLiquidity
                    pool={pool as TMockPool}
                    successAction={() => {
                      setTimeout(reloadUserPositions, 2000);
                    }}
                    className="max-w-full"
                    classNameContainer="px-0"
                    WrapperComponent="div"
                    wrapperProps={{
                      className: 'w-full',
                    }}
                  />
                </FadeInOut>
              </div>
            </div>
          </div>
        </Fragment>
      )}

      {!isLoading && !pool && (
        <Fragment>
          <div className="flex flex-col gap-3 justify-center items-center lg:pl-3 lg:pr-2 pl-3">
            <h1 className="text-3xl">Pool not found</h1>
          </div>
        </Fragment>
      )}
    </div>
  );
};

export default Pool;
