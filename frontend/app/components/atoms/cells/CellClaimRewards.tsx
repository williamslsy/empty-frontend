import type React from "react";
import { Button } from "../Button";
import { twMerge } from "~/utils/twMerge";
import Tooltip from "../Tooltip";
import { useToast } from "~/app/hooks";

interface Reward {
  symbol: string;
  amount: number;
  logoURI: string;
}

interface Props {
  title?: string;
  rewards: Reward[];
  className?: string;
  stakedAmount?: number;
  onClaim?: () => Promise<void>;
  isLoading?: boolean;
}

export const CellClaimRewards: React.FC<Props> = ({
  title = "Claimable Rewards",
  rewards,
  className,
  stakedAmount,
  onClaim,
  isLoading = false,
}) => {
  const { toast } = useToast();

  const handleClaim = async () => {
    if (!onClaim) return;
    
    try {
      await onClaim();
      toast.success({
        title: "Claim successful",
      });
    } catch (error) {
      toast.error({
        title: "Claim Failed",
        description: `Failed to claim your rewards. ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  const totalValue = rewards.reduce((sum, reward) => sum + reward.amount, 0);
  const totalValueFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalValue);

  const hasRewards = totalValue > 0 || rewards.some((r) => r.amount > 0);

  if (!stakedAmount) {
    return (
      <div className={twMerge("flex flex-col gap-2", className)}>
        <p className="text-xs text-white/50 lg:hidden">{title}</p>
        <div className="flex gap-2 items-center">
          <Button
            color="secondary"
            size="sm"
            onClick={handleClaim}
            isLoading={isLoading}
            isDisabled={stakedAmount === 0 || isLoading}
          >
            Claim
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={twMerge("flex flex-col gap-2", className)}>
      <p className="text-xs text-white/50 lg:hidden">{title}</p>
      <div className="flex gap-2 items-center">
        {hasRewards ? (
          <Tooltip
            content={
              <div className="flex flex-col gap-2">
                <p className="text-tw-orange-400">Total assets</p>
                <div className="flex flex-col gap-1">
                  {rewards.map((reward, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                      <div className="flex gap-1 items-center">
                        <img src={reward.logoURI} alt={reward.symbol} className="w-4 h-4" />
                        <p className="text-xs text-white/50">{reward.symbol}</p>
                      </div>
                      <p className="flex gap-2 flex-col text-center">
                        {reward.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            }
          >
            {totalValueFormatted}
          </Tooltip>
        ) : (
          "$0.00"
        )}
        <Button
          color="secondary"
          size="sm"
          onClick={handleClaim}
          isLoading={isLoading}
          isDisabled={
            isLoading || rewards.length === 0 || rewards.every((r) => r.amount === 0)
          }
        >
          Claim
        </Button>
      </div>
    </div>
  );
};
