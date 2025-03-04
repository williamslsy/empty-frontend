import { ConfigParameter } from "~/types/config";
import { useConfig } from "./useConfig";
import { Prettify } from "~/types/utils";

type UseBlockExplorerParameters = Prettify<
  ConfigParameter & {
    explorerName?: string;
  }
>;

type UseBlockExplorerReturnType = {
  url: string;
  getTxUrl: (txHash: string) => string;
  getAccountUrl: (address: string) => string;
};

export function useBlockExplorer(parameters: UseBlockExplorerParameters = {}): UseBlockExplorerReturnType {
  const { explorerName } = parameters;
  const config = useConfig();

  const chain = config.chains.find((chain) => chain.id === config.state.chainId);

  if (!chain) {
    return {
      url: "",
      getTxUrl: () => "",
      getAccountUrl: () => "",
    };
  }

  const { url, txPage, accountPage } = chain.blockExplorers[explorerName || "default"];

  return {
    url,
    getTxUrl: (txHash: string) => txPage.replace("${tx_hash}", txHash),
    getAccountUrl: (address: string) => accountPage.replace("${address}", address),
  };
}
