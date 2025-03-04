import { custom } from "viem";
import { Transport } from "~/types/transports";

type EthereumProvider = { request(...args: any): Promise<any> };

export function customEvm(provider: EthereumProvider): Transport<"evm"> {
  return custom(provider) as Transport<"evm">;
}
