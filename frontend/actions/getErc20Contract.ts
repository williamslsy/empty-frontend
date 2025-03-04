import { PublicClient, WalletActions, WalletClient, erc20Abi, getContract } from "viem";
import { Client } from "../types/client";

interface GetErc20ContractParameters {
  contract: string;
  publicClient: Client;
  walletClient?: Client<"evm" | "tendermint", WalletActions>;
}

export function getErc20Contract(parameters: GetErc20ContractParameters) {
  const { contract, publicClient, walletClient } = parameters;
  return getContract({
    abi: erc20Abi,
    address: contract as `0x${string}`,
    client: {
      public: publicClient as unknown as PublicClient,
      wallet: walletClient as unknown as WalletClient,
    },
  });
}
