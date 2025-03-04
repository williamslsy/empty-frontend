import type { Chain } from "./chain";
import type { Transport } from "./transports";
import { Address } from "~/types/address";

export type ClientConfig<transport extends Transport = Transport> = {
  account?: Address;
  chain: Chain;
  name?: string | undefined;
  type?: string | undefined;
  transport: transport;
};

export type Client<transportType extends "tendermint" | "evm" = "evm" | "tendermint", extended = object> = {
  account?: Address;
  ecosystem: Chain["ecosystem"];
  chain: Chain;
  name: string;
  transport: ReturnType<Transport<transportType>>["config"];
  request: ReturnType<Transport<transportType>>["request"];
  type: string;
  uid: string;
  extend: (base: Client<transportType>) => Client<transportType, extended>;
};
