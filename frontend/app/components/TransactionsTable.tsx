import { twMerge } from '~/utils/twMerge';

interface PoolToken {
  symbol: string;
  decimals: number;
}

interface Pool {
  token0: PoolToken;
  token1: PoolToken;
  address: string;
}

interface TransactionsTableProps {
  pool: Pool;
}

interface Transaction {
  time: string;
  type: string;
  usd: string;
  token0Amount: string;
  token1Amount: string;
  wallet: string;
}

export function TransactionsTable({ pool }: TransactionsTableProps) {
  // Generate dynamic mock transaction data based on the pool
  const generateMockTransactions = (pool: Pool): Transaction[] => {
    const { token0, token1 } = pool;

    // Define realistic token prices based on common token symbols
    const getTokenPrice = (symbol: string): number => {
      const prices: Record<string, number> = {
        WETH: 2400,
        ETH: 2400,
        USDC: 1.0,
        USDT: 1.0,
        DAI: 1.0,
        FRAX: 1.0,
        BABY: 0.07,
        LINK: 15,
        UNI: 8,
        AAVE: 85,
        COMP: 45,
        // Add more as needed
        default: 1.0,
      };
      return prices[symbol] || prices['default'];
    };

    const token0Price = getTokenPrice(token0.symbol);
    const token1Price = getTokenPrice(token1.symbol);

    // Base USD values for different transaction sizes
    const transactionTemplates = [
      { time: '1m', usdValue: 26034, swapDirection: 'token0_to_token1' },
      { time: '1m', usdValue: 50359, swapDirection: 'token1_to_token0' },
      { time: '1m', usdValue: 317, swapDirection: 'token0_to_token1' },
      { time: '1m', usdValue: 44074, swapDirection: 'token1_to_token0' },
      { time: '2m', usdValue: 18289, swapDirection: 'token0_to_token1' },
      { time: '2m', usdValue: 447, swapDirection: 'token1_to_token0' },
      { time: '3m', usdValue: 8, swapDirection: 'token1_to_token0' },
      { time: '3m', usdValue: 23119, swapDirection: 'token0_to_token1' },
      { time: '3m', usdValue: 1872, swapDirection: 'token1_to_token0' },
      { time: '3m', usdValue: 2765, swapDirection: 'token0_to_token1' },
      { time: '3m', usdValue: 2758, swapDirection: 'token1_to_token0' },
    ];

    const wallets = [
      '0xf621...A634',
      '0xF728...A067',
      '0xa747...132e',
      '0x967b...14D3',
      '0xDdaC...b677',
      '0x655C...C35b',
      '0x0A2a...085E',
      '0xD1Fa...0c87',
      '0x05eE...97C4',
      '0x36A3...e1F8',
      '0x36A3...e1F9',
    ];

    return transactionTemplates.map((template, index) => {
      // Add some randomness to make it feel more realistic
      const randomMultiplier = 0.85 + Math.random() * 0.3; // 0.85 to 1.15
      const actualUsdValue = template.usdValue * randomMultiplier;

      let inputAmount: number;
      let outputAmount: number;
      let inputToken: string;
      let outputToken: string;
      let token0Amount: number;
      let token1Amount: number;
      let transactionType: string;

      // Add realistic slippage/fees (0.3% pool fee + slippage)
      const tradingFee = 0.997; // 0.3% pool fee
      const slippage = 0.998 + Math.random() * 0.002; // Small additional slippage
      const totalEfficiency = tradingFee * slippage;

      if (template.swapDirection === 'token0_to_token1') {
        // Swapping token0 for token1
        inputAmount = actualUsdValue / token0Price;
        outputAmount = (actualUsdValue / token1Price) * totalEfficiency;
        inputToken = token0.symbol;
        outputToken = token1.symbol;
        token0Amount = inputAmount;
        token1Amount = outputAmount;
        transactionType = `Swap ${token0.symbol} for ${token1.symbol}`;
      } else {
        // Swapping token1 for token0
        inputAmount = actualUsdValue / token1Price;
        outputAmount = (actualUsdValue / token0Price) * totalEfficiency;
        inputToken = token1.symbol;
        outputToken = token0.symbol;
        token0Amount = outputAmount;
        token1Amount = inputAmount;
        transactionType = `Swap ${token1.symbol} for ${token0.symbol}`;
      }

      // Format amounts appropriately
      const formatTokenAmount = (amount: number, decimals: number, symbol: string): string => {
        if (amount < 0.01) {
          return `<0.01 ${symbol}`;
        } else if (amount < 1) {
          return `${amount.toFixed(3)} ${symbol}`;
        } else if (amount >= 1000) {
          return `${(amount / 1000).toFixed(1)}K ${symbol}`;
        } else {
          const maxDecimals = decimals >= 6 ? 2 : Math.min(decimals, 4);
          return `${amount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: maxDecimals,
          })} ${symbol}`;
        }
      };

      return {
        time: template.time,
        type: transactionType,
        usd: `$${actualUsdValue.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        token0Amount: formatTokenAmount(token0Amount, token0.decimals, token0.symbol),
        token1Amount: formatTokenAmount(token1Amount, token1.decimals, token1.symbol),
        wallet: wallets[index] || wallets[0],
      };
    });
  };

  const transactions = generateMockTransactions(pool);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-tw-foreground">Transactions</h2>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-tw-bg/50 backdrop-blur-md p-6">
        <table className="w-full text-sm">
          <thead className="text-white/50">
            <tr>
              <th className="text-left py-4 px-6 font-medium">Time</th>
              <th className="text-left py-4 px-6 font-medium">Type</th>
              <th className="text-left py-4 px-6 font-medium">USD</th>
              <th className="text-left py-4 px-6 font-medium">{pool.token0.symbol}</th>
              <th className="text-left py-4 px-6 font-medium">{pool.token1.symbol}</th>
              <th className="text-left py-4 px-6 font-medium">Wallet</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, index) => (
              <tr key={index} className="border-t border-white/10 hover:bg-white/[0.02] transition-colors">
                <td className="py-4 px-6 text-white/50">{tx.time}</td>
                <td className="py-4 px-6">
                  <span className={twMerge('font-medium', tx.type.includes(`Swap ${pool.token0.symbol}`) ? 'text-tw-success' : 'text-tw-error')}>{tx.type}</span>
                </td>
                <td className="py-4 px-6 text-tw-foreground font-medium">{tx.usd}</td>
                <td className="py-4 px-6 text-tw-foreground">{tx.token0Amount}</td>
                <td className="py-4 px-6 text-tw-foreground">{tx.token1Amount}</td>
                <td className="py-4 px-6 text-white/50 font-mono text-xs">{tx.wallet}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
