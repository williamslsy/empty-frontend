import { useState, useEffect, useCallback } from 'react';
import { sepolia } from 'viem/chains';
import { useAccount, useChainId } from 'wagmi';
import { nfpmContractConfig } from '~/lib/config';
import { publicClient } from '~/lib/publicClient';
import { getAllPools } from '~/lib/mockPools';

interface UserPosition {
  tokenId: number;
  token0: string;
  token1: string;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  tokensOwed0: string;
  tokensOwed1: string;
}

export const useUserPositions = (poolAddress?: string) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const [allPositions, setAllPositions] = useState<UserPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserPositions = useCallback(async () => {
    if (!address) return;

    if (chainId !== sepolia.id) {
      console.log(`Skipping contract calls: wrong network. Current: ${chainId}, Expected: ${sepolia.id}`);
      setAllPositions([]);
      return;
    }

    setIsLoading(true);
    try {
      if (!publicClient) return;
      const balance = await publicClient.readContract({
        ...nfpmContractConfig,
        functionName: 'balanceOf',
        args: [address],
      });
      console.log(balance, 'balance');
      const positionsData: UserPosition[] = [];

      for (let i = 0; i < Number(balance); i++) {
        const tokenId = await publicClient.readContract({
          ...nfpmContractConfig,
          functionName: 'tokenOfOwnerByIndex',
          args: [address, i],
        });
        const position = await publicClient.readContract({
          ...nfpmContractConfig,
          functionName: 'positions',
          args: [tokenId],
        });
        const [nonce, operator, token0, token1, tickSpacing, tickLower, tickUpper, liquidity, feeGrowthInside0LastX128, feeGrowthInside1LastX128, tokensOwed0, tokensOwed1] = position as [
          bigint,
          string,
          string,
          string,
          number,
          number,
          number,
          bigint,
          bigint,
          bigint,
          bigint,
          bigint
        ];

        positionsData.push({
          tokenId: Number(tokenId),
          token0: token0 as string,
          token1: token1 as string,
          tickLower: Number(tickLower),
          tickUpper: Number(tickUpper),
          liquidity: liquidity.toString(),
          tokensOwed0: tokensOwed0.toString(),
          tokensOwed1: tokensOwed1.toString(),
        });
      }

      setAllPositions(positionsData);
    } catch (error) {
      console.error('Failed to fetch user positions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [address, chainId]);

  useEffect(() => {
    fetchUserPositions();
  }, [fetchUserPositions]);

  const positions = poolAddress
    ? allPositions.filter((position) => {
        const pools = getAllPools();
        const matchingPool = pools.find(
          (pool) =>
            (pool.token0.id.toLowerCase() === position.token0.toLowerCase() && pool.token1.id.toLowerCase() === position.token1.toLowerCase()) ||
            (pool.token0.id.toLowerCase() === position.token1.toLowerCase() && pool.token1.id.toLowerCase() === position.token0.toLowerCase())
        );

        return matchingPool?.id.toLowerCase() === poolAddress.toLowerCase();
      })
    : allPositions;

  return {
    positions,
    isLoading,
    refetch: fetchUserPositions,
  };
};
