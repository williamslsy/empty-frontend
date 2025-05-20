import type React from "react";
import { twMerge } from "~/utils/twMerge";
import Tooltip from "../Tooltip";

import { convertMicroDenomToDenom, toFullNumberString } from "~/utils/intl";
import { formatNumber } from "~/app/hooks/usePrices";

interface Token {
  symbol: string;
  amount: number;
  logoURI: string;
  price: number;
}

interface Props {
  title: string;
  amount: number;
  className?: string;
  tokens: Token[];
}

export const CellDataToken: React.FC<Props> = ({
  title,
  amount,
  className,
  tokens,
}) => {
  const [token0, token1] = tokens;

  if (!token0 || !token1) {
    return (
      <div className={twMerge("flex flex-col gap-2", className)}>
        <p className="text-xs text-white/50 lg:hidden">{title}</p>
        <div className="flex items-center justify-between gap-3">
          <p>{amount}</p>
        </div>
      </div>
    );
  }

  const token0Value = token0.amount * token0.price;
  const token1Value = token1.amount * token1.price;
  const dollarValueAmount = formatNumber(token0Value + token1Value, {
    currency: "USD",
    language: navigator.language,
  });

  return (
    <div className={twMerge("flex flex-col gap-2", className)}>
      <p className="text-xs text-white/50 lg:hidden">{title}</p>

      <div className="flex items-center justify-between gap-3">
        <Tooltip
          className="min-w-[10rem]"
          content={
            <div className="flex flex-col gap-3 w-full">
              <p className="text-sm text-tw-orange-400">Total {title}</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <img
                      src={token0.logoURI}
                      alt={token0.symbol}
                      className="grayscale w-3 h-3 select-none"
                      draggable={false}
                    />
                    <p>{token0.symbol}</p>
                  </div>
                  <p>{token0.amount}</p>
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-1 text-gray-500 ">
                    <img src={token1.logoURI} alt={token1.symbol} className="grayscale w-3 h-3" />
                    <p>{token1.symbol}</p>
                  </div>
                  <p>{token1.amount}</p>
                </div>
              </div>
            </div>
          }
        >
          <p>{dollarValueAmount}</p>
        </Tooltip>
      </div>
    </div>
  );
};
