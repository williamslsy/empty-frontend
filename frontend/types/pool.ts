import { BaseCurrency, WithPrice } from "./currency";

export type PoolType = "concentrated";

export type PoolInfo = {
  name: `${string} / ${string}`;
  poolAddress: string;
  lpAddress: string;
  poolType: PoolType;
  assets: WithPrice<BaseCurrency>[];
  poolLiquidity: number;
  rewards: [];
};
