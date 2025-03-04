import { EIP1193RequestFn } from "viem";
import { CosmosRequestFn, Transport, TransportConfig } from "~/types/transports";

export function createTransport<type extends "evm" | "tendermint">(
  { key, name, type }: TransportConfig,
  request: type extends "evm" ? EIP1193RequestFn : CosmosRequestFn
): ReturnType<Transport<type>> {
  return {
    config: {
      key,
      name,
      type,
    },
    request,
  };
}
