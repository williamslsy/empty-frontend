import { Address } from "~/types/address";
import { Chain, ChainId } from "../types/chain";
import { Config } from "../types/config";
import { Connection, Connector } from "../types/connectors";

export type GetAccountReturnType = {
  address: string | undefined;
  addresses: readonly Address[] | undefined;
  chain: Chain | undefined;
  chainId: ChainId | undefined;
  connector: Connector | undefined;
  hasConnection: boolean;
  isConnected: boolean;
  isReconnecting: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
  status: "connected" | "reconnecting" | "connecting" | "disconnected";
};

export type GetAccountParameters = {
  chainId?: ChainId;
};

export function getAccount<config extends Config>(config: config, parameters: GetAccountParameters = {}): GetAccountReturnType {
  const { chainId: fallBackChainId, connections, connectors, status } = config.state;
  const { chainId = fallBackChainId } = parameters;
  const connectorId = connectors.get(chainId);

  const connection = (() => {
    if (connectorId) {
      const connection: Connection = connections.get(connectorId)!;
      return connection;
    }
    const connection = [...connections.values()].find((connection) => connection.chainId === chainId);
    return {
      connector: connection?.connector,
      accounts: connection?.accounts,
      chainId: connection?.chainId,
    };
  })();

  const chain = config.chains.find((chain) => chain.id === chainId);

  const { accounts: addresses, connector, chainId: connectorChainId } = connection;
  const address = addresses?.[0];
  const hasConnection = connectorChainId === chainId;

  return {
    address,
    addresses,
    chain,
    chainId,
    connector,
    hasConnection,
    isConnected: status === "connected",
    isConnecting: status === "connecting",
    isDisconnected: status === "disconnected",
    isReconnecting: status === "reconnecting",
    status,
  };
}
