import { useCallback, useMemo, useRef, useState } from 'react';
import { Button } from '~/app/components/atoms/Button';
import BasicModal from '~/app/components/templates/BasicModal';

import IconCoins from '~/app/components/atoms/icons/IconCoins';
import Divider from '~/app/components/atoms/Divider';

import { useAccount } from 'wagmi';
import { ModalTypes } from '~/types/modal';
import { useModal } from '~/app/providers/ModalProvider';

import { DoubleSideAddLiquidity } from '../DoubleSideAddLiquidity';
import { FormProvider, useForm } from 'react-hook-form';

import { Popover, PopoverContent, PopoverTrigger } from '../../atoms/Popover';
import MaxSlippageSwitcher from '../MaxSlippageSwitcher';
import { IconSettingsFilled } from '@tabler/icons-react';
import { twMerge } from '~/utils/twMerge';
import { TMockPool } from '~/lib/mockPools';
import { PriceRangeSection } from '../../organisms/pool/PriceRangeSection';
import { usePriceRangeStore } from '~/stores/priceRangeStore';

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
  position?: Position; // Optional position for increasing liquidity
  isIncreasingLiquidity?: boolean; // Flag to determine if this is for increasing liquidity
  successAction?: () => void;
  className?: string;
  classNameContainer?: string;
  WrapperComponent?: React.ElementType<{ className?: string; title?: string }>;
  wrapperProps?: Record<string, any>;
}

export interface DepositFormData {
  [key: string]: string;
  slipageTolerance: string;
}

const DefaultWrapperComponent = BasicModal;
const defaultWrapperProps = {
  title: 'Add Liquidity',
  classNames: {
    wrapper: 'max-w-3xl w-full',
    container: 'p-0',
  },
};

export const ModalAddLiquidity: React.FC<Props> = ({
  pool,
  position,
  isIncreasingLiquidity = false,
  successAction,
  className,
  classNameContainer,
  WrapperComponent = DefaultWrapperComponent,
  wrapperProps = {},
}) => {
  const { token0, token1 } = pool;
  const name = `${token0.symbol} / ${token1.symbol}`;

  const { showModal } = useModal();
  const [slipageTolerance, setSlipageTolerance] = useState('0.04');
  const { isConnected } = useAccount();
  const methods = useForm({ mode: 'onChange' });
  const { errors, isSubmitting, isValid } = methods.formState;
  const { setPriceRange, minPrice, maxPrice } = usePriceRangeStore();

  const { isDisabled, text } = useMemo(() => {
    if (Object.keys(errors).length) return { isDisabled: true, text: 'Insufficient Balance' };
    if (isValid) return { isDisabled: false, text: isIncreasingLiquidity ? 'Increase Liquidity' : 'Deposit Liquidity' };
    return { isDisabled: true, text: 'Choose Amount' };
  }, [isValid, errors, isIncreasingLiquidity]);

  const submitRef = useRef<{ onSubmit: () => Promise<void> } | null>(null);

  const onSubmit = methods.handleSubmit(async (data) => {
    await submitRef.current?.onSubmit();
    if (successAction) successAction();
  });

  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleRangeChange = useCallback(
    (min: number, max: number) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setPriceRange(min, max);
        console.log('Price range updated:', { min, max });
      }, 100);
    },
    [setPriceRange]
  );

  if (WrapperComponent === BasicModal) {
    wrapperProps = {
      ...defaultWrapperProps,
      title: isIncreasingLiquidity ? 'Increase Liquidity' : 'Add Liquidity',
      ...wrapperProps,
    };
  }

  return (
    <WrapperComponent {...wrapperProps}>
      <FormProvider {...methods}>
        <form className={twMerge('flex flex-col max-w-xl', className)} onSubmit={onSubmit}>
          <Popover>
            <PopoverTrigger>
              <Button color="secondary" className="absolute top-[10px] right-12 p-2" type="button" isIconOnly>
                <IconSettingsFilled className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="flex w-full items-center justify-between gap-2 mt-2">
                <span className="text-white/50">Max Slippage</span>
                <MaxSlippageSwitcher maxSlippage={slipageTolerance} setMaxSlippage={setSlipageTolerance} />
              </div>
            </PopoverContent>
          </Popover>
          <div className={twMerge('flex flex-col gap-5 px-4 py-5', classNameContainer)}>
            <div className="flex flex-col gap-4">
              <div className="bg-white/5 w-full rounded-xl p-4 flex lg:items-center justify-between gap-4 lg:gap-1 flex-col lg:flex-row">
                <div className="flex items-center gap-3">
                  <span>{name}</span>
                  {isIncreasingLiquidity && position && <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">Position #{position.tokenId}</span>}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-white/50 text-sm">Deposit Amount</span>
                <div className="flex gap-4 flex-col">
                  <DoubleSideAddLiquidity
                    pool={pool}
                    position={position}
                    isIncreasingLiquidity={isIncreasingLiquidity}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    slippageTolerance={slipageTolerance}
                    submitRef={submitRef}
                  />
                </div>
              </div>
            </div>
          </div>
          <Divider dashed />
          {!isIncreasingLiquidity && <PriceRangeSection pool={pool} onRangeChange={handleRangeChange} />}
          <div className="px-4 py-5 flex flex-col gap-4">
            {isConnected ? (
              <Button className="w-full text-base" size="md" type="submit" isLoading={isSubmitting} isDisabled={isDisabled}>
                {text}
              </Button>
            ) : (
              <Button className="w-full text-base" size="md" type="button" onClick={() => showModal(ModalTypes.connect_wallet)}>
                Connect Wallet
              </Button>
            )}
            <div className="place-self-end gap-3 flex items-center justify-center text-xs text-white/50">
              <div className="flex gap-1 items-center justify-center">
                <IconCoins className="h-4 w-4" />
                <span>Fee</span>
              </div>
              <span className="text-white">-</span>
            </div>
          </div>
        </form>
      </FormProvider>
    </WrapperComponent>
  );
};
