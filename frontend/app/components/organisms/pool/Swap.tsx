import type React from 'react';
import { useEffect, useState, useMemo } from 'react';
import RotateButton from '../../atoms/RotateButton';
import { useFormContext, FormProvider, useForm } from 'react-hook-form';
import { convertDenomToMicroDenom, convertMicroDenomToDenom } from '~/utils/intl';
import { AssetInput } from '../../atoms/AssetInput';
import type { PoolInfo } from '@towerfi/types';
import { usePrices } from '~/app/hooks/usePrices';
import { SwapPriceImpactWarning } from '../../molecules/Swap/SlippageImpactWarning';
import { TMockPool } from './Pool';

interface SwapProps {
  pool: TMockPool;
  onSubmittedTx: () => void;
}

// Internal Swap component that uses form context
const SwapInternal: React.FC<SwapProps> = ({ pool, onSubmittedTx }) => {
  const [activeInput, setActiveInput] = useState<'from' | 'to'>('from');
  const [fromToken, setFromToken] = useState(pool.assets[0]);
  const [toToken, setToToken] = useState(pool.assets[1]);
  const { getPrice } = usePrices();
  const [isLoading, setIsLoading] = useState(false);

  // Safely get form context with fallback
  let formContext;
  try {
    formContext = useFormContext();
  } catch (error) {
    // If useFormContext fails, it means we're not in a FormProvider
    formContext = null;
  }

  // If no form context is available, return null or a fallback
  if (!formContext) {
    console.warn('Swap component must be used within a FormProvider');
    return null;
  }

  const { watch, setValue, control, formState } = formContext;
  const { isSubmitting } = formState;
  const toAmount = watch('toAmount');
  const fromAmount = watch('fromAmount');

  // Simulate swap calculation
  useEffect(() => {
    if (!fromAmount && !toAmount) return;

    setIsLoading(true);
    const timer = setTimeout(() => {
      if (activeInput === 'from' && fromAmount) {
        // Use mock price ratio for simulation
        const priceRatio =
          fromToken.symbol === 'ATOM' && toToken.symbol === 'OSMO'
            ? 24.29 // 1 ATOM = ~24.29 OSMO
            : fromToken.symbol === 'OSMO' && toToken.symbol === 'ATOM'
            ? 0.041 // 1 OSMO = ~0.041 ATOM
            : 1; // Default 1:1 ratio

        const simulatedAmount = Number(fromAmount) * priceRatio;
        setValue('toAmount', simulatedAmount.toFixed(toToken.decimals), { shouldValidate: true });
      } else if (activeInput === 'to' && toAmount) {
        // Inverse calculation
        const priceRatio =
          toToken.symbol === 'ATOM' && fromToken.symbol === 'OSMO'
            ? 24.29 // 1 ATOM = ~24.29 OSMO
            : toToken.symbol === 'OSMO' && fromToken.symbol === 'ATOM'
            ? 0.041 // 1 OSMO = ~0.041 ATOM
            : 1; // Default 1:1 ratio

        const simulatedAmount = Number(toAmount) / priceRatio;
        setValue('fromAmount', simulatedAmount.toFixed(fromToken.decimals), { shouldValidate: true });
      }
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [fromAmount, toAmount, activeInput, fromToken, toToken, setValue]);

  const priceImpact = useMemo(() => {
    if (!fromAmount || !toAmount) return 0;
    const amountInUSD = getPrice(Number(fromAmount), fromToken.denom, { format: false });
    const amountOutUSD = getPrice(Number(toAmount), toToken.denom, { format: false });
    const impact = amountInUSD > 0 ? ((amountInUSD - amountOutUSD) / amountInUSD) * 100 : 0;
    return Math.abs(impact);
  }, [fromAmount, toAmount, fromToken.denom, toToken.denom, getPrice]);

  const onRotate = () => {
    const fToken = { ...fromToken };
    const tToken = { ...toToken };
    setFromToken(tToken);
    setToToken(fToken);
    setValue('fromAmount', toAmount || '');
    setValue('toAmount', fromAmount || '');
    setActiveInput('from');
  };

  return (
    <div className="flex flex-col gap-2 w-full items-center justify-center">
      <AssetInput
        name="fromAmount"
        control={control}
        assets={[fromToken, toToken]}
        disabled={isSubmitting || (isLoading && activeInput === 'to')}
        onSelect={setFromToken}
        onFocus={() => setActiveInput('from')}
      />
      <RotateButton onClick={onRotate} />
      <AssetInput
        name="toAmount"
        control={control}
        assets={[toToken, fromToken]}
        disabled={isSubmitting || (isLoading && activeInput === 'from')}
        onSelect={setToToken}
        onFocus={() => setActiveInput('to')}
        validateBalance={false}
      />
      <SwapPriceImpactWarning priceImpact={priceImpact} isLoading={isLoading} />
    </div>
  );
};

// Main Swap component with FormProvider wrapper
export const Swap: React.FC<SwapProps> = ({ pool, onSubmittedTx }) => {
  const methods = useForm({
    mode: 'onChange',
    defaultValues: {
      fromAmount: '',
      toAmount: '',
    },
  });

  return (
    <FormProvider {...methods}>
      <SwapInternal pool={pool} onSubmittedTx={onSubmittedTx} />
    </FormProvider>
  );
};
