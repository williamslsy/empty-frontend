export interface TMockPool {
  id: string;
  token0: {
    id: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  token1: {
    id: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  feeTier: number;
  tick: number;
  sqrtPriceX96: string;
  liquidity: string;
  tickSpacing: number;
  volume24h: string;
  tvl: string;
  apr: number;
  feeGrowthGlobal0X128: string;
  feeGrowthGlobal1X128: string;
}

export const mockPools = {
  data: {
    pools: [
      {
        id: '0x5878d73d8a6306270ae6556a02ffdc2810ef999f',
        token0: {
          id: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18, // converted to number
        },
        token1: {
          id: '0xf40e9240464482db4b0e95beacb14c3de04c5715',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6, // converted to number
        },
        feeTier: 100, // converted to number
        tick: -23, // converted to number
        sqrtPriceX96: '1773452964481733236174240000000',
        liquidity: '15000000000000000000000',
        tickSpacing: 1, // 0.01% pools use tickSpacing 1
        volume24h: '1250000000000',
        tvl: '30000000000000',
        apr: 12.5,
        feeGrowthGlobal0X128: '123456789012345678901234567890',
        feeGrowthGlobal1X128: '987654321098765432109876543210',
      },
      {
        id: '0x935c8743827a2a72c8e7c8e989ac1a9e16e94395',
        token0: {
          id: '0x8427ca5ac3d8c857239d6a8767ce57741e253569',
          symbol: 'FRAX',
          name: 'Frax',
          decimals: 18,
        },
        token1: {
          id: '0xfe8668d7a038aea654964199e16b19454cfc2b50',
          symbol: 'DAI',
          name: 'Dai Stablecoin',
          decimals: 18,
        },
        feeTier: 100, // 0.01%
        tick: -23, // Close to 1:1 parity
        sqrtPriceX96: '79228162514264337593543950336', // sqrt(1) * 2^96
        liquidity: '5000000000000000000000000', // 5M tokens
        tickSpacing: 1,
        volume24h: '850000000000', // $850K
        tvl: '10000000000000', // $10M
        apr: 8.2,
        feeGrowthGlobal0X128: '234567890123456789012345678901',
        feeGrowthGlobal1X128: '876543210987654321098765432109',
      },
      {
        id: '0xcab6edfa78bf78c27c0b276d6a7fd13fa1fcbfe7',
        token0: {
          id: '0x8427ca5ac3d8c857239d6a8767ce57741e253569',
          symbol: 'FRAX',
          name: 'Frax',
          decimals: 18,
        },
        token1: {
          id: '0xf40e9240464482db4b0e95beacb14c3de04c5715',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        },
        feeTier: 100, // 0.01%
        tick: -15, // Close to 1:1 parity
        sqrtPriceX96: '79228162514264337593543950336',
        liquidity: '300000000000', // 3M tokens
        tickSpacing: 1,
        volume24h: '450000000000', // $450K
        tvl: '6000000000000', // $6M
        apr: 6.8,
        feeGrowthGlobal0X128: '345678901234567890123456789012',
        feeGrowthGlobal1X128: '765432109876543210987654321098',
      },
      {
        id: '0xce488a6f9a72fcb20116db86add4858fae76225e',
        token0: {
          id: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9',
          symbol: 'WETH',
          name: 'Wrapped Ether',
          decimals: 18,
        },
        token1: {
          id: '0xfe8668d7a038aea654964199e16b19454cfc2b50',
          symbol: 'DAI',
          name: 'Dai Stablecoin',
          decimals: 18,
        },
        feeTier: 100, // 0.01%
        tick: -276350, // Approximately $2000 per ETH
        sqrtPriceX96: '1773452964481733236174240000000',
        liquidity: '8000000000000000000000', // 8,000 ETH equivalent
        tickSpacing: 1,
        volume24h: '750000000000', // $750K
        tvl: '16000000000000', // $16M
        apr: 9.3,
        feeGrowthGlobal0X128: '456789012345678901234567890123',
        feeGrowthGlobal1X128: '654321098765432109876543210987',
      },
      {
        id: '0xe5cfbf8a7d6763b4d1c1a1f1080c0e7469abf76e',
        token0: {
          id: '0x8427ca5ac3d8c857239d6a8767ce57741e253569',
          symbol: 'FRAX',
          name: 'Frax',
          decimals: 18,
        },
        token1: {
          id: '0xf40e9240464482db4b0e95beacb14c3de04c5715',
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
        },
        feeTier: 1, // 0.0001%
        tick: -12,
        sqrtPriceX96: '79228162514264337593543950336',
        liquidity: '1000000000000000000000000', // 1M tokens
        tickSpacing: 1,
        volume24h: '200000000000', // $200K
        tvl: '2000000000000', // $2M
        apr: 3.5,
        feeGrowthGlobal0X128: '567890123456789012345678901234',
        feeGrowthGlobal1X128: '543210987654321098765432109876',
      },
      {
        id: '0xf5fca88bcfb998f487ef5a9bc87765a24a9aae04',
        token0: {
          id: '0x8427ca5ac3d8c857239d6a8767ce57741e253569',
          symbol: 'FRAX',
          name: 'Frax',
          decimals: 18,
        },
        token1: {
          id: '0xfe8668d7a038aea654964199e16b19454cfc2b50',
          symbol: 'DAI',
          name: 'Dai Stablecoin',
          decimals: 18,
        },
        feeTier: 1, // 0.0001%
        tick: -20,
        sqrtPriceX96: '79228162514264337593543950336',
        liquidity: '2000000000000000000000000', // 2M tokens
        tickSpacing: 1,
        volume24h: '300000000000', // $300K
        tvl: '4000000000000', // $4M
        apr: 4.2,
        feeGrowthGlobal0X128: '678901234567890123456789012345',
        feeGrowthGlobal1X128: '432109876543210987654321098765',
      },
    ],
  },
};

// Helper functions
export const getPoolById = (id: string): TMockPool | undefined => {
  return mockPools.data.pools.find((pool) => pool.id.toLowerCase() === id.toLowerCase());
};

export const getPoolsByToken = (tokenSymbol: string): TMockPool[] => {
  return mockPools.data.pools.filter((pool) => pool.token0.symbol === tokenSymbol || pool.token1.symbol === tokenSymbol);
};

export const getPoolsByPair = (token0Symbol: string, token1Symbol: string): TMockPool[] => {
  return mockPools.data.pools.filter(
    (pool) => (pool.token0.symbol === token0Symbol && pool.token1.symbol === token1Symbol) || (pool.token0.symbol === token1Symbol && pool.token1.symbol === token0Symbol)
  );
};

export const getAllPools = (): TMockPool[] => {
  return mockPools.data.pools;
};
