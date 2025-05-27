import { useState, useMemo } from 'react';
import { Button } from '~/app/components/atoms/Button';
import BasicModal from '~/app/components/templates/BasicModal';

import Divider from '~/app/components/atoms/Divider';
import { useAccount } from 'wagmi';
import { useToast } from '~/app/hooks';
import { useModal } from '~/app/providers/ModalProvider';
import { useManagePosition } from '~/app/hooks/useManagePosition';
import { TMockPool } from '~/lib/mockPools';
import { getPositionDetails } from '~/utils/convertLiquidityToTokenAmounts';
import { useTokenPrices } from '~/app/hooks/useTokenPrices';
import Input from '../../atoms/Input';
import { RangeSelector } from '../../atoms/RangeSelector';
import { useUserPositions } from '~/app/hooks/useUserPositions';

interface Position {
  tokenId: number;
  liquidity: string;
  tickLower: number;
  tickUpper: number;
  tokensOwed0: string;
  tokensOwed1: string;
}

interface ModalRemoveLiquidityProps {
  pool: TMockPool;
  position: Position;
  refreshUserPools?: () => void;
}

const ModalRemoveLiquidity: React.FC<ModalRemoveLiquidityProps> = ({ pool, position, refreshUserPools }) => {
  const { token0, token1 } = pool;
  const name = `${token0.symbol} / ${token1.symbol}`;
  const { toast } = useToast();
  const { hideModal } = useModal();
  const { address } = useAccount();
  const { decreaseLiquidity } = useManagePosition();
  const { getTokenPriceOnly, formatPrice } = useTokenPrices();
  const { refetch: refetchUserPositions } = useUserPositions();

  const [percentage, setPercentage] = useState(50);
  const [isLoading, setIsLoading] = useState(false);

  const token0PriceUSD = getTokenPriceOnly(pool.token0.id);
  const token1PriceUSD = getTokenPriceOnly(pool.token1.id);

  const positionDetails = useMemo(() => {
    return getPositionDetails(
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
  }, [pool, position, token0PriceUSD, token1PriceUSD]);

  const removeAmounts = useMemo(() => {
    const factor = percentage / 100;
    const amount0Remove = positionDetails.amount0Formatted * factor;
    const amount1Remove = positionDetails.amount1Formatted * factor;
    const liquidityToRemove = BigInt(Math.floor(Number(position.liquidity) * factor));

    return {
      amount0Remove,
      amount1Remove,
      liquidityToRemove: liquidityToRemove.toString(),
      totalUSDRemove: positionDetails.totalUSD * factor,
    };
  }, [percentage, positionDetails, position.liquidity]);

  const handleRemoveLiquidity = async () => {
    if (!address || percentage <= 0) {
      toast.error({
        title: 'Invalid parameters',
        description: "Please ensure you're connected and have selected a valid percentage",
      });
      return;
    }

    setIsLoading(true);

    const loadingToast = toast.loading(
      {
        title: 'Removing liquidity',
        description: `Removing ${percentage}% of your position and returning tokens to your wallet...`,
      },
      { duration: Infinity }
    );

    try {
      const success = await decreaseLiquidity(position.tokenId, pool.id, percentage, 0.005);

      if (success) {
        const actionText = percentage === 100 ? 'Position closed' : 'Liquidity removed';
        const descriptionText =
          percentage === 100
            ? `Successfully closed position #${position.tokenId} and returned all tokens to your wallet`
            : `Successfully removed ${percentage}% liquidity from position #${position.tokenId} and returned tokens to your wallet`;

        toast.success({
          title: `${actionText} successfully`,
          description: descriptionText,
        });

        hideModal();
        refetchUserPositions();
      }
    } catch (error: unknown) {
      console.error('Remove liquidity error:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error({
        title: 'Remove liquidity failed',
        description: message,
      });
    } finally {
      toast.dismiss(loadingToast);
      setIsLoading(false);
    }
  };

  return (
    <BasicModal title="Remove Liquidity" classNames={{ wrapper: 'w-[480px]', container: 'p-0' }} separator={false}>
      <form className="flex flex-col w-full" onSubmit={(e) => e.preventDefault()}>
        <div className="col-span-2 lg:col-span-1 flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <img src="/assets/default.png" alt={token0.symbol} className="w-8 h-8" />
                <img src="/assets/default.png" alt={token1.symbol} className="w-8 h-8 -ml-2" />
              </div>
              <span>{name}</span>
            </div>
            <div className="px-2 py-1 bg-white/10 rounded-full text-xs">{(pool.feeTier / 10000).toFixed(2)}%</div>
          </div>
        </div>

        <Divider dashed />

        <div className="flex flex-col gap-2 p-4">
          <p className="text-white/50 text-sm">Available Staked Deposit</p>
          <div className="flex w-full items-center gap-2">
            <div className="flex-1 p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <img src="/assets/default.png" alt={token0.symbol} className="w-6 h-6" />
                <div className="flex flex-col">
                  <span className="text-sm text-white/50">{token0.symbol}</span>
                  <span className="font-medium">{positionDetails.amount0Formatted.toFixed(6)}</span>
                </div>
              </div>
            </div>
            <div className="flex-1 p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <img src="/assets/default.png" alt={token1.symbol} className="w-6 h-6" />
                <div className="flex flex-col">
                  <span className="text-sm text-white/50">{token1.symbol}</span>
                  <span className="font-medium">{positionDetails.amount1Formatted.toFixed(6)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4 py-6">
          <div className="flex items-center gap-2">
            <p className="text-sm text-white/50">Remove</p>
            <Input
              onChange={(e) => setPercentage(Math.min(100, Math.max(0, Number(e.target.value))))}
              className="w-[4rem] text-lg rounded-lg"
              endContent={
                <div className="flex gap-2 items-center text-lg">
                  <span className="text-white/10">|</span>
                  <span className="text-white/50">%</span>
                </div>
              }
              value={percentage}
              type="number"
              min="0"
              max="100"
            />
            <p className="text-sm text-white/50">of Liquidity</p>
          </div>
          <RangeSelector value={percentage} onChange={setPercentage} />
        </div>

        <div className="flex flex-col gap-2 p-4">
          <p className="text-white/50 text-sm">You will receive</p>
          <div className="flex w-full items-center gap-2">
            <div className="flex-1 p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <img src="/assets/default.png" alt={token0.symbol} className="w-6 h-6" />
                <div className="flex flex-col">
                  <span className="text-sm text-white/50">{token0.symbol}</span>
                  <span className="font-medium">{removeAmounts.amount0Remove.toFixed(6)}</span>
                </div>
              </div>
            </div>
            <div className="flex-1 p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2">
                <img src="/assets/default.png" alt={token1.symbol} className="w-6 h-6" />
                <div className="flex flex-col">
                  <span className="text-sm text-white/50">{token1.symbol}</span>
                  <span className="font-medium">{removeAmounts.amount1Remove.toFixed(6)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-white/60 text-sm mt-2">Total value: {formatPrice(removeAmounts.totalUSDRemove)}</div>
        </div>

        <Divider dashed />

        <div className="p-4">
          <Button fullWidth isLoading={isLoading} onClick={handleRemoveLiquidity} isDisabled={percentage <= 0 || !address} className="bg-orange-500 hover:bg-orange-600">
            {percentage === 100 ? 'Close Position' : 'Remove Liquidity'}
          </Button>
        </div>
      </form>
    </BasicModal>
  );
};

export default ModalRemoveLiquidity;
