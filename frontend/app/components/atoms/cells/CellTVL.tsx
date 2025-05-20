"use client";

import type React from "react";
import { twMerge } from "~/utils/twMerge";
import { formatNumber } from "~/app/hooks/usePrices";

interface Props {
  tvl: number;
  isLoading?: boolean;
  className?: string;
}

export const CellTVL: React.FC<Props> = ({ tvl, isLoading, className }) => {
  return (
    <div className={twMerge("flex flex-col gap-2", className)}>
      <p className="text-xs text-white/50 lg:hidden">TVL</p>
      <div className="flex items-center justify-between gap-3">
        <p>
          {isLoading
            ? "loading"
            : formatNumber(tvl, {
                currency: "USD",
                language: navigator.language,
              })}
        </p>
      </div>
    </div>
  );
};
