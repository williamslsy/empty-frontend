"use client";
import React, { PropsWithChildren, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./ThemeProvider";
import { Toaster } from "react-hot-toast";
import { ModalProvider } from "./ModalProvider";
import { Web3Provider } from "./Web3Provider";

import { createConfig } from "~/store/config";
import { cosmos } from "~/store/connectors/cosmos";
import { ChainId } from "~/types/chain";
import { Transport } from "~/types/transports";
import { tendermintRpc } from "~/store/transports/tendermintRpc";

import { babylonTestnet } from "~/config/chains/babylon-testnet";
import { TrpcProvider } from "./TrpcProvider";

const queryClient = new QueryClient();

export const config = createConfig({
  ssr: true,
  chains: [babylonTestnet],
  connectors: [
    cosmos({
      id: "Keplr",
      name: "Keplr",
      provider: async () => window.keplr,
    }),
    cosmos({
      id: "leap",
      name: "Leap",
      icon: "https://raw.githubusercontent.com/quasar-finance/quasar-resources/main/assets/wallet/leap.webp",
      provider: async () => window.leap,
    }),
    cosmos({
      id: "cosmostation",
      name: "Cosmostation",
      icon: "https://raw.githubusercontent.com/quasar-finance/quasar-resources/main/assets/wallet/cosmostation.webp",
      provider: async () => window.cosmostation?.providers.keplr,
    }),
  ],
  transports: {
    [babylonTestnet.id]: tendermintRpc(undefined, { batch: true }),
  } as Record<ChainId, Transport>,
});

const AppProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  return (
    <Web3Provider config={config}>
      <QueryClientProvider client={queryClient}>
        <TrpcProvider queryClient={queryClient}>
          <ThemeProvider>
            <ModalProvider>{children}</ModalProvider>
            <Toaster position="bottom-right" reverseOrder />
          </ThemeProvider>
        </TrpcProvider>
      </QueryClientProvider>
    </Web3Provider>
  );
};

export default AppProvider;
