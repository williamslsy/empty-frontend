"use client";
import Input from "../atoms/Input";
import { Button } from "../atoms/Button";
import { twMerge } from "~/utils/twMerge";
import type React from "react";
import PoolsSkeleton from "../molecules/skeletons/PoolsSkeleton";
import { CellPoolName } from "../atoms/cells/CellPoolName";
import { CellTVL } from "../atoms/cells/CellTVL";
import { Table, TableRow } from "../atoms/Table";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Pagination } from "../atoms/Pagination";
import { CellVolume } from "../atoms/cells/CellVolume";
import { CellPoints } from "../atoms/cells/CellPoints";
import CellApr from "../atoms/cells/CellApr";
import { useRouter } from "next/navigation";
import { PeriodToggle, type Period } from "../atoms/PeriodToggle";
import type { PoolType } from "../atoms/PoolPill";
import type { Incentive } from "../atoms/PoolPill";

// Mock data types
interface Token {
  symbol: string;
  denom: string;
  decimals: number;
  logoURI: string;
}

interface MockPool {
  poolAddress: string;
  name: string;
  poolType: PoolType;
  poolLiquidity: number;
  assets: Token[];
  config: {
    fee: number;
  };
}

interface MockMetric {
  tvl_usd: number;
  average_apr: number;
  token0_swap_volume: number;
  token1_swap_volume: number;
  token0_decimals: number;
  token1_decimals: number;
  token0_denom: string;
  token1_denom: string;
}

interface MockIncentive {
  rewards_per_second: number;
  token_decimals: number;
  reward_token: string;
}

// Mock data
const mockPools: MockPool[] = [
  {
    poolAddress: "0x1234...5678",
    name: "ETH/USDC",
    poolType: "stable",
    poolLiquidity: 1000000,
    assets: [
      {
        symbol: "ETH",
        denom: "ETH",
        decimals: 18,
        logoURI: "https://raw.githubusercontent.com/quasar-finance/quasar-resources/main/assets/tokens/eth.webp"
      },
      {
        symbol: "USDC",
        denom: "USDC",
        decimals: 6,
        logoURI: "https://raw.githubusercontent.com/quasar-finance/quasar-resources/main/assets/tokens/usdc.webp"
      }
    ],
    config: {
      fee: 0.003
    }
  },
  {
    poolAddress: "0x8765...4321",
    name: "WBTC/ETH",
    poolType: "weighted",
    poolLiquidity: 2000000,
    assets: [
      {
        symbol: "WBTC",
        denom: "WBTC",
        decimals: 8,
        logoURI: "https://raw.githubusercontent.com/quasar-finance/quasar-resources/main/assets/tokens/wbtc.webp"
      },
      {
        symbol: "ETH",
        denom: "ETH",
        decimals: 18,
        logoURI: "https://raw.githubusercontent.com/quasar-finance/quasar-resources/main/assets/tokens/eth.webp"
      }
    ],
    config: {
      fee: 0.003
    }
  }
];

const mockMetrics: Record<string, MockMetric> = {
  "0x1234...5678": {
    tvl_usd: 1000000,
    average_apr: 0.05,
    token0_swap_volume: 100000,
    token1_swap_volume: 100000,
    token0_decimals: 18,
    token1_decimals: 6,
    token0_denom: "ETH",
    token1_denom: "USDC"
  },
  "0x8765...4321": {
    tvl_usd: 2000000,
    average_apr: 0.06,
    token0_swap_volume: 200000,
    token1_swap_volume: 200000,
    token0_decimals: 8,
    token1_decimals: 18,
    token0_denom: "WBTC",
    token1_denom: "ETH"
  }
};

const mockIncentives: Record<string, Incentive> = {
  "0x1234...5678": {
    symbol: "ETH",
    amount: 100,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31")
  },
  "0x8765...4321": {
    symbol: "ETH",
    amount: 200,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31")
  }
};

