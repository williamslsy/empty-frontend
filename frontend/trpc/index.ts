import { AnyRouter, initTRPC } from "@trpc/server";
import { TRPCClientError, TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { Client } from "~/types/client";
import { BaseCurrency } from "~/types/currency";
import { Cache } from "~/types/cache";
import { CoingeckoServiceReturnType } from "~/services/coingecko";

export type ContextOptions = {
  publicClient: Client<"tendermint">;
  assets: Record<string, BaseCurrency>;
  cacheService: Cache;
  coingeckoService: CoingeckoServiceReturnType;
  contracts: {
    coinRegistry: string;
    factory: string;
    incentives: string;
    router: string;
  };
};

export const createInnerTRPCContext = (opts: ContextOptions) => {
  return opts;
};

const t = initTRPC.context<typeof createInnerTRPCContext>().create({
  allowOutsideOfServer: true,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const createTRPCPublicProcedure = t.procedure;

export function createLocalTRPCLink<TRouter extends AnyRouter>(opts: { router: TRouter } & ContextOptions): TRPCLink<TRouter> {
  const { router, ...ctx } = opts;
  const createCaller = createCallerFactory(router);
  return () =>
    ({ op }) => {
      return observable((observer) => {
        (async () => {
          const { path, input } = op;
          const caller = createCaller(ctx);

          try {
            const data = await (caller[path] as (input: unknown) => unknown)(input);
            observer.next({ result: { data } });
            observer.complete();
          } catch (error) {
            console.log(error, "error");
            observer.error(TRPCClientError.from(error as Error));
          }
        })();
      });
    };
}
