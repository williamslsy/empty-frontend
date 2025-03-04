import { ConfigParameter } from "~/types/config";
import { Connector } from "~/types/connectors";
import { useConfig } from "./useConfig";

export type UseConnectorsParameters = ConfigParameter;

export type UseConnectorsReturnType = readonly Connector[];

export function useConnectors(parameters: UseConnectorsParameters = {}): UseConnectorsReturnType {
  const config = useConfig(parameters);

  return config.connectors;
}
