import type { EIP1193RequestFn } from "viem";
import type { Chain } from "./chain";
import { BankExtension, QueryClient, TxExtension } from "@cosmjs/stargate";
import { WasmExtension } from "@cosmjs/cosmwasm-stargate";

export type TransportConfig = {
  name: string;
  key: string;
  type: string;
};

export type CosmosRequestFn = QueryClient &
  BankExtension &
  TxExtension &
  WasmExtension & {
    broadcastTx: (tx: Uint8Array) => Promise<Uint8Array>;
  };

export type Transport<type extends "evm" | "tendermint" = "tendermint"> = (parameters: { chain?: Chain } | undefined) => {
  config: TransportConfig;
  request: type extends "evm" ? EIP1193RequestFn : CosmosRequestFn;
};
