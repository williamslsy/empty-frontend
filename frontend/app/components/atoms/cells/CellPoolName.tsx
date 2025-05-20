import type React from "react";
import AssetsStacked from "../AssetsStacked";
import { twMerge } from "~/utils/twMerge";
import { PoolFeePill, PoolIncentivesPill, PoolTypePill, type PoolType, type Incentive } from "../PoolPill";

interface Token {
  symbol: string;
  logoURI: string;
}

interface Props {
  assets: Token[];
  name: string;
  poolType: PoolType;
  fee: number;
  className?: string;
  incentive?: Incentive;
}

export const CellPoolName: React.FC<Props> = ({
  assets,
  name,
  poolType,
  fee,
  className,
  incentive,
}) => {
  return (
    <div className={twMerge("col-span-2 lg:col-span-1 flex flex-col gap-2", className)}>
      <p className="text-xs text-white/50 lg:hidden">Pool</p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3">
          <AssetsStacked assets={assets} />
          <span>{name}</span>
        </div>
      </div>
      <div className="flex gap-1">
        <PoolTypePill poolType={poolType} />
        <PoolFeePill fee={fee} />
        {incentive && <PoolIncentivesPill incentive={incentive} />}
      </div>
    </div>
  );
};
