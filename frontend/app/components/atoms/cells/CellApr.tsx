import type React from "react";
import { CellData } from "./CellData";
import Tooltip from "../Tooltip";

interface Props {
  title: string;
  feeApr?: number;
  incentiveApr?: number;
  isLoading?: boolean;
  className?: string;
}

export const CellAprBreakDown: React.FC<{
  formattedApr: string;
  formattedIncentives: string;
  formatted_total_apr: string;
}> = ({ formattedApr, formattedIncentives, formatted_total_apr }) => {
  return (
    <div className="flex flex-col gap-2 p-1">
      <div className="text-tw-orange-400">APR Breakdown</div>
      <div className="flex justify-between gap-4">
        <div className="text-white/50">Swap Fees</div>
        <div>{formattedApr}</div>
      </div>
      <div className="flex justify-between gap-4">
        <div className="text-white/50">Incentives</div>
        <div>{formattedIncentives}</div>
      </div>
      <div className="h-[1px] bg-white/10" />
      <div className="flex justify-between gap-4">
        <div className="text-white/50">Net</div>
        <div>{formatted_total_apr}</div>
      </div>
    </div>
  );
};

const CellApr: React.FC<Props> = ({ title, feeApr = 0, incentiveApr = 0, isLoading, className }) => {
  const formattedApr = isLoading ? "..." : `${feeApr.toFixed(2)}%`;
  const formattedIncentives = isLoading ? "..." : `${incentiveApr.toFixed(2)}%`;
  const formatted_total_apr = isLoading ? "..." : `${(feeApr + incentiveApr).toFixed(2)}%`;

  const tooltipContent = (
    <CellAprBreakDown
      formattedApr={formattedApr}
      formattedIncentives={formattedIncentives}
      formatted_total_apr={formatted_total_apr}
    />
  );

  return (
    <CellData
      title={title}
      data={<Tooltip content={tooltipContent}>{formatted_total_apr}</Tooltip>}
      className={className}
    />
  );
};

export default CellApr;
