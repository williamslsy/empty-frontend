import { useQuery } from "@tanstack/react-query";

const tokens = {
  "usd-coin": "USDC",
  "wrapped-steth": "wstETH",
};

export function usePrices() {
  function calculatePrice(amount: number, symbol: string) {
    if (!data || !data[symbol] || !data[symbol]["usd"]) return 0;
    return amount * data[symbol]["usd"];
  }

  function getPrice(symbol: string) {
    if (!data || !data[symbol] || !data[symbol]["usd"]) return 0;
    return data[symbol]["usd"];
  }

  const { data, ...rest } = useQuery({
    queryKey: ["prices", tokens],
    enabled: window.location.protocol.includes("https"),
    queryFn: async () => {
      const coingeckoIds = Object.keys(tokens).join(",");

      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds}&vs_currencies=usd`);
      const parsedResponse = await response.json();

      const prices = Object.entries(parsedResponse).reduce((acc, [coingeckoId, prices]) => {
        const symbol = tokens[coingeckoId as keyof typeof tokens];
        if (symbol) acc[symbol] = prices;
        return acc;
      }, Object.create({}));

      localStorage.setItem(`prices`, JSON.stringify(prices));
      return prices;
    },
    initialData: JSON.parse(localStorage.getItem(`prices`) ?? "{}"),
    refetchInterval: 60 * 1000 * 5,
  });

  return { data, ...rest, calculatePrice, getPrice };
}
