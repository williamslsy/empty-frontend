import { ConfigParameter } from "~/types/config";
import { useConfig } from "./useConfig";
import { ConnectParameters, connect } from "~/actions/connect";
import { useConnectors } from "./useConnectors";

export type UseConnectParameters = ConfigParameter;

export type UseConnectReturnType = {
  connect: (params: ConnectParameters) => ReturnType<typeof connect>;
  connectors: ReturnType<typeof useConnectors>;
};

export function useConnect(parameters: UseConnectParameters = {}): UseConnectReturnType {
  const config = useConfig(parameters);

  return {
    connect: (params: ConnectParameters) => connect(config, params),
    connectors: useConnectors({ config }),
  };
}
