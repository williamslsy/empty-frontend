import { useFormContext } from 'react-hook-form';
import type React from 'react';
import { formatDecimals } from '~/utils/intl';
import { useToast } from '~/app/hooks';
import { IconWallet } from '@tabler/icons-react';
import { useModal } from '~/app/providers/ModalProvider';
import { ModalTypes } from '~/types/modal';
import { useMemo, useCallback, useImperativeHandle, useEffect, memo } from 'react';
import { TMockPool } from '~/lib/mockPools';
import { useTokenPrices } from '~/app/hooks/useTokenPrices';
import { useWalletBalances } from '~/app/hooks/useWalletBalances';
import { useManagePosition } from '~/app/hooks/useManagePosition';
import { useAccount } from 'wagmi';

interface Position {
  tokenId: number;
  liquidity: string;
  tickLower: number;
  tickUpper: number;
  tokensOwed0: string;
  tokensOwed1: string;
}

interface Props {
  pool: TMockPool;
  position?: Position;
  isIncreasingLiquidity?: boolean;
  minPrice: number;
  maxPrice: number;
  slippageTolerance: string;
  submitRef: React.MutableRefObject<{ onSubmit: () => Promise<void> } | null>;
}

// Uniswap V3 concentrated liquidity calculations
const getSqrtPrice = (price: number): number => {
  return Math.sqrt(price);
};

const calculateLiquidityAmounts = (currentPrice: number, lowerPrice: number, upperPrice: number, amount0?: number, amount1?: number) => {
  if (currentPrice <= 0 || lowerPrice <= 0 || upperPrice <= 0 || lowerPrice >= upperPrice) {
    return { amount0: 0, amount1: 0, liquidity: 0 };
  }

  const sqrtCurrentPrice = getSqrtPrice(currentPrice);
  const sqrtLowerPrice = getSqrtPrice(lowerPrice);
  const sqrtUpperPrice = getSqrtPrice(upperPrice);

  // Case 1: Current price is below the range (only token0 needed)
  if (currentPrice < lowerPrice) {
    if (amount0) {
      const liquidity = amount0 / (1 / sqrtLowerPrice - 1 / sqrtUpperPrice);
      return { amount0, amount1: 0, liquidity };
    }
    // If amount1 is provided but we're below range, we can't use token1
    return { amount0: 0, amount1: 0, liquidity: 0 };
  }

  // Case 2: Current price is above the range (only token1 needed)
  if (currentPrice > upperPrice) {
    if (amount1) {
      const liquidity = amount1 / (sqrtUpperPrice - sqrtLowerPrice);
      return { amount0: 0, amount1, liquidity };
    }
    // If amount0 is provided but we're above range, we can't use token0
    return { amount0: 0, amount1: 0, liquidity: 0 };
  }

  // Case 3: Current price is within the range (both tokens needed)
  if (amount0) {
    // Calculate liquidity from token0 amount
    const liquidity0 = amount0 / (1 / sqrtCurrentPrice - 1 / sqrtUpperPrice);

    // Calculate required token1 amount
    const requiredAmount1 = liquidity0 * (sqrtCurrentPrice - sqrtLowerPrice);

    return { amount0, amount1: requiredAmount1, liquidity: liquidity0 };
  }

  if (amount1) {
    // Calculate liquidity from token1 amount
    const liquidity1 = amount1 / (sqrtCurrentPrice - sqrtLowerPrice);

    // Calculate required token0 amount
    const requiredAmount0 = liquidity1 * (1 / sqrtCurrentPrice - 1 / sqrtUpperPrice);

    return { amount0: requiredAmount0, amount1, liquidity: liquidity1 };
  }

  return { amount0: 0, amount1: 0, liquidity: 0 };
};

// TokenInput component moved outside and memoized
interface TokenInputProps {
  symbol: string;
  amount: string;
  balance: number;
  onAmountChange: (value: string) => void;
  onMaxClick: () => void;
  usdValue: number;
  isConnected: boolean;
  error?: string;
  formatPrice: (value: number) => string;
  decimals: number;
}

