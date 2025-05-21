import { useQuery, type UseQueryResult } from "@tanstack/react-query";

// Mock types
interface Token {
  symbol: string;
  decimals: number;
  type: "native" | "erc20";
  address?: string;
}

// Mock token data
const mockTokens: Token[] = [
  {
    symbol: "ETH",
    decimals: 18,
    type: "native"
  },
  {
    symbol: "USDC",
    decimals: 6,
    type: "erc20",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  },
  {
    symbol: "WBTC",
    decimals: 8,
    type: "erc20",
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
  }
];

// Mock balance data
const mockBalances: Record<string, string> = {
  ETH: "1000000000000000000", // 1 ETH
  USDC: "1000000", // 1 USDC
  WBTC: "100000000" // 1 WBTC
};

export type UseUserBalancesParameters = {
  assets: Token[];
  address?: string;
};

export type UseUserBalancesReturnType = UseQueryResult<(Token & { amount: string })[]>;

// Mock wallet hook
const useMockWallet = () => {
  return {
    address: "0x1234...5678",
    isConnected: true
  };
};

export function useUserBalances(parameters: UseUserBalancesParameters): UseUserBalancesReturnType {
  const { assets } = parameters;
  const { address } = useMockWallet();

  return useQuery({
    enabled: !!address,
    queryKey: ["balances", address, assets],
    queryFn: async () => {
      // In a real implementation, this would fetch from a blockchain
      // For now, we'll use mock data
      return assets.map(asset => ({
        ...asset,
        amount: mockBalances[asset.symbol] || "0"
      }));
    },
    // Add some randomness to simulate real-world conditions
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });
}
