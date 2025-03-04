"use client";

import { createContext, createElement, PropsWithChildren, ReactElement, useEffect, useRef } from "react";
import { hydrate } from "~/store/hydratate";
import { Config, State } from "~/types/config";

export const Web3Context = createContext<Config | undefined>(undefined);

export type Web3ProviderProps = {
  config: Config;
  initialState?: State;
  reconnectOnMount?: boolean;
};

export const Web3Provider: React.FC<PropsWithChildren<Web3ProviderProps>> = (parameters) => {
  const { children, config } = parameters;

  return createElement(Hydrate, parameters, createElement(Web3Context.Provider, { value: config }, children));
};

export function Hydrate(parameters: React.PropsWithChildren<Web3ProviderProps>) {
  const { children, config, initialState, reconnectOnMount = true } = parameters;

  const { onMount } = hydrate(config, {
    initialState,
    reconnectOnMount,
  });

  // Hydrate for non-SSR
  if (!config.ssr) onMount();

  // Hydrate for SSR
  const active = useRef(true);
  useEffect(() => {
    if (!active.current) return;
    if (!config.ssr) return;
    onMount();
    return () => {
      active.current = false;
    };
  }, []);

  return children as ReactElement;
}
