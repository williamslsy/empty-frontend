import { useQuery } from '@tanstack/react-query';

interface HistoricalDataPoint {
  time: number;
  price: number;
  volume: number;
}

// Specific pair configurations based on your mock pools
const PAIR_CONFIGS = {
  // ETH pairs - volatile, trending (more realistic parameters)
  'WETH/USDC': { basePrice: 2500, dailyVolatility: 0.05, trend: 0.0001, cycles: true },
  'WETH/DAI': { basePrice: 2500, dailyVolatility: 0.05, trend: 0.0001, cycles: true },

  // Stablecoin pairs - low volatility around 1.0
  'FRAX/DAI': { basePrice: 1.0, dailyVolatility: 0.005, trend: 0, cycles: false },
  'FRAX/USDC': { basePrice: 1.0, dailyVolatility: 0.005, trend: 0, cycles: false },
  'DAI/FRAX': { basePrice: 1.0, dailyVolatility: 0.005, trend: 0, cycles: false },
  'USDC/FRAX': { basePrice: 1.0, dailyVolatility: 0.005, trend: 0, cycles: false },

  // Inverted pairs
  'USDC/WETH': { basePrice: 1 / 2500, dailyVolatility: 0.05, trend: -0.0001, cycles: true },
  'DAI/WETH': { basePrice: 1 / 2500, dailyVolatility: 0.05, trend: -0.0001, cycles: true },
};

function generateRealisticMockData(token0Symbol: string, token1Symbol: string, currentPrice: number, days: number = 7): HistoricalDataPoint[] {
  const now = Date.now();
  const msPerHour = 60 * 60 * 1000;
  const dataPoints: HistoricalDataPoint[] = [];

  // If no current price provided, use fallback
  if (!currentPrice || currentPrice <= 0) {
    console.log('No valid current price provided, using fallback');
    const stablecoins = ['DAI', 'USDC', 'USDT', 'FRAX', 'LUSD', 'BUSD'];
    const isStablecoinPair = stablecoins.includes(token0Symbol) && stablecoins.includes(token1Symbol);
    currentPrice = isStablecoinPair ? 1.0 : 2500; // Fallback values
  }

  // Determine pair characteristics
  const pairKey = `${token0Symbol}/${token1Symbol}`;
  const stablecoins = ['DAI', 'USDC', 'USDT', 'FRAX', 'LUSD', 'BUSD'];
  const isStablecoinPair = stablecoins.includes(token0Symbol) && stablecoins.includes(token1Symbol);
  const isETHPair = pairKey.includes('WETH') || pairKey.includes('ETH');

  // Set volatility and trend parameters based on pair type
  let dailyVolatility: number;
  let trendStrength: number;
  let baseVolume: number;

  if (isStablecoinPair) {
    dailyVolatility = 0.005; // 0.5% daily volatility for stablecoins
    trendStrength = 0; // No major trend for stablecoins
    baseVolume = 800000; // Lower volume for stablecoin pairs
  } else if (isETHPair) {
    dailyVolatility = 0.04; // 4% daily volatility for ETH
    trendStrength = 0.0001; // Slight upward trend
    baseVolume = 2000000; // Higher volume for ETH pairs
  } else {
    dailyVolatility = 0.03; // 3% daily volatility for other pairs
    trendStrength = 0; // Neutral trend
    baseVolume = 1000000; // Medium volume
  }

  const hoursToGenerate = days * 24;
  const hourlyVolatility = dailyVolatility / Math.sqrt(24);

  // Calculate starting price (work backwards from current price)
  // We want the price to trend from startPrice to currentPrice over the time period
  let startPrice = currentPrice;

  // For non-stablecoin pairs, add some historical variation
  if (!isStablecoinPair) {
    // Generate a starting price that's within reasonable bounds of current price
    const totalTrendChange = trendStrength * hoursToGenerate;
    const randomStartVariation = (Math.random() - 0.5) * 0.2; // ±10% variation
    startPrice = currentPrice * (1 - totalTrendChange + randomStartVariation);
    startPrice = Math.max(currentPrice * 0.7, Math.min(currentPrice * 1.3, startPrice)); // Clamp to reasonable range
  }

  // Calculate the trend that will bring us from startPrice to currentPrice
  const actualTrend = (currentPrice - startPrice) / (startPrice * hoursToGenerate);

  let price = startPrice;
  let momentum = 0;
  let cyclePhase = Math.random() * Math.PI * 2;

  for (let i = hoursToGenerate; i >= 0; i--) {
    const time = now - i * msPerHour;
    const progressRatio = (hoursToGenerate - i) / hoursToGenerate; // 0 to 1

    // 1. Trend component (brings us toward current price)
    const trendComponent = actualTrend;

    // 2. Random walk
    const randomWalk = (Math.random() - 0.5) * hourlyVolatility * 2;

    // 3. Momentum (smoother transitions)
    momentum = momentum * 0.9 + randomWalk * 0.1;

    // 4. Cyclical component for crypto-like behavior
    let cyclicalComponent = 0;
    if (!isStablecoinPair) {
      cyclePhase += (Math.random() - 0.5) * 0.08;
      cyclicalComponent = Math.sin(cyclePhase) * hourlyVolatility * 0.3;
    }

    // 5. Mean reversion toward target (stronger as we approach the end)
    const targetPrice = startPrice + (currentPrice - startPrice) * progressRatio;
    const meanReversion = ((targetPrice - price) / price) * 0.02 * progressRatio;

    // Combine all components
    const totalChange = trendComponent + randomWalk * 0.6 + momentum * 0.2 + cyclicalComponent + meanReversion;

    // Apply change
    price = price * (1 + totalChange);
    price = Math.max(0.001, price);

    // For stablecoin pairs, enforce tight bounds
    if (isStablecoinPair) {
      price = Math.max(0.98, Math.min(1.02, price));
    }

    // For the last data point, use the exact current price
    if (i === 0) {
      price = currentPrice;
    }

    // Generate volume with some correlation to price movement
    const volatilityMultiplier = 1 + Math.abs(totalChange) * 8;
    const volume = baseVolume * volatilityMultiplier * (0.6 + Math.random() * 0.8);

    dataPoints.push({
      time,
      price,
      volume,
    });
  }

  console.log(`Generated ${dataPoints.length} data points for ${pairKey}`);
  console.log(`Price journey: ${dataPoints[0]?.price.toFixed(6)} → ${dataPoints[dataPoints.length - 1]?.price.toFixed(6)} (target: ${currentPrice.toFixed(6)})`);

  return dataPoints;
}

export function useHistoricalPrices(token0Symbol: string, token1Symbol: string, currentPrice?: number) {
  return useQuery(
    ['historicalPrices', token0Symbol, token1Symbol, currentPrice],
    async () => {
      console.log(`Generating mock historical data for ${token0Symbol}/${token1Symbol} with current price: ${currentPrice?.toFixed(6)}`);
      return generateRealisticMockData(token0Symbol, token1Symbol, currentPrice || 0, 7);
    },
    {
      staleTime: 10 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      retry: 1,
      enabled: !!currentPrice && currentPrice > 0, // Only run when we have a valid current price
    }
  );
}
