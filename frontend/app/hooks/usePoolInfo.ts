import { useReadContracts } from 'wagmi';
import { useMemo } from 'react';
import { poolContractConfig } from '~/lib/config';

export interface PoolInfo {
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  sqrtPriceX96: bigint;
  liquidity: bigint;
  tick: number;
  poolAddress: string;
}

export const usePoolInfo = (poolAddress: string) => {
  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        address: poolAddress as `0x${string}`,
        abi: poolContractConfig.abi,
        functionName: 'token0',
      },
      {
        address: poolAddress as `0x${string}`,
        abi: poolContractConfig.abi,
        functionName: 'token1',
      },
      {
        address: poolAddress as `0x${string}`,
        abi: poolContractConfig.abi,
        functionName: 'fee',
      },
      {
        address: poolAddress as `0x${string}`,
        abi: poolContractConfig.abi,
        functionName: 'tickSpacing',
      },
      {
        address: poolAddress as `0x${string}`,
        abi: poolContractConfig.abi,
        functionName: 'liquidity',
      },
    ],
    query: {
      enabled: !!poolAddress,
    },
  });

  const poolInfo = useMemo(() => {
    if (!data || !poolAddress) return null;

    const allSuccessful = data.every((result) => result.status === 'success');
    if (!allSuccessful) {
      console.error('Some contract calls failed:', data);
      return null;
    }

    const [token0Result, token1Result, feeResult, tickSpacingResult, liquidityResult] = data;
    console.log(data, 'data');

    return {
      token0: token0Result.result as string,
      token1: token1Result.result as string,
      fee: feeResult.result as number,
      tickSpacing: tickSpacingResult.result as number,
      liquidity: liquidityResult.result as bigint,
      poolAddress,
    } as PoolInfo;
  }, [data, poolAddress]);

  return {
    poolInfo,
    isLoading,
    error,
    refetch,
  };
};
