import { createClient } from "~/store/client";
import { Client } from "~/types/client";
import { Config } from "~/types/config";
import { Connection, Connector } from "~/types/connectors";
import { ChainId } from "~/types/chain";
import { customEvm } from "~/store/transports/customEvm";
import { Transport } from "~/types/transports";

export type GetConnectorClientParameters = {
  chainId?: ChainId;
  connector?: Connector;
};

export type GetConnectorClientReturnType = Client;

export async function getConnectorClient(config: Config, parameters: GetConnectorClientParameters = {}): Promise<GetConnectorClientReturnType> {
  let connection: Connection | undefined;
  if (parameters.connector) {
    const { connector } = parameters;
    if (config.state.status === "reconnecting" && !connector.getAccounts && !connector.getChainId) {
      throw new Error("ConnectorUnavailableReconnectingError");
    }

    const [accounts, chainId] = await Promise.all([connector.getAccounts(), connector.getChainId()]);
    connection = {
      account: accounts[0],
      accounts,
      chainId,
      connector,
    };
  } else {
    const connectorId = config.state.connectors.get(config.state.chainId!);
    connection = config.state.connections.get(connectorId!);
  }
  if (!connection) throw new Error("Connection not found");

  const chainId = parameters.chainId ?? connection.chainId;

  const connectorChainId = await connection.connector.getChainId();
  if (connectorChainId !== connection.chainId) {
    throw new Error("ConnectorChainIdMismatchError");
  }

  const chain = config.chains.find((chain) => chain.id === chainId);
  const provider = (await connection.connector.getProvider()) as {
    request(...args: any): Promise<any>;
  };

  return createClient({
    account: connection.accounts[0],
    chain: chain!,
    name: "Connector Client",
    transport: (opts) => customEvm(provider)({ ...opts }) as unknown as ReturnType<Transport>,
  });
}
