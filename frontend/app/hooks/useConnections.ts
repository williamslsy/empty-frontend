import { useSyncExternalStore } from "use-sync-external-store/shim";
import { useConfig } from "./useConfig";
import { ConfigParameter } from "~/types/config";

export type UseConnectionsParameters = ConfigParameter;

export function useConnections(parameters: UseConnectionsParameters = {}) {
  const config = useConfig(parameters);

  return useSyncExternalStore(
    (onChange) => config.subscribe((x) => x.connections, onChange, { emitImmediately: true }),
    () => config.store.getState().connections
  );
}
