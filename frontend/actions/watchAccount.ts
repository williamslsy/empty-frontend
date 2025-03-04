import { deepEqual } from "~/utils/deepEqual";
import { Config } from "~/types/config";
import { type GetAccountReturnType, getAccount } from "./getAccount";

export type WatchAccountParameters = {
  onChange(account: GetAccountReturnType, prevAccount: GetAccountReturnType): void;
};

export type WatchAccountReturnType = () => void;

export function watchAccount(config: Config, parameters: WatchAccountParameters): WatchAccountReturnType {
  const { onChange } = parameters;

  return config.subscribe(() => getAccount(config), onChange, {
    equalityFn(a, b) {
      const { connector: aConnector, ...aRest } = a;
      const { connector: bConnector, ...bRest } = b;
      return deepEqual(aRest, bRest) && aConnector?.id === bConnector?.id && aConnector?.uid === bConnector?.uid;
    },
  });
}
