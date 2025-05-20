"use client";

import type React from "react";
import { twMerge } from "~/utils/twMerge";
import { formatNumber } from "~/app/hooks/usePrices";

interface Props {
  title: string;
  volume: number;
  className?: string;
  timeframe?: "7d" | "24h";
}

export const CellVolume: React.FC<Props> = ({ volume, className, timeframe = "7d" }) => {
  return (
    <div className={twMerge("flex flex-col gap-2", className)}>
      <p className="text-xs text-white/50 lg:hidden">{`Volume ${timeframe === "7d" ? "7D" : "24h"}`}</p>
      <div className="flex items-center justify-between gap-3">
        <p>
          {volume
            ? `${formatNumber(volume, { currency: "USD", language: navigator.language })}`
            : "..."}
        </p>
      </div>
    </div>
  );
};
