import { createTRPCRouter, createTRPCPublicProcedure } from "~/trpc";
import { BaseCurrency } from "~/types/currency";
import { callerFactory } from "../routers";
import { PairInfo, PoolResponse } from "~/types/contracts";

export const poolsRouter = createTRPCRouter({
  getPools: createTRPCPublicProcedure.query(async ({ ctx }) => {
    const { publicClient, contracts } = ctx;
    const pools: PairInfo[] = await publicClient.request.wasm.queryContractSmart(contracts.factory, {
      pairs: {},
    });

    const caller = callerFactory(ctx);

    return await Promise.all(
      pools.map(async (pool) => {
        const info: PoolResponse = await publicClient.request.wasm.queryContractSmart(pool.contract_addr, {
          pool: {},
        });
        const [
          {
            native_token: { denom: denom1 },
          },
          {
            native_token: { denom: denom2 },
          },
        ] = pool.asset_infos as { native_token: { denom: string } }[];

        const t1: BaseCurrency = await caller.local.assets.getAsset({ denom: denom1 });
        const t2: BaseCurrency = await caller.local.assets.getAsset({ denom: denom2 });
        const name: string = `${t1.symbol} / ${t2.symbol}`;

        return {
          name: name,
          poolAddress: pool.contract_addr,
          lpAddress: pool.liquidity_token,
          poolType: Object.keys(pool.pair_type)[0],
          assets: [t1, t2],
          poolLiquidity: info.total_share,

          rewards: [],
        };
      })
    );
  }),
});
