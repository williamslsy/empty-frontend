import { publicActions } from "viem";
import { ChainId } from "../types/chain";
import { Client } from "../types/client";
import { Config } from "../types/config";

export type GetPublicClientParameters = {
  chainId?: ChainId;
};

export function getPublicClient<type extends "evm" | "tendermint">(config: Config, parameters: GetPublicClientParameters = {}): Client<type> {
  return config.getClient(parameters).extend(publicActions as any);
}
