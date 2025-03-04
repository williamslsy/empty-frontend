import { ConfigParameter } from "~/types/config";
import { useConfig } from "./useConfig";
import { DisconnectParameters, disconnect as disconnectAction } from "~/actions/disconnect";
import { useConnectors } from "./useConnectors";

export type UseDisconnectParameters = ConfigParameter;

export type UseDisconnectReturnType = {
  disconnect: (parameters: DisconnectParameters) => Promise<void>;
  disconnectAll: () => Promise<void>;
  connectors: ReturnType<typeof useConnectors>;
};

export function useDisconnect(parameters: UseDisconnectParameters = {}): UseDisconnectReturnType {
  const config = useConfig(parameters);

  const disconnect = (parameters: DisconnectParameters) => disconnectAction(config, parameters);

  const disconnectAll = async () => {
    for (const connectorId of config.state.connectors.values()) {
      await disconnect({ connectorId });
    }
  };

  return {
    disconnect,
    disconnectAll,
    connectors: useConnectors({ config }),
  };
}
