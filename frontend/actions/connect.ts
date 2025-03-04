import { Config } from "~/types/config";
import { Connector } from "~/types/connectors";

export type ConnectParameters = {
  chainId: string;
  connector: Connector;
};

export type ConnectReturnType = void;

export type ConnectErrorType = Error;

export async function connect<config extends Config>(config: config, parameters: ConnectParameters): Promise<ConnectReturnType> {
  const { connector, ...rest } = parameters;
  try {
    config.setState((x) => ({ ...x, status: "connecting" }));
    connector.emitter.emit("message", { type: "connecting" });
    await connector.connect(rest);
  } catch (error) {
    config.setState((x) => ({
      ...x,
      status: x.connections.size > 0 ? "connected" : "disconnected",
    }));
    await connector.disconnect(error);
    throw error;
  }
}