const TokenInput = memo(({ symbol, amount, balance, onAmountChange, onMaxClick, usdValue, isConnected, error, formatPrice, decimals }: TokenInputProps) => (
  <div className="flex flex-col gap-4 bg-white/5 w-full rounded-xl p-4 flex-1">
    <div className="w-full flex gap-4 items-center justify-between">
      <div className="flex items-center gap-2 p-2 pr-3 bg-white/5 rounded-full w-fit">
        <img src="/assets/default.png" alt={symbol} className="w-7 h-7" />
        <span>{symbol}</span>
      </div>
      <div className="flex flex-col items-end min-w-0 flex-1">
        <input className="text-2xl w-full bg-transparent text-right outline-none" placeholder="0.0" autoComplete="off" name={symbol} value={amount} onChange={(e) => onAmountChange(e.target.value)} />
        {error && <span className="text-red-400 text-xs mt-1">{error}</span>}
      </div>
    </div>

    <div className="flex gap-2 items-center justify-between text-white/50 text-xs">
      <button
        type="button"
        className={`flex gap-1 items-center transition-colors ${isConnected && balance > 0 ? 'cursor-pointer hover:text-white' : 'cursor-not-allowed opacity-50'}`}
        onClick={onMaxClick}
        disabled={!isConnected || balance <= 0}
      >
        <IconWallet className="h-4 w-4" />
        <span>Balance: {isConnected ? formatDecimals(balance, decimals) : '0.0000'}</span>
      </button>
      <div className="flex items-center gap-2">
        <span className="bg-white/10 px-2 py-0.5 rounded">{formatPrice(usdValue)}</span>
        <button
          type="button"
          onClick={onMaxClick}
          className={`font-medium transition-colors ${isConnected && balance > 0 ? 'text-blue-400 hover:text-blue-300 cursor-pointer' : 'text-gray-500 cursor-not-allowed opacity-50'}`}
          disabled={!isConnected || balance <= 0}
        >
          MAX
        </button>
      </div>
    </div>
  </div>
));

