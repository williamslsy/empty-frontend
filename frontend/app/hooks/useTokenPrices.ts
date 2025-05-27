import { useQuery } from '@tanstack/react-query';
import { Token } from '@uniswap/sdk-core';

interface TokenPrice {
  usd: number;
  eur: number;
}

interface TokenPrices {
  [key: string]: TokenPrice;
}

interface UseTokenPricesOptions {
  refetchInterval?: number;
  defaultCurrency?: string;
}

// Extended token map for Sepolia testnet tokens
const TESTNET_TOKEN_MAP = {
  // Sepolia testnet addresses from your pools
  '0x7b79995e5f793a07bc00c21412e50ecae098e7f9': 'ethereum', // WETH
  '0xf40e9240464482db4b0e95beacb14c3de04c5715': 'usd-coin', // USDC
  '0x8427ca5ac3d8c857239d6a8767ce57741e253569': 'frax', // FRAX
  '0xfe8668d7a038aea654964199e16b19454cfc2b50': 'dai', // DAI
};

// Fallback prices for when API fails (useful for testnet)
const FALLBACK_PRICES: TokenPrices = {
  '0x7b79995e5f793a07bc00c21412e50ecae098e7f9': { usd: 2000, eur: 1800 }, // WETH
  '0xf40e9240464482db4b0e95beacb14c3de04c5715': { usd: 1, eur: 0.9 }, // USDC
  '0x8427ca5ac3d8c857239d6a8767ce57741e253569': { usd: 1, eur: 0.9 }, // FRAX
  '0xfe8668d7a038aea654964199e16b19454cfc2b50': { usd: 1, eur: 0.9 }, // DAI
};

export function useTokenPrices(options: UseTokenPricesOptions = {}) {
  const {
    defaultCurrency = 'USD',
    refetchInterval = 60 * 1000 * 5, // 5 minutes
  } = options;

  const {
    data: prices,
    isLoading,
    error,
    ...rest
  } = useQuery<TokenPrices>({
    queryKey: ['tokenPrices'],
    queryFn: async () => {
      try {
        const coingeckoIds = Object.values(TESTNET_TOKEN_MAP);
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds.join(',')}&vs_currencies=usd,eur`);

        if (!response.ok) {
          throw new Error('Failed to fetch token prices');
        }

        const data = await response.json();

        // Transform the data to match our token addresses
        const prices: TokenPrices = {};
        Object.entries(TESTNET_TOKEN_MAP).forEach(([address, coingeckoId]) => {
          prices[address.toLowerCase()] = {
            usd: data[coingeckoId]?.usd || FALLBACK_PRICES[address]?.usd || 0,
            eur: data[coingeckoId]?.eur || FALLBACK_PRICES[address]?.eur || 0,
          };
        });

        return prices;
      } catch (error) {
        console.warn('Failed to fetch prices from API, using fallback prices:', error);
        // Return fallback prices if API fails
        return Object.keys(FALLBACK_PRICES).reduce((acc, address) => {
          acc[address.toLowerCase()] = FALLBACK_PRICES[address];
          return acc;
        }, {} as TokenPrices);
      }
    },
    refetchInterval,
    staleTime: 60 * 1000 * 2, // 2 minutes
    retry: 2,
  });

  const getTokenPrice = (token: Token | string, amount: string, currency: string = defaultCurrency) => {
    if (!prices || !amount) return 0;

    const tokenAddress = typeof token === 'string' ? token : token.address;
    const tokenPrice = prices[tokenAddress.toLowerCase()];

    if (!tokenPrice) {
      console.warn(`Price not found for token: ${tokenAddress}`);
      return 0;
    }

    const price = tokenPrice[currency.toLowerCase() as keyof TokenPrice] || 0;
    const numAmount = Number(amount);

    return isNaN(numAmount) ? 0 : numAmount * price;
  };

  const getTokenPriceOnly = (token: Token | string, currency: string = defaultCurrency) => {
    if (!prices) return 0;

    const tokenAddress = typeof token === 'string' ? token : token.address;
    const tokenPrice = prices[tokenAddress.toLowerCase()];

    if (!tokenPrice) return 0;
    return tokenPrice[currency.toLowerCase() as keyof TokenPrice] || 0;
  };

  const formatPrice = (price: number, currency: string = defaultCurrency) => {
    if (price === 0) return '$0.00';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    }).format(price);
  };

  const calculateTotalValue = (token0: Token | string, token0Amount: string, token1: Token | string, token1Amount: string, currency: string = defaultCurrency) => {
    if (!prices) return 0;

    const token0Value = getTokenPrice(token0, token0Amount, currency);
    const token1Value = getTokenPrice(token1, token1Amount, currency);

    return token0Value + token1Value;
  };

  return {
    prices,
    getTokenPrice,
    getTokenPriceOnly,
    formatPrice,
    calculateTotalValue,
    isLoading,
    error,
    ...rest,
  };
}
