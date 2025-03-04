import { Prettify } from "~/types/utils";
import { useConfig } from "./useConfig";
import { ConfigParameter } from "~/types/config";
import { getPublicClient } from "~/actions/getPublicClient";
import { Client } from "~/types/client";

type UsePublicClientParameters = Prettify<
  ConfigParameter & {
    chainId?: string;
  }
>;

type UsePublicClientReturnType<type extends "evm" | "tendermint"> = Client<type>;

export function usePublicClient<type extends "evm" | "tendermint">(
  parameters: UsePublicClientParameters = {}
): UsePublicClientReturnType<type> {
  const { chainId } = parameters;
  const config = useConfig(parameters);
  return getPublicClient<type>(config, { chainId });
}
