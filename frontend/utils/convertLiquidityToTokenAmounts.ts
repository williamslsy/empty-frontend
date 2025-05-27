import { TickMath, SqrtPriceMath } from '@uniswap/v3-sdk';
import { TMockPool } from '~/lib/mockPools';
import JSBI from 'jsbi';

interface TokenInfo {
  decimals: number;
  symbol: string;
  priceUSD?: number;
}

interface LiquidityPosition {
  tokenId: number;
  liquidity: string;
  tickLower: number;
  tickUpper: number;
}

interface TokenAmounts {
  amount0: string;
  amount1: string;
  amount0Formatted: number;
  amount1Formatted: number;
  amount0USD: number;
  amount1USD: number;
  totalUSD: number;
}

const STABLECOIN_PRICES = {
  FRAX: 1.0,
  DAI: 1.0,
  USDC: 1.0,
  USDT: 1.0,
};
export const convertLiquidityToTokenAmounts = (
  poolInfo: TMockPool,
  position: LiquidityPosition,
  token0Info: TokenInfo,
  token1Info: TokenInfo,
  token0PriceUSD?: number,
  token1PriceUSD?: number
): TokenAmounts => {
  try {
    const token0Price = token0PriceUSD || token0Info.priceUSD || STABLECOIN_PRICES[token0Info.symbol as keyof typeof STABLECOIN_PRICES] || 1.0;

    const token1Price = token1PriceUSD || token1Info.priceUSD || STABLECOIN_PRICES[token1Info.symbol as keyof typeof STABLECOIN_PRICES] || 1.0;

    const currentSqrtPriceX96 = JSBI.BigInt(poolInfo.sqrtPriceX96);
    const liquidity = JSBI.BigInt(position.liquidity);

    const sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(position.tickLower);
    const sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(position.tickUpper);

    let amount0 = JSBI.BigInt(0);
    let amount1 = JSBI.BigInt(0);

    if (JSBI.lessThanOrEqual(currentSqrtPriceX96, sqrtRatioAX96)) {
      amount0 = SqrtPriceMath.getAmount0Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity, false);
    } else if (JSBI.greaterThanOrEqual(currentSqrtPriceX96, sqrtRatioBX96)) {
      amount1 = SqrtPriceMath.getAmount1Delta(sqrtRatioAX96, sqrtRatioBX96, liquidity, false);
    } else {
      amount0 = SqrtPriceMath.getAmount0Delta(currentSqrtPriceX96, sqrtRatioBX96, liquidity, false);
      amount1 = SqrtPriceMath.getAmount1Delta(sqrtRatioAX96, currentSqrtPriceX96, liquidity, false);
    }

    const amount0Formatted = Number(amount0.toString()) / Math.pow(10, token0Info.decimals);
    const amount1Formatted = Number(amount1.toString()) / Math.pow(10, token1Info.decimals);

    const amount0USD = amount0Formatted * token0Price;
    const amount1USD = amount1Formatted * token1Price;
    const totalUSD = amount0USD + amount1USD;

    return {
      amount0: amount0.toString(),
      amount1: amount1.toString(),
      amount0Formatted,
      amount1Formatted,
      amount0USD,
      amount1USD,
      totalUSD,
    };
  } catch (error) {
    console.error('Error converting liquidity to token amounts:', error);

    return {
      amount0: '0',
      amount1: '0',
      amount0Formatted: 0,
      amount1Formatted: 0,
      amount0USD: 0,
      amount1USD: 0,
      totalUSD: 0,
    };
  }
};

export const convertPoolLiquidityToTokenAmounts = (poolInfo: TMockPool, token0Info: TokenInfo, token1Info: TokenInfo, token0PriceUSD?: number, token1PriceUSD?: number): TokenAmounts => {
  const fullRangePosition: LiquidityPosition = {
    tokenId: 0,
    liquidity: poolInfo.liquidity,
    tickLower: Math.ceil(-887272 / poolInfo.tickSpacing) * poolInfo.tickSpacing,
    tickUpper: Math.floor(887272 / poolInfo.tickSpacing) * poolInfo.tickSpacing,
  };

  return convertLiquidityToTokenAmounts(poolInfo, fullRangePosition, token0Info, token1Info, token0PriceUSD, token1PriceUSD);
};

export const getCurrentPoolPrice = (poolInfo: TMockPool, token0Decimals: number, token1Decimals: number): number => {
  try {
    const sqrtPriceX96 = JSBI.BigInt(poolInfo.sqrtPriceX96);
    const sqrtPrice = Number(sqrtPriceX96.toString()) / Math.pow(2, 96);
    const price = Math.pow(sqrtPrice, 2);

    const decimalAdjustment = Math.pow(10, token1Decimals - token0Decimals);
    return price * decimalAdjustment;
  } catch (error) {
    console.error('Error calculating current pool price:', error);
    return 0;
  }
};
export const getPositionDetails = (poolInfo: TMockPool, position: LiquidityPosition, token0Info: TokenInfo, token1Info: TokenInfo, token0PriceUSD?: number, token1PriceUSD?: number) => {
  const amounts = convertLiquidityToTokenAmounts(poolInfo, position, token0Info, token1Info, token0PriceUSD, token1PriceUSD);

  const currentPrice = getCurrentPoolPrice(poolInfo, token0Info.decimals, token1Info.decimals);
  const minPrice = Math.pow(1.0001, position.tickLower);
  const maxPrice = Math.pow(1.0001, position.tickUpper);

  const isInRange = currentPrice >= minPrice && currentPrice <= maxPrice;
  const rangeWidth = maxPrice - minPrice;
  const capitalEfficiency = isInRange ? (100 / ((rangeWidth / currentPrice) * 100)).toFixed(1) : '0';

  return {
    ...amounts,
    position: {
      tokenId: position.tokenId,
      liquidity: position.liquidity,
      tickLower: position.tickLower,
      tickUpper: position.tickUpper,
    },
    priceInfo: {
      currentPrice,
      minPrice,
      maxPrice,
      isInRange,
      capitalEfficiency: `${capitalEfficiency}x`,
    },
    tokens: {
      token0: {
        symbol: token0Info.symbol,
        decimals: token0Info.decimals,
        priceUSD: token0PriceUSD || STABLECOIN_PRICES[token0Info.symbol as keyof typeof STABLECOIN_PRICES] || 1.0,
      },
      token1: {
        symbol: token1Info.symbol,
        decimals: token1Info.decimals,
        priceUSD: token1PriceUSD || STABLECOIN_PRICES[token1Info.symbol as keyof typeof STABLECOIN_PRICES] || 1.0,
      },
    },
  };
};
