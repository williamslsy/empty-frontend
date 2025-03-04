import { UseQueryResult, useQuery } from "@tanstack/react-query";

type UseLastBlockParameters = {
  initialData?: string;
  refetchInterval?: number;
  chainId: string;
};

export function useLastBlock<E = Error>(parameters: UseLastBlockParameters): UseQueryResult<string, E> {
  const { refetchInterval = 6e3, initialData, chainId } = parameters;
  return useQuery({
    queryKey: ["last_block", chainId],
    queryFn: () => {
      return {} as any;
    },
    refetchInterval: refetchInterval,
    initialData,
  });
}
