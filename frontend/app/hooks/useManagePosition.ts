import { useCallback, useState } from 'react';
import { useWalletClient, useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { Token } from '@uniswap/sdk-core';
import { erc20Abi, parseGwei, parseUnits } from 'viem';
import { encodeFunctionData } from 'viem';
import { getPoolById, TMockPool } from '~/lib/mockPools';
import { nfpmContractConfig } from '~/lib/config';
import { useToast } from '~/app/hooks';

export const MAX_FEE_PER_GAS = '100';
export const MAX_PRIORITY_FEE_PER_GAS = '10';

const SEPOLIA_CHAIN_ID = 11155111;

const TOKENS = {
  WETH: new Token(SEPOLIA_CHAIN_ID, '0x7b79995e5f793a07bc00c21412e50ecae098e7f9', 18, 'WETH', 'Wrapped Ether'),
  USDC: new Token(SEPOLIA_CHAIN_ID, '0xf40e9240464482db4b0e95beacb14c3de04c5715', 6, 'USDC', 'USD Coin'),
  FRAX: new Token(SEPOLIA_CHAIN_ID, '0x8427ca5ac3d8c857239d6a8767ce57741e253569', 18, 'FRAX', 'Frax'),
  DAI: new Token(SEPOLIA_CHAIN_ID, '0xfe8668d7a038aea654964199e16b19454cfc2b50', 18, 'DAI', 'Dai Stablecoin'),
};

interface PoolInfo {
  address: string;
  token0: Token;
  token1: Token;
  fee: number;
  tickSpacing: number;
  sqrtPriceX96: bigint;
  liquidity: bigint;
  tick: number;
}

interface MintPositionParams {
  poolAddress: string;
  token0Amount: string;
  token1Amount: string;
  minPrice: string;
  maxPrice: string;
  slippageTolerance?: number;
  recipient?: string;
}

export function useManagePosition() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const { writeContractAsync } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);

  const getToken = useCallback((symbol: string): Token => {
    const token = TOKENS[symbol as keyof typeof TOKENS];
    if (!token) {
      throw new Error(`Token ${symbol} not found`);
    }
    return token;
  }, []);

  // first, approve token spending
  const approveToken = useCallback(
    async (tokenAddress: string, amount: bigint): Promise<boolean> => {
      try {
        console.log('Approving token:', { tokenAddress, amount: amount.toString() });

        const hash = await writeContractAsync({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [nfpmContractConfig.address, amount],
        });

        console.log('Approval transaction hash:', hash);
        return !!hash;
      } catch (error) {
        console.error('Token approval failed:', error);
        return false;
      }
    },
    [writeContractAsync]
  );

  const getPoolInfo = useCallback(
    async (poolAddress: string): Promise<PoolInfo> => {
      try {
        const mockPool = getPoolById(poolAddress);

        if (!mockPool) {
          throw new Error(`Pool not found for address: ${poolAddress}`);
        }

        const token0 = getToken(mockPool.token0.symbol);
        const token1 = getToken(mockPool.token1.symbol);

        return {
          address: poolAddress,
          token0,
          token1,
          fee: mockPool.feeTier,
          tickSpacing: mockPool.tickSpacing,
          sqrtPriceX96: BigInt(mockPool.sqrtPriceX96),
          liquidity: BigInt(mockPool.liquidity),
          tick: mockPool.tick,
        };
      } catch (error) {
        console.error('Failed to get pool info:', error);
        throw error;
      }
    },
    [getToken]
  );

  const priceToTick = useCallback((price: number, token0: Token, token1: Token): number => {
    const decimalAdjustment = Math.pow(10, token1.decimals - token0.decimals);
    const adjustedPrice = price / decimalAdjustment;
    const tick = Math.floor(Math.log(adjustedPrice) / Math.log(1.0001));
    return tick;
  }, []);

  const nearestUsableTick = (tick: number, tickSpacing: number) => {
    return Math.round(tick / tickSpacing) * tickSpacing;
  };

  // mint the new position
  const mintPosition = useCallback(
    async (params: MintPositionParams): Promise<boolean> => {
      if (!address || !walletClient) {
        toast.info({
          title: 'Please connect your wallet',
        });
        return false;
      }

      setIsLoading(true);

      try {
        if (!params.token0Amount || !params.token1Amount) {
          throw new Error('Token amounts are required');
        }

        const token0AmountStr = String(params.token0Amount);
        const token1AmountStr = String(params.token1Amount);

        const poolInfo = await getPoolInfo(params.poolAddress);

        if (typeof poolInfo.token0.decimals !== 'number' || typeof poolInfo.token1.decimals !== 'number') {
          throw new Error('Invalid token decimals');
        }

        const amount0Desired = parseUnits(token0AmountStr, poolInfo.token0.decimals);
        const amount1Desired = parseUnits(token1AmountStr, poolInfo.token1.decimals);

        const minPriceStr = String(params.minPrice);
        const maxPriceStr = String(params.maxPrice);
        const minPrice = parseFloat(minPriceStr);
        const maxPrice = parseFloat(maxPriceStr);

        if (isNaN(minPrice) || isNaN(maxPrice) || minPrice <= 0 || maxPrice <= 0) {
          throw new Error(`Invalid price inputs: minPrice=${minPrice}, maxPrice=${maxPrice}`);
        }

        const rawTickLower = priceToTick(minPrice, poolInfo.token0, poolInfo.token1);
        const rawTickUpper = priceToTick(maxPrice, poolInfo.token0, poolInfo.token1);

        const tickLower = nearestUsableTick(rawTickLower, poolInfo.tickSpacing);
        const tickUpper = nearestUsableTick(rawTickUpper, poolInfo.tickSpacing);

        if (tickLower >= tickUpper) {
          const errorMsg = `Invalid tick range: tickLower (${tickLower}) must be less than tickUpper (${tickUpper})`;
          toast.error({
            title: 'Invalid tick range',
            description: errorMsg,
          });
          throw new Error(errorMsg);
        }

        console.log('Pool Info:', {
          address: poolInfo.address,
          token0: poolInfo.token0.symbol,
          token1: poolInfo.token1.symbol,
          fee: poolInfo.fee,
          tick: poolInfo.tick,
          tickSpacing: poolInfo.tickSpacing,
        });

        console.log('Position Parameters:', {
          tickLower,
          tickUpper,
          currentTick: poolInfo.tick,
          minPrice,
          maxPrice,
          amount0Desired: amount0Desired.toString(),
          amount1Desired: amount1Desired.toString(),
        });

        const [approval0, approval1] = await Promise.all([approveToken(poolInfo.token0.address, amount0Desired), approveToken(poolInfo.token1.address, amount1Desired)]);

        if (!approval0 || !approval1) {
          toast.error({
            title: 'Token approval failed',
            description: 'Please try again',
          });
          return false;
        }

        const mintParams = {
          token0: poolInfo.token0.address,
          token1: poolInfo.token1.address,
          tickSpacing: poolInfo.tickSpacing,
          tickLower,
          tickUpper,
          amount0Desired,
          amount1Desired,
          amount0Min: BigInt(0),
          amount1Min: BigInt(0),
          recipient: params.recipient || address,
          deadline: Math.floor(Date.now() / 1000) + 1200,
          sqrtPriceX96: 0,
        };

        console.log('Minting position with params:', {
          ...mintParams,
          amount0Desired: mintParams.amount0Desired.toString(),
          amount1Desired: mintParams.amount1Desired.toString(),
          amount0Min: mintParams.amount0Min.toString(),
          amount1Min: mintParams.amount1Min.toString(),
        });

        console.log('Executing mint transaction...');
        const hash = await writeContractAsync({
          ...nfpmContractConfig,
          functionName: 'mint',
          args: [mintParams],
          maxFeePerGas: parseGwei(MAX_FEE_PER_GAS),
          maxPriorityFeePerGas: parseGwei(MAX_PRIORITY_FEE_PER_GAS),
          gas: BigInt(500000),
        });

        if (hash) {
          toast.success({
            title: 'Position minted successfully',
            description: `Transaction: ${hash}`,
          });
          return true;
        }

        return false;
      } catch (error) {
        console.error('Mint position error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error({
          title: 'Failed to mint position',
          description: message,
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [address, walletClient, writeContractAsync, approveToken, getPoolInfo, priceToTick, toast]
  );

  // increase liquidity
  const increaseLiquidity = useCallback(
    async (tokenId: number, poolAddress: string, amount0: string, amount1: string): Promise<boolean> => {
      if (!address || !walletClient) {
        toast.error({
          title: 'Please connect your wallet',
        });
        return false;
      }

      setIsLoading(true);

      try {
        if (!publicClient) {
          throw new Error('Public client not available');
        }

        const poolInfo = await getPoolInfo(poolAddress);

        const amount0Desired = parseUnits(amount0, poolInfo.token0.decimals);
        const amount1Desired = parseUnits(amount1, poolInfo.token1.decimals);

        console.log('Increasing liquidity for position:', {
          tokenId,
          amount0: amount0,
          amount1: amount1,
          amount0Desired: amount0Desired.toString(),
          amount1Desired: amount1Desired.toString(),
          pool: `${poolInfo.token0.symbol}/${poolInfo.token1.symbol}`,
        });

        const [allowance0, allowance1] = await Promise.all([
          publicClient.readContract({
            address: poolInfo.token0.address as `0x${string}`,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [address, nfpmContractConfig.address],
          }),
          publicClient.readContract({
            address: poolInfo.token1.address as `0x${string}`,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [address, nfpmContractConfig.address],
          }),
        ]);

        const approvalPromises = [];

        if (allowance0 < amount0Desired) {
          console.log(`Approving ${poolInfo.token0.symbol}...`);
          approvalPromises.push(approveToken(poolInfo.token0.address, amount0Desired));
        }

        if (allowance1 < amount1Desired) {
          console.log(`Approving ${poolInfo.token1.symbol}...`);
          approvalPromises.push(approveToken(poolInfo.token1.address, amount1Desired));
        }

        if (approvalPromises.length > 0) {
          const approvalResults = await Promise.all(approvalPromises);
          if (approvalResults.some((result) => !result)) {
            throw new Error('Token approval failed');
          }
          console.log('Token approvals successful');

          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        const amount0Min = BigInt(0);
        const amount1Min = BigInt(0);

        const increaseParams = {
          tokenId,
          amount0Desired,
          amount1Desired,
          amount0Min,
          amount1Min,
          deadline: Math.floor(Date.now() / 1000) + 1200,
        };

        console.log('Executing increaseLiquidity with params:', {
          tokenId: increaseParams.tokenId,
          amount0Desired: increaseParams.amount0Desired.toString(),
          amount1Desired: increaseParams.amount1Desired.toString(),
        });

        const hash = await writeContractAsync({
          ...nfpmContractConfig,
          functionName: 'increaseLiquidity',
          args: [increaseParams],
          maxFeePerGas: parseGwei(MAX_FEE_PER_GAS),
          maxPriorityFeePerGas: parseGwei(MAX_PRIORITY_FEE_PER_GAS),
          gas: BigInt(500000),
        });

        toast.success({
          title: 'Liquidity increased successfully',
          description: `Transaction: ${hash}`,
        });
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error({
          title: 'Failed to increase liquidity',
          description: message,
        });
        console.error('Increase liquidity error:', error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [address, walletClient, writeContractAsync, approveToken, getPoolInfo, publicClient, toast]
  );

  // decrease liquidity
  const decreaseLiquidity = useCallback(
    async (tokenId: number, poolAddress: string, liquidityPercentage: number): Promise<boolean> => {
      if (!address || !walletClient) {
        toast.error({
          title: 'Please connect your wallet',
        });
        return false;
      }

      setIsLoading(true);

      try {
        if (!publicClient) {
          throw new Error('Public client not available');
        }

        const positionData = (await publicClient.readContract({
          ...nfpmContractConfig,
          functionName: 'positions',
          args: [BigInt(tokenId)],
        })) as any[];

        const positionLiquidity = positionData[7] as bigint;

        const liquidityToRemove = (positionLiquidity * BigInt(liquidityPercentage)) / BigInt(100);

        console.log('Position liquidity:', positionLiquidity.toString());
        console.log('Liquidity to remove:', liquidityToRemove.toString());
        console.log('Percentage:', liquidityPercentage);

        const amount0Min = BigInt(0);
        const amount1Min = BigInt(0);

        const decreaseParams = {
          tokenId,
          liquidity: liquidityToRemove,
          amount0Min,
          amount1Min,
          deadline: Math.floor(Date.now() / 1000) + 1200,
        };

        const collectParams = {
          tokenId,
          recipient: address,
          amount0Max: BigInt('340282366920938463463374607431768211455'),
          amount1Max: BigInt('340282366920938463463374607431768211455'),
        };

        const decreaseCalldata = encodeFunctionData({
          abi: nfpmContractConfig.abi,
          functionName: 'decreaseLiquidity',
          args: [decreaseParams],
        });

        const collectCalldata = encodeFunctionData({
          abi: nfpmContractConfig.abi,
          functionName: 'collect',
          args: [collectParams],
        });

        const hash = await writeContractAsync({
          ...nfpmContractConfig,
          functionName: 'multicall',
          args: [[decreaseCalldata, collectCalldata]],
          maxFeePerGas: parseGwei(MAX_FEE_PER_GAS),
          maxPriorityFeePerGas: parseGwei(MAX_PRIORITY_FEE_PER_GAS),
          gas: BigInt(800000),
        });

        toast.success({
          title: 'Liquidity removed successfully',
          description: `Tokens have been returned to your wallet. Transaction: ${hash}`,
        });
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error({
          title: 'Failed to remove liquidity',
          description: message,
        });
        console.error('Remove liquidity error:', error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [address, walletClient, writeContractAsync, publicClient, toast]
  );

  // collect fees
  const collectFees = useCallback(
    async (tokenId: number, poolAddress?: string, recipient?: string): Promise<boolean> => {
      if (!address || !walletClient) {
        toast.error({
          title: 'Please connect your wallet',
        });
        return false;
      }

      setIsLoading(true);

      try {
        const collectParams = {
          tokenId,
          recipient: recipient || address,
          amount0Max: BigInt('340282366920938463463374607431768211455'),
          amount1Max: BigInt('340282366920938463463374607431768211455'),
        };

        const hash = await writeContractAsync({
          ...nfpmContractConfig,
          functionName: 'collect',
          args: [collectParams],
        });

        toast.success({
          title: 'Fees collected successfully',
          description: `Transaction: ${hash}`,
        });
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        toast.error({
          title: 'Failed to collect fees',
          description: message,
        });
        console.error('Collect fees error:', error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [address, walletClient, writeContractAsync, toast]
  );

  const getMockPool = useCallback((poolAddress: string): TMockPool | undefined => {
    return getPoolById(poolAddress);
  }, []);

  return {
    mintPosition,
    increaseLiquidity,
    decreaseLiquidity,
    collectFees,
    approveToken,
    getPoolInfo,
    getMockPool,
    getToken,
    isLoading,
  };
}
