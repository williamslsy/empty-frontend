import { QueryClient } from "@tanstack/react-query";
import React, { PropsWithChildren } from "react";
import { usePublicClient, useConfig } from "~/app/hooks";
import { createClient, trpc } from "~/trpc/client";
import { contracts, Assets } from "~/config";
import { createLruService } from "~/services/lru";
import { createCoingeckoService } from "~/services/coingecko";

const cacheService = createLruService();
const coingeckoService = createCoingeckoService({ cacheService });

interface Props {
  queryClient: QueryClient;
}

export const TrpcProvider: React.FC<PropsWithChildren<Props>> = ({ children, queryClient }) => {
  const config = useConfig();
  const publicClient = usePublicClient<"tendermint">({ chainId: config.state.chainId as string });

  return (
    <trpc.Provider client={createClient({ contracts, assets: Assets, publicClient, cacheService, coingeckoService })} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  );
};
