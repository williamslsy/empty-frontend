import { getWalletClient } from "~/actions/getWalletClient";
import { useConfig } from "./useConfig";
import { useAccount } from "./useAccount";
import { useQuery } from "@tanstack/react-query";

export function useWalletClient() {
  const config = useConfig();
  const { connector } = useAccount();
  return useQuery({
    enabled: !!connector,
    queryKey: ["walletClient"],
    queryFn: () => getWalletClient(config),
  });
}