const Pools: React.FC = () => {
  const router = useRouter();
  const gridClass = "grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4";

  const [searchText, setSearchText] = useState("");
  const [aprTimeframe, setAprTimeframe] = useState<Period>("7d");
  const onAprTimeframeChange = useCallback(
    (period: Period) => {
      setAprTimeframe(period);
    },
    [setAprTimeframe],
  );
  const [sortField, setSortField] = useState<"poolLiquidity" | "apr" | "volume">("poolLiquidity");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const columns = [
    { key: "name", title: "Pool", className: "col-span-2 lg:col-span-1" },
    { key: "poolLiquidity", title: "TVL", sortable: true },
    { key: "apr", title: "APR", sortable: true },
    { key: "volume", title: `Volume ${aprTimeframe === "1d" ? "24h" : "7d"}`, sortable: true },
    { key: "points", title: "Points" },
    { key: "actions", title: "" },
  ];

  const filteredPools = mockPools.filter((pool) => 
    pool.name.toLowerCase().includes(searchText.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [searchText]);

  const [currentPage, setCurrentPage] = useState(0);
  const numberPerPage = 40;
  const totalPools = Math.ceil(filteredPools.length / numberPerPage);

  const sortedPools = [...filteredPools].sort((a, b) => {
    const metricA = mockMetrics[a.poolAddress];
    const metricB = mockMetrics[b.poolAddress];
    const incentiveA = mockIncentives[a.poolAddress];
    const incentiveB = mockIncentives[b.poolAddress];

    let valueA: number;
    let valueB: number;

    switch (sortField) {
      case "apr":
        valueA = (metricA?.average_apr || 0) + (incentiveA?.amount || 0);
        valueB = (metricB?.average_apr || 0) + (incentiveB?.amount || 0);
        break;
      case "volume":
        valueA = (metricA?.token0_swap_volume || 0) + (metricA?.token1_swap_volume || 0);
        valueB = (metricB?.token0_swap_volume || 0) + (metricB?.token1_swap_volume || 0);
        break;
      case "poolLiquidity":
        valueA = metricA?.tvl_usd || 0;
        valueB = metricB?.tvl_usd || 0;
        break;
      default:
        valueA = Number(a.poolLiquidity);
        valueB = Number(b.poolLiquidity);
    }

    return sortDirection === "desc" ? valueB - valueA : valueA - valueB;
  });

  const handleSort = (field: "poolLiquidity" | "apr" | "volume") => {
    if (field === sortField) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleAddLiquidity = (pool: MockPool) => {
    console.log('Adding liquidity to pool:', pool.name);
    alert(`Adding liquidity to ${pool.name} pool`);
  };

  return (
    <div className="flex flex-col gap-8 px-4 pb-20 max-w-[120rem] mx-auto w-full min-h-[65vh] lg:pt-8">
      <div className="flex gap-3 justify-between items-center lg:pl-3 lg:pr-2 pl-3">
        <h1 className="text-xl">Pools</h1>
        <div className="flex gap-3 h-[42px] items-center px-2">
          <PeriodToggle onChange={onAprTimeframeChange} defaultPeriod={aprTimeframe} />
          <Input
            isSearch
            placeholder="Search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      <Table
        columns={columns.map((col) => ({
          ...col,
          title: col.sortable ? (
            <div
              className="flex items-center gap-2 cursor-pointer hover:text-white"
              onClick={() => handleSort(col.key as "poolLiquidity" | "apr" | "volume")}
            >
              {col.title}
              {col.sortable && sortField === col.key && (
                <span>{sortDirection === "desc" ? "↓" : "↑"}</span>
              )}
            </div>
          ) : (
            col.title
          ),
        }))}
        gridClass={gridClass}
      >
        {sortedPools
          .slice(currentPage * numberPerPage, currentPage * numberPerPage + numberPerPage)
          .map((pool, i) => (
            <TableRow
              key={i}
              gridClass={twMerge("grid cursor-pointer hover:bg-white/5", gridClass)}
              onClick={() => router.push(`/pools/${pool.poolAddress}`)}
            >
              <CellPoolName
                assets={pool.assets}
                name={pool.name}
                poolType={pool.poolType}
                fee={pool.config.fee}
                incentive={mockIncentives[pool.poolAddress]}
                className="w-full pr-4"
              />
              <CellTVL
                tvl={pool.poolLiquidity}
                className="w-full pl-4"
              />
              <CellApr
                title={`APR (${aprTimeframe})`}
                feeApr={mockMetrics[pool.poolAddress]?.average_apr || 0}
                incentiveApr={mockIncentives[pool.poolAddress]?.amount || 0}
                className="w-full px-4"
              />
              <CellVolume
                title={`Volume ${aprTimeframe === "1d" ? "24h" : "7d"}`}
                volume={(mockMetrics[pool.poolAddress]?.token0_swap_volume || 0) + (mockMetrics[pool.poolAddress]?.token1_swap_volume || 0)}
                timeframe={aprTimeframe === "1d" ? "24h" : "7d"}
                className="w-full px-4"
              />
              <CellPoints assets={pool.assets} poolType={pool.poolType} className="w-full px-1" />
              <div className="flex items-end justify-end w-full px-4">
                <Button
                  variant="flat"
                  onPress={() => handleAddLiquidity(pool)}
                >
                  Add Liquidity
                </Button>
              </div>
            </TableRow>
          ))}
      </Table>
      {filteredPools.length > numberPerPage && (
        <Pagination
          total={totalPools}
          onPageChange={(page) => setCurrentPage(page - 1)}
          initialPage={currentPage + 1}
          className={{ base: "self-center backdrop-blur-xl rounded-3xl p-1" }}
        />
      )}
    </div>
  );
};

export default Pools;
