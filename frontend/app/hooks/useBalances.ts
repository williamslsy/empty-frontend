import { getBalances } from "~/actions/getBalances";
import { ConfigParameter } from "~/types/config";
import { Prettify } from "~/types/utils";
import { useConfig } from "./useConfig";
import { useAccount } from "./useAccount";
import { useQuery } from "@tanstack/react-query";
import { GetBalancesReturnType } from "~/actions/getBalances";

type UseBalancesParameters = Prettify<
  ConfigParameter & {
    address: string;
  }
>;

export function useBalances(parameters: UseBalancesParameters) {
  const { address } = parameters;
  const config = useConfig(parameters);

  const client = config.getClient();

  return useQuery<GetBalancesReturnType>({
    enabled: Boolean(address),
    queryKey: ["balances", address],
    queryFn: () => getBalances(client, { address: address! }),
  });
}
