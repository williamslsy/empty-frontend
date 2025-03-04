import { http } from "viem";
import { Transport } from "~/types/transports";

export function evmRpc(url?: string): Transport<"evm"> {
  return http(url) as Transport<"evm">;
}
