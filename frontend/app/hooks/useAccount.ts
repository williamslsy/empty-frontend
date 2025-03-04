import { Config, ConfigParameter } from "~/types/config";
import { watchAccount } from "~/actions/watchAccount";
import { GetAccountParameters, GetAccountReturnType, getAccount } from "~/actions/getAccount";
import { useSyncExternalStoreWithTracked } from "./useSyncExternalStoreWithTracked";
import { useConfig } from "./useConfig";
import { Prettify } from "~/types/utils";

export type UseAccountParameters<config extends Config = Config> = Prettify<ConfigParameter<config> & GetAccountParameters>;

export type UseAccountReturnType = GetAccountReturnType;

export function useAccount<config extends Config = Config>(parameters: UseAccountParameters<config> = {}): UseAccountReturnType {
  const config = useConfig(parameters);

  return useSyncExternalStoreWithTracked(
    (onChange) => watchAccount(config, { onChange }),
    () => getAccount(config, parameters)
  );
}
