"use client";

import type React from "react";
import { Button } from "../atoms/Button";
import { useAccount } from "@cosmi/react";
import { UserPools } from "../organisms/dashboard/UserPools";
import { useToast } from "~/app/hooks";
import Link from "next/link";

// Mock data
const MOCK_POOLS = [
  {
    poolInfo: {
      poolType: "xyk",
    },
    userBalance: {
      staked_share_amount: 150,
      lpToken: "mock-lp-token-1"
    },
    incentives: []
  },
  {
    poolInfo: {
      poolType: "stable",
    },
    userBalance: {
      staked_share_amount: 50,
      lpToken: "mock-lp-token-2"
    },
    incentives: []
  }
];

const Dashboard: React.FC = () => {
  const { address, chain } = useAccount();
  const { toast } = useToast();

  // Mock loading state
  const isPoolLoading = false;

  const filteredPools = MOCK_POOLS.filter((pool) => {
    if (pool.poolInfo.poolType === "xyk") {
      return pool.userBalance.staked_share_amount > 100;
    }
    return pool.userBalance.staked_share_amount > 0;
  });

  const handleClaimAll = async () => {
    try {
      // Mock successful claim
      const mockTxHash = "mock-tx-hash-123";
      toast.success({
        title: "Claim successful",
        component: () => (
          <div className="flex flex-col gap-1">
            <a
              className="underline hover:no-underline"
              target="_blank"
              href={`${chain?.blockExplorers?.default.url}/tx/${mockTxHash}`}
              rel="noreferrer"
            >
              See tx
            </a>
          </div>
        ),
      });
    } catch (error) {
      toast.error({
        title: "Claim Failed",
        description: `Failed to claim all your rewards. ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  //TODO: Replace for !address when there is rewards
  const claimAllDisabled = true;

  return (
    <div className="flex flex-col gap-8 px-4 max-w-[84.5rem] mx-auto w-full min-h-[65vh] lg:pt-8">
      <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center lg:pl-3 lg:pr-2 pl-3">
        <h1 className="text-xl">My Liquidity Positions</h1>
        <div className="flex gap-3 h-[42px] items-center lg:px-2">
          <Button color="tertiary" as={Link} href="/pools">
            New Position
          </Button>
          <Button onClick={handleClaimAll} isDisabled={claimAllDisabled}>
            Claim All
          </Button>
        </div>
      </div>
      <UserPools
        pools={filteredPools}
        isLoading={isPoolLoading}
        refreshUserPools={() => {}}
      />
    </div>
  );
};

export default Dashboard;
