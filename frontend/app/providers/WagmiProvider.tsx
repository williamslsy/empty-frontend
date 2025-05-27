'use client';

import { WagmiProvider as WagmiProviderBase } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { createConfig } from 'wagmi';
import { coinbaseWallet, injected, metaMask, walletConnect } from 'wagmi/connectors';
import { useState, useEffect } from 'react';

const config = createConfig({
  chains: [sepolia, mainnet],
  connectors: [metaMask(), coinbaseWallet({ appName: 'Tower.fi' })],
  transports: {
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
});

const queryClient = new QueryClient();

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProviderBase config={config}>{children}</WagmiProviderBase>
    </QueryClientProvider>
  );
}
