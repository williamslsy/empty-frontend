import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "~/trpc/routers";
import { contracts, Assets } from "~/config";
import { createRedisService } from "~/services/redis";
import { createClient } from "~/store/client";
import { tendermintRpc } from "~/store/transports/tendermintRpc";
import { babylonTestnet } from "~/config/chains/babylon-testnet";
import { createCoingeckoService } from "~/services/coingecko";

const handler = (req: Request) => {
  return fetchRequestHandler({
    req,
    router: appRouter,
    createContext: () => {
      const cacheService = createRedisService();
      return {
        contracts,
        cacheService,
        assets: Assets,
        coingeckoService: createCoingeckoService({ cacheService }),
        publicClient: createClient({
          chain: babylonTestnet,
          transport: tendermintRpc(),
        }),
      };
    },
    endpoint: "/api/trpc",
    batching: {
      enabled: true,
    },
  });
};

export { handler as GET, handler as POST };
