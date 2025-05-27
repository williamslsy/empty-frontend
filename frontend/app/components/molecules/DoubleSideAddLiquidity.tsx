import { useFormContext } from 'react-hook-form';
import type React from 'react';
import { formatDecimals } from '~/utils/intl';
import { useToast } from '~/app/hooks';
import { IconWallet } from '@tabler/icons-react';
import { useModal } from '~/app/providers/ModalProvider';
import { ModalTypes } from '~/types/modal';
import { useMemo, useCallback, useImperativeHandle } from 'react';
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

    const priceRatio = token0Price > 0 && token1Price > 0 ? token0Price / token1Price : 1;

    return {
      token0Price,
      token1Price,
      priceRatio,
      adjustedRatio: priceRatio,
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

  const calculateToken1Amount = useCallback(
    (amount0: string) => {
      if (!amount0 || calculations.priceRatio <= 0) return '';
      const amount = parseFloat(amount0);
      return isNaN(amount) ? '' : formatDecimals(amount * calculations.adjustedRatio, token1.decimals);
    },
    [calculations.adjustedRatio, calculations.priceRatio, token1.decimals]
  );

  const calculateToken0Amount = useCallback(
    (amount1: string) => {
      if (!amount1 || calculations.priceRatio <= 0) return '';
      const amount = parseFloat(amount1);
      return isNaN(amount) ? '' : formatDecimals(amount / calculations.adjustedRatio, token0.decimals);
    },
    [calculations.adjustedRatio, calculations.priceRatio, token0.decimals]
  );

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
        const calculatedToken1 = calculateToken1Amount(value);
        setValue(token1.symbol, calculatedToken1, { shouldValidate: true });
      }
    },
    [setValue, token0.symbol, token1.symbol, calculateToken1Amount]
  );

  const handleToken1Change = useCallback(
    (value: string) => {
      const regex = /^\d*\.?\d*$/;
      if (value === '' || regex.test(value)) {
        setValue(token1.symbol, value, { shouldValidate: true });

        const calculatedToken0 = calculateToken0Amount(value);
        setValue(token0.symbol, calculatedToken0, { shouldValidate: true });
      }
    },
    [setValue, token0.symbol, token1.symbol, calculateToken0Amount]
  );

  const token0Balance = getBalanceAsNumber(token0.symbol);
  const token1Balance = getBalanceAsNumber(token1.symbol);

  const handleToken0Max = useCallback(() => {
    if (!isConnected || token0Balance <= 0) return;

    const maxAmount = formatDecimals(token0Balance, token0.decimals);
    setValue(token0.symbol, maxAmount, { shouldValidate: true });

    const calculatedToken1 = calculateToken1Amount(maxAmount.toString());
    setValue(token1.symbol, calculatedToken1, { shouldValidate: true });
  }, [isConnected, token0Balance, token0.decimals, token0.symbol, setValue, calculateToken1Amount, token1.symbol]);

  const handleToken1Max = useCallback(() => {
    if (!isConnected || token1Balance <= 0) return;

    const maxAmount = formatDecimals(token1Balance, token1.decimals);
    setValue(token1.symbol, maxAmount, { shouldValidate: true });

    const calculatedToken0 = calculateToken0Amount(maxAmount.toString());
    setValue(token0.symbol, calculatedToken0, { shouldValidate: true });
  }, [isConnected, token1Balance, token1.decimals, token1.symbol, setValue, calculateToken0Amount, token0.symbol]);

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

    if (!token0Amount || !token1Amount) {
      toast.error({
        title: 'Invalid amounts',
        description: 'Please enter valid token amounts',
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
        // showModal(ModalTypes.deposit_completed, true, {
        //   tokens: [
        //     { amount: token0Amount, ...token0 },
        //     { amount: token1Amount, ...token1 },
        //   ],
        // });

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
  }, [address, errors, token0Amount, token1Amount, minPrice, maxPrice, slippageTolerance, token0.symbol, token1.symbol, pool.id, mintPosition, setValue, showModal, toast, token0, token1]);

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
      <div className="flex flex-col gap-4 bg-white/5 w-full rounded-xl p-4 flex-1">
        <div className="w-full flex gap-4 items-center justify-between">
          <div className="flex items-center gap-2 p-2 pr-3 bg-white/5 rounded-full w-fit">
            <img src="/assets/default.png" alt={token0.symbol} className="w-7 h-7" />
            <span>{token0.symbol}</span>
          </div>
          <div className="flex flex-col items-end min-w-0 flex-1">
            <input
              className="text-2xl w-full bg-transparent text-right outline-none"
              placeholder="0.0"
              autoComplete="off"
              {...register(token0.symbol, {
                validate: (value) => validateAmount(value, token0Balance, token0.symbol),
              })}
              value={token0Amount}
              onChange={(e) => handleToken0Change(e.target.value)}
            />
            {errors[token0.symbol] && <span className="text-red-400 text-xs mt-1">{errors[token0.symbol]?.message as string}</span>}
          </div>
        </div>

        <div className="flex gap-2 items-center justify-between text-white/50 text-xs">
          <button
            type="button"
            className={`flex gap-1 items-center transition-colors ${isConnected && token0Balance > 0 ? 'cursor-pointer hover:text-white' : 'cursor-not-allowed opacity-50'}`}
            onClick={handleToken0Max}
            disabled={!isConnected || token0Balance <= 0}
          >
            <IconWallet className="h-4 w-4" />
            <span>Balance: {isConnected ? token0Balance.toFixed(4) : '0.0000'}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="bg-white/10 px-2 py-0.5 rounded">{formatPrice(usdValues.token0USD)}</span>
            <button
              type="button"
              onClick={handleToken0Max}
              className={`font-medium transition-colors ${isConnected && token0Balance > 0 ? 'text-blue-400 hover:text-blue-300 cursor-pointer' : 'text-gray-500 cursor-not-allowed opacity-50'}`}
              disabled={!isConnected || token0Balance <= 0}
            >
              MAX
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-white/5 w-full rounded-xl p-4 flex-1">
        <div className="w-full flex gap-4 items-center justify-between">
          <div className="flex items-center gap-2 p-2 pr-3 bg-white/5 rounded-full w-fit">
            <img src="/assets/default.png" alt={token1.symbol} className="w-7 h-7" />
            <span>{token1.symbol}</span>
          </div>
          <div className="flex flex-col items-end min-w-0 flex-1">
            <input
              className="text-2xl w-full bg-transparent text-right outline-none"
              placeholder="0.0"
              autoComplete="off"
              {...register(token1.symbol, {
                validate: (value) => validateAmount(value, token1Balance, token1.symbol),
              })}
              value={token1Amount}
              onChange={(e) => handleToken1Change(e.target.value)}
            />
            {errors[token1.symbol] && <span className="text-red-400 text-xs mt-1">{errors[token1.symbol]?.message as string}</span>}
          </div>
        </div>

        <div className="flex gap-2 items-center justify-between text-white/50 text-xs">
          <button
            type="button"
            className={`flex gap-1 items-center transition-colors ${isConnected && token1Balance > 0 ? 'cursor-pointer hover:text-white' : 'cursor-not-allowed opacity-50'}`}
            onClick={handleToken1Max}
            disabled={!isConnected || token1Balance <= 0}
          >
            <IconWallet className="h-4 w-4" />
            <span>Balance: {isConnected ? token1Balance.toFixed(4) : '0.0000'}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="bg-white/10 px-2 py-0.5 rounded">{formatPrice(usdValues.token1USD)}</span>
            <button
              type="button"
              onClick={handleToken1Max}
              className={`font-medium transition-colors ${isConnected && token1Balance > 0 ? 'text-blue-400 hover:text-blue-300 cursor-pointer' : 'text-gray-500 cursor-not-allowed opacity-50'}`}
              disabled={!isConnected || token1Balance <= 0}
            >
              MAX
            </button>
          </div>
        </div>
      </div>
      <div className="space-y-1 text-sm text-white/50">
        <div>
          Current Price: 1 {token0.symbol} = {calculations.priceRatio.toFixed(6)} {token1.symbol}
        </div>
        <div className="text-white/70 font-medium">Total Value: {formatPrice(usdValues.totalUSD)}</div>
      </div>
    </div>
  );
};
