import { useState, useCallback } from 'react';
import Skeleton from '../../atoms/Skeleton';
import UserPositionSkeleton from '../../atoms/UserPositionSkeleton';
import { useModal } from '~/app/providers/ModalProvider';
import { Button } from '../../atoms/Button';
import { ModalTypes } from '~/types/modal';
import { IconRefresh } from '@tabler/icons-react';
import clsx from 'clsx';
import { TMockPool } from '~/lib/mockPools';
import { useManagePosition } from '~/app/hooks/useManagePosition';
import { useUserPositions } from '~/app/hooks/useUserPositions';
import { useToast } from '~/app/hooks';
import { getPositionDetails } from '~/utils/convertLiquidityToTokenAmounts';
import { useTokenPrices } from '~/app/hooks/useTokenPrices';

export const UserPositions: React.FC<{
  userAddress: string;
  pool: TMockPool;
  isRefreshing?: boolean;
}> = ({ userAddress, pool, isRefreshing = false }) => {
  const { positions, isLoading, refetch } = useUserPositions(pool.id);
  const { collectFees } = useManagePosition();
  const [isRefetching, setIsRefetching] = useState(false);
  const [claimingFees, setClaimingFees] = useState<number | null>(null);
  const { showModal } = useModal();
  const { toast } = useToast();
  const { getTokenPriceOnly, formatPrice } = useTokenPrices();

  const handleClaimFees = useCallback(
    async (tokenId: number) => {
      if (claimingFees === tokenId) return;

      setClaimingFees(tokenId);

      try {
        const success = await collectFees(tokenId, pool.id, userAddress);

        if (success) {
          toast.success({
            title: 'Fees claimed successfully',
            description: `Claimed fees for position #${tokenId}`,
          });
          refetch();
        }
      } catch (error) {
        console.error('Error claiming fees:', error);
        toast.error({
          title: 'Failed to claim fees',
          description: 'Please try again',
        });
      } finally {
        setClaimingFees(null);
      }
    },
    [claimingFees, collectFees, pool.id, userAddress, toast, refetch]
  );

  const token0PriceUSD = getTokenPriceOnly(pool.token0.id);
  const token1PriceUSD = getTokenPriceOnly(pool.token1.id);

  if (isLoading || isRefreshing) {
    return (
      <div className="space-y-6">
        <UserPositionSkeleton />
      </div>
    );
  }

  if (!isLoading && !positions.length) {
    return (
      <div className="border border-white/10 p-6 rounded-xl">
        <div className="flex items-center justify-between w-full">
          <span className="text-white/75">No positions found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {positions.map((position) => {
        const positionDetails = getPositionDetails(
          pool,
          {
            tokenId: position.tokenId,
            liquidity: position.liquidity,
            tickLower: position.tickLower,
            tickUpper: position.tickUpper,
          },
          {
            decimals: pool.token0.decimals,
            symbol: pool.token0.symbol,
          },
          {
            decimals: pool.token1.decimals,
            symbol: pool.token1.symbol,
          },
          token0PriceUSD,
          token1PriceUSD
        );

        const hasClaimableFees = position.tokensOwed0 !== '0' || position.tokensOwed1 !== '0';
        const claimableFeesUSD = parseFloat(position.tokensOwed0) * token0PriceUSD + parseFloat(position.tokensOwed1) * token1PriceUSD;

        return (
          <div key={position.tokenId} className="border border-white/10 p-6 rounded-xl">
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="text-white/50 text-sm font-medium">Total Value</div>
              <div className="text-white/50 text-sm font-medium text-center">Claimable Incentives</div>
              <div className="text-white/50 text-sm font-medium text-right">Actions</div>
            </div>

            <div className="grid grid-cols-3 gap-6 items-center">
              <div className="relative group">
                <div className="text-white text-2xl font-semibold cursor-help">{formatPrice(positionDetails.totalUSD)}</div>
                <div className="absolute bottom-full left-0 mb-3 p-4 bg-black/90 border border-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 min-w-[240px]">
                  <div className="text-white/50 text-xs mb-3 font-medium uppercase tracking-wide">Total Token Value</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <img src="/assets/default.png" alt={pool.token0.symbol} className="w-4 h-4" />
                        <span className="text-white font-medium">{pool.token0.symbol}</span>
                        <span className="text-white/80">{positionDetails.amount0Formatted.toFixed(4)}</span>
                      </div>
                      <span className="text-white/75 font-medium">{formatPrice(positionDetails.amount0USD)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <img src="/assets/default.png" alt={pool.token1.symbol} className="w-4 h-4" />
                        <span className="text-white font-medium">{pool.token1.symbol}</span>
                        <span className="text-white/80">{positionDetails.amount1Formatted.toFixed(4)}</span>
                      </div>
                      <span className="text-white/75 font-medium">{formatPrice(positionDetails.amount1USD)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="text-white text-2xl font-semibold">{formatPrice(claimableFeesUSD)}</div>
                <Button
                  variant="flat"
                  size="sm"
                  onPress={() => handleClaimFees(position.tokenId)}
                  isLoading={claimingFees === position.tokenId}
                  isDisabled={claimingFees !== null || !hasClaimableFees}
                  className="px-4 py-2"
                >
                  Claim
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  variant="flat"
                  size="sm"
                  onPress={() => {
                    showModal(ModalTypes.add_liquidity, true, {
                      pool,
                      position,
                      isIncreasingLiquidity: true,
                    });
                  }}
                  className="w-full py-2.5"
                >
                  Add Liquidity
                </Button>
                <Button
                  variant="flat"
                  size="sm"
                  onPress={() => {
                    showModal(ModalTypes.remove_liquidity, false, {
                      pool,
                      position,
                      refreshUserPositions: refetch,
                    });
                  }}
                  className="w-full py-2.5"
                >
                  Remove Liquidity
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
