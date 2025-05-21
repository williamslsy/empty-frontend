"use client";

import { useQuery } from "@tanstack/react-query";

// Mock types
interface Token {
  symbol: string;
  decimals: number;
  coingeckoId: string;
}

// Mock token data
const mockTokens: Record<string, Token> = {
  ETH: {
    symbol: "ETH",
    decimals: 18,
    coingeckoId: "ethereum"
  },
  USDC: {
    symbol: "USDC",
    decimals: 6,
    coingeckoId: "usd-coin"
  },
  WBTC: {
    symbol: "WBTC",
    decimals: 8,
    coingeckoId: "wrapped-bitcoin"
  }
};

export type FormatNumberOptions = {
  language: string;
  currency?: string;
  style?: "decimal" | "percent" | "currency";
  notation?: "standard" | "scientific" | "engineering" | "compact";
  maxFractionDigits?: number;
  minFractionDigits?: number;
  useGrouping?: boolean;
};

export type Prices = Record<string, { symbol: string; decimals: number; prices: Record<string, number> }>;

export function formatNumber(_amount_: number | bigint | string, options: FormatNumberOptions) {
  const {
    language,
    currency,
    maxFractionDigits = 2,
    minFractionDigits = 2,
    notation = "standard",
    useGrouping = true,
  } = options;
  const amount = typeof _amount_ === "string" ? Number(_amount_) : _amount_;
  return new Intl.NumberFormat(language, {
    notation,
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
    useGrouping,
    ...(currency
      ? { currency, currencyDisplay: "narrowSymbol", notation: "compact", style: "currency" }
      : {}),
  }).format(amount);
}

export type UsePricesParameters = {
  refetchInterval?: number;
  formatter?: (amount: number, options: FormatNumberOptions) => string;
  currencies?: string[];
  defaultCurrency?: string;
  defaultFormatOptions?: FormatNumberOptions;
};

type FormatOptions<T> = {
  formatOptions?: FormatNumberOptions;
  currency?: string;
  format?: T;
};

// Mock price data
const mockPrices: Record<string, Record<string, number>> = {
  ethereum: { usd: 3000, eur: 2800 },
  "usd-coin": { usd: 1, eur: 0.95 },
  "wrapped-bitcoin": { usd: 60000, eur: 57000 }
};

export function usePrices(parameters: UsePricesParameters = {}) {
  const {
    defaultCurrency = "USD",
    currencies = ["USD", "EUR"],
    refetchInterval = 60 * 1000 * 5,
    formatter = formatNumber,
    defaultFormatOptions = {
      maximumFractionDigits: 2,
      minFractionDigits: 2,
      language: typeof navigator !== "undefined" ? navigator.language : "en-US",
    },
  } = parameters;

  function getPrice<T extends boolean = false>(
    amount: number | string,
    symbol: string,
    options?: FormatOptions<T>,
  ): T extends true ? string : number {
    const {
      currency = defaultCurrency,
      formatOptions = defaultFormatOptions,
      format = true,
    } = options || {};

    const price = (() => {
      const token = mockTokens[symbol];
      if (!token || !data?.[symbol]?.prices?.[currency.toLowerCase()]) return 0;
      return Number(amount) * data[symbol].prices[currency.toLowerCase()];
    })();

    return (format ? formatter(price, { ...formatOptions, currency }) : price) as T extends true
      ? string
      : number;
  }

  function calculateBalance<T extends boolean = false>(
    balances: Record<string, string>,
    options?: FormatOptions<T>,
  ): T extends true ? string : number {
    const {
      currency = defaultCurrency,
      formatOptions = defaultFormatOptions,
      format = false,
    } = options || {};

    const totalValue = Object.entries(balances).reduce((total, [symbol, amount]) => {
      const token = mockTokens[symbol];
      if (!token) return total;
      
      const normalizedAmount = Number(amount) / Math.pow(10, token.decimals);
      const price = getPrice(normalizedAmount, symbol, {
        currency,
        formatOptions,
        format: false,
      });
      return total + price;
    }, 0);

    return (
      format ? formatter(totalValue, { ...formatOptions, currency }) : totalValue
    ) as T extends true ? string : number;
  }

  const { data, ...rest } = useQuery<Prices>({
    enabled: typeof window !== "undefined",
    queryKey: ["prices", currencies],
    queryFn: async () => {
      // In a real implementation, this would fetch from an API
      // For now, we'll use mock data
      const prices = Object.entries(mockTokens).reduce((acc, [symbol, token]) => {
        const tokenPrices = mockPrices[token.coingeckoId] || { usd: 0, eur: 0 };
        acc[symbol] = { 
          symbol: token.symbol, 
          decimals: token.decimals, 
          prices: tokenPrices 
        };
        return acc;
      }, {} as Prices);

      localStorage.setItem("prices", JSON.stringify(prices));
      return prices;
    },
    initialData: () => {
      if (typeof window === "undefined") return {};
      try {
        const prices = localStorage.getItem("prices");
        return prices ? JSON.parse(prices) : {};
      } catch (error) {
        return {};
      }
    },
    refetchInterval,
  });

  return { data, ...rest, calculateBalance, getPrice };
}
