import { useBalance, useAccount } from 'wagmi';
// import { formatUnits } from 'viem';
import { useMemo } from 'react';

// Token addresses for Sepolia testnet
const SEPOLIA_TOKENS = {
  WETH: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9',
  USDC: '0xf40e9240464482db4b0e95beacb14c3de04c5715',
  FRAX: '0x8427ca5ac3d8c857239d6a8767ce57741e253569',
  DAI: '0xfe8668d7a038aea654964199e16b19454cfc2b50',
} as const;

// const TOKEN_DECIMALS = {
//   WETH: 18,
//   USDC: 6,
//   FRAX: 18,
//   DAI: 18,
// } as const;

interface TokenBalance {
  raw: bigint;
  formatted: string;
  decimals: number;
  symbol: string;
}

interface WalletBalances {
  [key: string]: TokenBalance;
}

export function useWalletBalances() {
  const { address, isConnected } = useAccount();

  // Fetch ETH balance
  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address,
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Fetch WETH balance
  const { data: wethBalance, isLoading: wethLoading } = useBalance({
    address,
    token: SEPOLIA_TOKENS.WETH as `0x${string}`,
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 10000,
    },
  });

  // Fetch USDC balance
  const { data: usdcBalance, isLoading: usdcLoading } = useBalance({
    address,
    token: SEPOLIA_TOKENS.USDC as `0x${string}`,
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 10000,
    },
  });

  // Fetch FRAX balance
  const { data: fraxBalance, isLoading: fraxLoading } = useBalance({
    address,
    token: SEPOLIA_TOKENS.FRAX as `0x${string}`,
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 10000,
    },
  });

  // Fetch DAI balance
  const { data: daiBalance, isLoading: daiLoading } = useBalance({
    address,
    token: SEPOLIA_TOKENS.DAI as `0x${string}`,
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 10000,
    },
  });

  const balances: WalletBalances = useMemo(() => {
    if (!isConnected || !address) return {};

    const result: WalletBalances = {};

    // Add ETH balance
    if (ethBalance) {
      result.ETH = {
        raw: ethBalance.value,
        formatted: ethBalance.formatted,
        decimals: ethBalance.decimals,
        symbol: ethBalance.symbol,
      };
    }

    // Add WETH balance
    if (wethBalance) {
      result.WETH = {
        raw: wethBalance.value,
        formatted: wethBalance.formatted,
        decimals: wethBalance.decimals,
        symbol: wethBalance.symbol,
      };
    }

    // Add USDC balance
    if (usdcBalance) {
      result.USDC = {
        raw: usdcBalance.value,
        formatted: usdcBalance.formatted,
        decimals: usdcBalance.decimals,
        symbol: usdcBalance.symbol,
      };
    }

    // Add FRAX balance
    if (fraxBalance) {
      result.FRAX = {
        raw: fraxBalance.value,
        formatted: fraxBalance.formatted,
        decimals: fraxBalance.decimals,
        symbol: fraxBalance.symbol,
      };
    }

    // Add DAI balance
    if (daiBalance) {
      result.DAI = {
        raw: daiBalance.value,
        formatted: daiBalance.formatted,
        decimals: daiBalance.decimals,
        symbol: daiBalance.symbol,
      };
    }

    return result;
  }, [ethBalance, wethBalance, usdcBalance, fraxBalance, daiBalance, isConnected, address]);

  const isLoading = ethLoading || wethLoading || usdcLoading || fraxLoading || daiLoading;

  // Helper function to get balance by token symbol
  const getBalance = (tokenSymbol: string): TokenBalance | null => {
    return balances[tokenSymbol.toUpperCase()] || null;
  };

  // Helper function to get formatted balance
  const getFormattedBalance = (tokenSymbol: string): string => {
    const balance = getBalance(tokenSymbol);
    return balance ? balance.formatted : '0.0';
  };

  // Helper function to get balance as number
  const getBalanceAsNumber = (tokenSymbol: string): number => {
    const balance = getBalance(tokenSymbol);
    return balance ? parseFloat(balance.formatted) : 0;
  };

  // Helper function to check if user has sufficient balance
  const hasSufficientBalance = (tokenSymbol: string, requiredAmount: string): boolean => {
    const balance = getBalanceAsNumber(tokenSymbol);
    const required = parseFloat(requiredAmount);
    return !isNaN(required) && balance >= required;
  };

  // Helper function to get balance in raw format (bigint)
  const getRawBalance = (tokenSymbol: string): bigint => {
    const balance = getBalance(tokenSymbol);
    return balance ? balance.raw : BigInt(0);
  };

  return {
    balances,
    isLoading,
    isConnected,
    address,
    getBalance,
    getFormattedBalance,
    getBalanceAsNumber,
    hasSufficientBalance,
    getRawBalance,
  };
}
