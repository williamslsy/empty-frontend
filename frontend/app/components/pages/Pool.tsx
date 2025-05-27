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

const mockIncentiveApr = {
  rewards_per_second: '0.5',
  token_decimals: 6,
  reward_token: 'uatom',
  start_ts: Math.floor(Date.now() / 1000) - 86400 * 7,
  end_ts: Math.floor(Date.now() / 1000) + 86400 * 30,
};

const mockMetrics = {
  average_apr: 12.5,
  tvl_usd: 2500000,
  token0_swap_volume: 150000000000,
  token1_swap_volume: 180000000000,
  token0_decimals: 6,
  token1_decimals: 6,
  token0_denom: 'uatom',
  token1_denom: 'uosmo',
  pool_address: 'pool1_address_123',
  height: '1000000',
  token0_balance: '2500000000000',
  token0_price: 8.5,
  token1_balance: '1800000000000',
  token1_price: 0.35,
  lp_token_address: 'lp_token_1',
  total_incentives: '50000000000',
  metric_start_height: 999000,
  metric_end_height: 1000000,
};

const Pool: React.FC<{
  address: string;
}> = ({ address }) => {
  const pool = getPoolById('0x935c8743827a2a72c8e7c8e989ac1a9e16e94395');

  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const [aprTimeframe, setAprTimeframe] = useState<Period>('7d');
  const onAprTimeframeChange = useCallback(
    (period: Period) => {
      setAprTimeframe(period);
    },
    [setAprTimeframe]
  );

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
                {/* <AssetsStacked assets={mockPool.assets} size="lg" /> */}
                <h1 className="text-3xl">
                  {token0.symbol} / {token1.symbol}
                </h1>
              </div>
              <div className="flex flex-col lg:flex-row justify-between mb-8 items-center space-y-4 lg:space-y-0">
                {/* <div className="flex flex-wrap gap-1">
                  <PoolTypePill poolType={mockPool.poolType} config={mockPool.config} />
                  <PoolFeePill poolType={mockPool.poolType} config={mockPool.config} />
                  <PoolIncentivesPill incentives={mockIncentiveApr} />
                </div> */}
                {/* <div className="flex">
                  <PeriodToggle onChange={onAprTimeframeChange} defaultPeriod={aprTimeframe} />
                </div> */}
              </div>

              <div className="w-full flex-1 flex items-center justify-center border border-white/10 rounded-2xl p-4 lg:py-6 lg:px-10 flex-col mb-10">
                {/* <div className="flex w-full space-x-4 justify-between">
                  <Metrics pool={mockPool} aprTimeframe={aprTimeframe} metrics={mockMetrics} />
                </div> */}
              </div>
              {/* <div className="border border-white/10 rounded-2xl p-6 lg:p-10">
                <Overview pool={mockPool} aprTimeframe={aprTimeframe} incentiveApr={mockIncentiveApr} metrics={mockMetrics} />
              </div> */}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl">My Positions</h2>
                {userAddress && (
                  <Button variant="flat" size="sm" onPress={handleRefreshPositions} className="gap-2" isIconOnly isDisabled={isRefreshing}>
                    <IconRefresh size={16} className={isRefreshing ? 'animate-spin' : ''} />
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

                {/* <Button
                  variant={selectedUserAction === 'swap' ? 'solid' : 'flat'}
                  size="lg"
                  onPress={() => {
                    toggleUserAction('swap');
                  }}
                >
                  Swap
                </Button> */}
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
                {/* <FadeInOut isVisible={selectedUserAction === 'swap'} duration={toggleDuration}>
                  <Swap pool={mockPool} onSubmittedTx={() => {}} />
                </FadeInOut> */}
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
