import { WalletActions, walletActions } from "viem";
import { ChainId } from "../types/chain";
import { Client } from "../types/client";
import { Config } from "../types/config";
import { Connector } from "../types/connectors";
import { getConnectorClient } from "./getConnectorClient";

export type GetWalletClientParameters = {
  connector?: Connector;
  chainId?: ChainId;
};

export async function getWalletClient<type extends "evm" | "tendermint">(
  config: Config,
  parameters: GetWalletClientParameters = {}
): Promise<Client<type, WalletActions>> {
  const client = await getConnectorClient(config, parameters);
  return client.extend(walletActions as unknown as Client);
}
