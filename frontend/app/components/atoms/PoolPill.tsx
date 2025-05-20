import { IconInfoCircleFilled } from "@tabler/icons-react";
import Pill from "./Pill";
import Tooltip from "./Tooltip";
import { twMerge } from "~/utils/twMerge";

export type PoolType = "xyk" | "concentrated" | "stable" | "weighted";

export type PoolConfig = {
  type: PoolType;
  fee: {
    min: number;
    max: number;
  };
};

export type Incentive = {
  symbol: string;
  amount: number;
  startDate: Date;
  endDate: Date;
};

// needs EVM pool support
export const getPoolTypeDescription = (poolType: PoolType) => {
  switch (poolType) {
    case "concentrated":
      return "PCL";
    case "xyk":
      return "XYK";
    case "stable":
      return "Stable";
    case "weighted":
      return "Weighted";
  }
};

export const PoolTypePill: React.FC<{
  poolType: PoolType;
}> = ({ poolType }) => {
  return (
    <Pill color={poolType === "xyk" ? "green" : "blue"}>
      {getPoolTypeDescription(poolType)}
    </Pill>
  );
};

export const PoolFeePill: React.FC<{
  fee: number;
}> = ({ fee }) => {
  return (
    <Pill>
      {`${(fee * 100).toFixed(2)}%`}
    </Pill>
  );
};

export const PoolIncentivesPill: React.FC<{
  incentive?: Incentive;
  className?: string;
}> = ({ incentive, className }) => {
  const tooltipContent = (
    <div className="flex flex-col gap-3 p-2">
      <div className="flex items-center gap-2">
        <div className="text-tw-orange-400 font-medium">Incentives</div>
        <a
          href="https://docs.tower.fi/incentive-campaigns"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline text-sm"
        >
          View campaigns
        </a>
      </div>
      {incentive && (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-white/50">Current Campaigns:</div>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/80">
                {incentive.symbol}
              </span>
              <span className="text-white/80 ml-2">
                {incentive.amount}/day
              </span>
            </div>
            <div className="text-xs text-white/50">
              {incentive.startDate.toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
              })}{" "}
              →{" "}
              {incentive.endDate.toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={twMerge("flex items-center gap-2", className)}>
      {!!incentive && (
        <Pill color="yellow">
          <Tooltip content={tooltipContent}>
            <div className="flex items-center gap-1">
              Incentivized
              <IconInfoCircleFilled className="w-4 h-4" />
            </div>
          </Tooltip>
        </Pill>
      )}
    </div>
  );
};
