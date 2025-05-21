"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { ModalProvider } from "./ModalProvider";
import { ThemeProvider } from "./ThemeProvider";
import type { PropsWithChildren } from "react";
import { TransactionDisplayProvider } from './TransactionDisplayProvider';

const queryClient = new QueryClient({
  defaultOptions: { 
    queries: { 
      retry: false, 
      refetchOnWindowFocus: false,
      // Add some realistic defaults for mock data
      staleTime: 30000, // Consider data stale after 30 seconds
      cacheTime: 5 * 60 * 1000, // Keep data in cache for 5 minutes
    } 
  },
});


const AppProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ModalProvider>
              <TransactionDisplayProvider>
                {children}
              </TransactionDisplayProvider>
            </ModalProvider>
            <Toaster
              containerStyle={{
                zIndex: 99999999,
              }}
              toastOptions={{
                style: {
                  zIndex: 99999999,
                },
              }}
              position="bottom-right"
              reverseOrder
            />
          </ThemeProvider>
    </QueryClientProvider>
  );
};

export default AppProvider;
