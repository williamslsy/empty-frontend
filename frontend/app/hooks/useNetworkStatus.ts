import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { sepolia } from 'viem/chains';
import { useCallback } from 'react';

export const useNetworkStatus = () => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, switchChainAsync } = useSwitchChain();

  const isOnSepolia = chainId === sepolia.id;
  const isWrongNetwork = isConnected && !isOnSepolia;

  const switchToSepolia = useCallback(async () => {
    if (!switchChainAsync) return false;

    try {
      await switchChainAsync({ chainId: sepolia.id });
      return true;
    } catch (error) {
      console.error('Failed to switch to Sepolia:', error);
      return false;
    }
  }, [switchChainAsync]);

  return {
    isConnected,
    isOnSepolia,
    isWrongNetwork,
    currentChainId: chainId,
    switchToSepolia,
    sepoliaChainId: sepolia.id,
  };
};