export const DoubleSideAddLiquidity: React.FC<Props> = ({ pool, position, isIncreasingLiquidity = false, minPrice, maxPrice, slippageTolerance, submitRef }) => {
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const { getTokenPrice, getTokenPriceOnly, formatPrice } = useTokenPrices();
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const { showModal, hideModal } = useModal();
  const { getBalanceAsNumber, isLoading: isLoadingBalances } = useWalletBalances();
  const { mintPosition, increaseLiquidity } = useManagePosition();
  const { address } = useAccount();

  const { token0, token1 } = pool;

  const token0Amount = watch(token0.symbol, '');
  const token1Amount = watch(token1.symbol, '');

  const calculations = useMemo(() => {
    const token0Price = getTokenPriceOnly(token0.id || token0.symbol);
    const token1Price = getTokenPriceOnly(token1.id || token1.symbol);

    const currentPrice = token0Price > 0 && token1Price > 0 ? token0Price / token1Price : 1;

    return {
      token0Price,
      token1Price,
      currentPrice,
    };
  }, [token0.id, token0.symbol, token1.id, token1.symbol, getTokenPriceOnly]);

  const usdValues = useMemo(() => {
    const token0USD = getTokenPrice(token0.id || token0.symbol, token0Amount);
    const token1USD = getTokenPrice(token1.id || token1.symbol, token1Amount);

    return {
      token0USD,
      token1USD,
      totalUSD: token0USD + token1USD,
    };
  }, [token0Amount, token1Amount, token0.id, token0.symbol, token1.id, token1.symbol, getTokenPrice]);

  // Position info for debugging/display
  const positionInfo = useMemo(() => {
    const { currentPrice } = calculations;
    if (currentPrice <= 0 || minPrice <= 0 || maxPrice <= 0) {
      return { isInRange: false, positionType: 'invalid', token0Only: false, token1Only: false };
    }

    const isInRange = currentPrice >= minPrice && currentPrice <= maxPrice;
    const token0Only = currentPrice < minPrice;
    const token1Only = currentPrice > maxPrice;

    let positionType: string;
    if (token0Only) positionType = 'token0-only';
    else if (token1Only) positionType = 'token1-only';
    else positionType = 'balanced';

    return { isInRange, positionType, token0Only, token1Only };
  }, [calculations.currentPrice, minPrice, maxPrice]);

  const token0Balance = getBalanceAsNumber(token0.symbol);
  const token1Balance = getBalanceAsNumber(token1.symbol);

  // Uniswap V3 calculation functions
  const calculateToken1Amount = useCallback(
    (amount0: string): string => {
      if (!amount0 || parseFloat(amount0) <= 0 || !calculations.currentPrice || !minPrice || !maxPrice) {
        return '';
      }

      const numAmount0 = parseFloat(amount0);
      const result = calculateLiquidityAmounts(calculations.currentPrice, minPrice, maxPrice, numAmount0);

      return result.amount1 > 0 ? result.amount1.toFixed(Math.min(token1.decimals, 8)) : '';
    },
    [calculations.currentPrice, minPrice, maxPrice, token1.decimals]
  );

  const calculateToken0Amount = useCallback(
    (amount1: string): string => {
      if (!amount1 || parseFloat(amount1) <= 0 || !calculations.currentPrice || !minPrice || !maxPrice) {
        return '';
      }

      const numAmount1 = parseFloat(amount1);
      const result = calculateLiquidityAmounts(calculations.currentPrice, minPrice, maxPrice, undefined, numAmount1);

      return result.amount0 > 0 ? result.amount0.toFixed(Math.min(token0.decimals, 8)) : '';
    },
    [calculations.currentPrice, minPrice, maxPrice, token0.decimals]
  );

  // Register the fields with validation but use controlled inputs
  useEffect(() => {
    register(token0.symbol, {
      validate: (value) => validateAmount(value, token0Balance, token0.symbol),
    });
    register(token1.symbol, {
      validate: (value) => validateAmount(value, token1Balance, token1.symbol),
    });
  }, [register, token0.symbol, token1.symbol, token0Balance, token1Balance]);
  useEffect(() => {
    if (token0Amount && calculateToken1Amount) {
      const newToken1Amount = calculateToken1Amount(token0Amount);
      if (newToken1Amount !== token1Amount) {
        setValue(token1.symbol, newToken1Amount, { shouldValidate: true });
      }
    }
  }, [minPrice, maxPrice, calculateToken1Amount, token0Amount, token1Amount, setValue, token1.symbol]);

  const validateAmount = (value: string, balance: number, tokenSymbol: string) => {
    if (value === '') return 'Amount is required';
    if (Number.isNaN(+value)) return 'Only enter valid numbers';
    if (Number(value) > balance) return `Insufficient ${tokenSymbol} balance`;
    if (Number(value) <= 0) return 'Amount must be greater than 0';
    return true;
  };

  const handleToken0Change = useCallback(
    (value: string) => {
      const regex = /^\d*\.?\d*$/;
      if (value === '' || regex.test(value)) {
        setValue(token0.symbol, value, { shouldValidate: true });

        // Only calculate token1 if position requires both tokens
        if (positionInfo.positionType === 'balanced') {
          const calculatedToken1 = calculateToken1Amount(value);
          setValue(token1.symbol, calculatedToken1, { shouldValidate: true });
        } else if (positionInfo.token0Only) {
          // Clear token1 for single-sided token0 position
          setValue(token1.symbol, '', { shouldValidate: true });
        }
      }
    },
    [setValue, token0.symbol, token1.symbol, calculateToken1Amount, positionInfo]
  );

  const handleToken1Change = useCallback(
    (value: string) => {
      const regex = /^\d*\.?\d*$/;
      if (value === '' || regex.test(value)) {
        setValue(token1.symbol, value, { shouldValidate: true });

        // Only calculate token0 if position requires both tokens
        if (positionInfo.positionType === 'balanced') {
          const calculatedToken0 = calculateToken0Amount(value);
          setValue(token0.symbol, calculatedToken0, { shouldValidate: true });
        } else if (positionInfo.token1Only) {
          // Clear token0 for single-sided token1 position
          setValue(token0.symbol, '', { shouldValidate: true });
        }
      }
    },
    [setValue, token0.symbol, token1.symbol, calculateToken0Amount, positionInfo]
  );

  const handleToken0Max = useCallback(() => {
    if (!isConnected || token0Balance <= 0) return;

    const maxAmount = formatDecimals(token0Balance, token0.decimals);
    setValue(token0.symbol, maxAmount, { shouldValidate: true });

    // Only calculate token1 if position requires both tokens
    if (positionInfo.positionType === 'balanced') {
      const calculatedToken1 = calculateToken1Amount(maxAmount.toString());
      setValue(token1.symbol, calculatedToken1, { shouldValidate: true });
    } else if (positionInfo.token0Only) {
      // Clear token1 for single-sided token0 position
      setValue(token1.symbol, '', { shouldValidate: true });
    }
  }, [isConnected, token0Balance, token0.decimals, token0.symbol, setValue, calculateToken1Amount, token1.symbol, positionInfo]);

  const handleToken1Max = useCallback(() => {
    if (!isConnected || token1Balance <= 0) return;

    const maxAmount = formatDecimals(token1Balance, token1.decimals);
    setValue(token1.symbol, maxAmount, { shouldValidate: true });

    // Only calculate token0 if position requires both tokens
    if (positionInfo.positionType === 'balanced') {
      const calculatedToken0 = calculateToken0Amount(maxAmount.toString());
      setValue(token0.symbol, calculatedToken0, { shouldValidate: true });
    } else if (positionInfo.token1Only) {
      // Clear token0 for single-sided token1 position
      setValue(token0.symbol, '', { shouldValidate: true });
    }
  }, [isConnected, token1Balance, token1.decimals, token1.symbol, setValue, calculateToken0Amount, token0.symbol, positionInfo]);

  // Recalculate amounts when price range changes (but only if user has entered values)
  useEffect(() => {
    // Only recalculate if we have valid price range and user has entered amounts
    if (minPrice > 0 && maxPrice > 0 && minPrice < maxPrice) {
      if (token0Amount && parseFloat(token0Amount) > 0) {
        // User has token0 amount, recalculate token1 based on new range
        if (positionInfo.positionType === 'balanced') {
          const calculatedToken1 = calculateToken1Amount(token0Amount);
          if (calculatedToken1 !== token1Amount) {
            setValue(token1.symbol, calculatedToken1, { shouldValidate: false });
          }
        } else if (positionInfo.token0Only && token1Amount) {
          // Clear token1 for single-sided token0 position
          setValue(token1.symbol, '', { shouldValidate: false });
        }
      } else if (token1Amount && parseFloat(token1Amount) > 0) {
        // User has token1 amount, recalculate token0 based on new range
        if (positionInfo.positionType === 'balanced') {
          const calculatedToken0 = calculateToken0Amount(token1Amount);
          if (calculatedToken0 !== token0Amount) {
            setValue(token0.symbol, calculatedToken0, { shouldValidate: false });
          }
        } else if (positionInfo.token1Only && token0Amount) {
          // Clear token0 for single-sided token1 position
          setValue(token0.symbol, '', { shouldValidate: false });
        }
      }
    }
  }, [minPrice, maxPrice, positionInfo.positionType, calculateToken0Amount, calculateToken1Amount, setValue, token0.symbol, token1.symbol, token0Amount, token1Amount]);

  const handleSubmit = useCallback(async () => {
    if (!address) {
      toast.error({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to continue',
      });
      return;
    }

    if (Object.keys(errors).length > 0) {
      toast.error({
        title: 'Form validation failed',
        description: 'Please fix the errors in the form',
      });
      return;
    }

    // Check if required amounts are provided based on position type
    const requiredToken0 = positionInfo.positionType === 'balanced' || positionInfo.token0Only;
    const requiredToken1 = positionInfo.positionType === 'balanced' || positionInfo.token1Only;

    if ((requiredToken0 && !token0Amount) || (requiredToken1 && !token1Amount)) {
      toast.error({
        title: 'Invalid amounts',
        description: `Please enter ${positionInfo.positionType === 'token0-only' ? token0.symbol : positionInfo.positionType === 'token1-only' ? token1.symbol : 'valid token amounts'}`,
      });
      return;
    }

    if (!isIncreasingLiquidity && (minPrice <= 0 || maxPrice <= 0 || minPrice >= maxPrice)) {
      toast.error({
        title: 'Invalid price range',
        description: 'Please set a valid price range',
      });
      return;
    }

    const id = toast.loading(
      {
        title: 'Preparing transaction',
        description: isIncreasingLiquidity
          ? `Preparing to increase liquidity with ${token0Amount} ${token0.symbol} and ${token1Amount} ${token1.symbol}`
          : `Preparing to deposit ${token0Amount} ${token0.symbol} and ${token1Amount} ${token1.symbol}`,
      },
      { duration: Number.POSITIVE_INFINITY }
    );

    try {
      let success: boolean;

      if (isIncreasingLiquidity && position) {
        success = await increaseLiquidity(position.tokenId, pool.id, String(token0Amount), String(token1Amount));
      } else {
        success = await mintPosition({
          poolAddress: pool.id,
          token0Amount: String(token0Amount),
          token1Amount: String(token1Amount),
          minPrice: String(minPrice),
          maxPrice: String(maxPrice),
          slippageTolerance: Number(slippageTolerance),
          recipient: address,
        });
      }

      if (success) {
        setValue(token0.symbol, '');
        setValue(token1.symbol, '');
        hideModal();

        toast.success({
          title: isIncreasingLiquidity ? 'Liquidity increased successfully' : 'Position created successfully',
          description: `Successfully ${isIncreasingLiquidity ? 'increased liquidity with' : 'deposited'} ${token0Amount} ${token0.symbol} and ${token1Amount} ${token1.symbol}`,
        });
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: unknown) {
      console.error('Deposit error:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error({
        title: isIncreasingLiquidity ? 'Increase liquidity failed' : 'Deposit failed',
        description: message,
      });
    } finally {
      toast.dismiss(id);
    }
  }, [
    address,
    errors,
    token0Amount,
    token1Amount,
    minPrice,
    maxPrice,
    slippageTolerance,
    token0.symbol,
    token1.symbol,
    pool.id,
    mintPosition,
    setValue,
    toast,
    token0,
    token1,
    isIncreasingLiquidity,
    position,
    increaseLiquidity,
    hideModal,
  ]);

  useImperativeHandle(
    submitRef,
    () => ({
      onSubmit: handleSubmit,
    }),
    [handleSubmit]
  );

  if (isConnected && isLoadingBalances) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 bg-white/5 w-full rounded-xl p-4 flex-1">
          <div className="animate-pulse bg-white/10 h-8 rounded"></div>
          <div className="animate-pulse bg-white/10 h-4 rounded w-1/2"></div>
        </div>
        <div className="flex flex-col gap-4 bg-white/5 w-full rounded-xl p-4 flex-1">
          <div className="animate-pulse bg-white/10 h-8 rounded"></div>
          <div className="animate-pulse bg-white/10 h-4 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Show only needed token inputs based on position type */}
      {(positionInfo.positionType === 'balanced' || positionInfo.token0Only) && (
        <TokenInput
          symbol={token0.symbol}
          amount={token0Amount}
          balance={token0Balance}
          onAmountChange={handleToken0Change}
          onMaxClick={handleToken0Max}
          usdValue={usdValues.token0USD}
          isConnected={isConnected}
          error={errors[token0.symbol]?.message as string | undefined}
          formatPrice={formatPrice}
          decimals={token0.decimals}
        />
      )}

      {(positionInfo.positionType === 'balanced' || positionInfo.token1Only) && (
        <TokenInput
          symbol={token1.symbol}
          amount={token1Amount}
          balance={token1Balance}
          onAmountChange={handleToken1Change}
          onMaxClick={handleToken1Max}
          usdValue={usdValues.token1USD}
          isConnected={isConnected}
          error={errors[token1.symbol]?.message as string | undefined}
          formatPrice={formatPrice}
          decimals={token1.decimals}
        />
      )}

      {/* Single-sided deposit message */}
      {positionInfo.positionType !== 'balanced' && positionInfo.positionType !== 'invalid' && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="text-blue-400 text-sm">💡</div>
            <div className="text-blue-400 text-sm">
              <div className="font-medium mb-1">Single-Sided Deposit</div>
              <div className="text-xs text-blue-400/80">
                Current price is {positionInfo.token0Only ? 'below' : 'above'} your selected range. Only {positionInfo.token0Only ? token0.symbol : token1.symbol} is needed for this position.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Position Info */}
      <div className="space-y-1 text-sm text-white/50">
        <div>
          Current Price: 1 {token0.symbol} = {calculations.currentPrice.toFixed(6)} {token1.symbol}
        </div>
        <div className="text-white/70 font-medium">Total Value: {formatPrice(usdValues.totalUSD)}</div>

        {/* Position Status Indicator */}
        {positionInfo.positionType !== 'invalid' && (
          <div className="flex items-center gap-2 text-xs">
            <div className={`px-2 py-1 rounded ${positionInfo.isInRange ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
              {positionInfo.isInRange ? 'In Range' : 'Out of Range'}
            </div>
            <span className="text-white/40">
              {positionInfo.positionType === 'token0-only' && `Only ${token0.symbol} needed`}
              {positionInfo.positionType === 'token1-only' && `Only ${token1.symbol} needed`}
              {positionInfo.positionType === 'balanced' && 'Both tokens needed'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
