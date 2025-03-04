import { Chain, ChainId } from "./chain";
import { Client } from "./client";
import { Connection, ConnectorId, Connector, CreateConnectorFn } from "./connectors";
import { Storage } from "./storage";
import { Transport } from "./transports";

export type CreateConfigParameters = {
  ssr?: boolean;
  chains: [Chain, ...Chain[]];
  connectors: CreateConnectorFn[];
  transports: Record<ChainId, Transport>;
  storage?: Storage | null;
};

export type Config = {
  readonly ssr: boolean;
  readonly chains: [Chain, ...Chain[]];
  readonly connectors: readonly Connector[];
  readonly storage: Storage | null;
  readonly store: StoreApi;
  readonly state: State;
  setChainId(chainId: ChainId): void;
  setState(value: State | ((state: State) => State)): void;
  subscribe<state>(
    selector: (state: State) => state,
    listener: (state: state, previousState: state) => void,
    options?: {
      emitImmediately?: boolean;
      equalityFn?: (a: state, b: state) => boolean;
    }
  ): () => void;

  getClient(parameters?: { chainId?: ChainId }): Client;
};

export type State = {
  chainId: ChainId;
  connectors: Map<ChainId, ConnectorId>;
  connections: Map<ConnectorId, Connection>;
  status: "connected" | "connecting" | "disconnected" | "reconnecting";
};

export type ConfigParameter<config extends Config = Config> = {
  config?: config;
};

type StoreApi = {
  setState: (partial: State | Partial<State>, replace?: false) => void;
  getState: () => State;
  getInitialState: () => State;
  subscribe: (listener: (state: State, prevState: State) => void) => () => void;
  persist: {
    rehydrate: () => Promise<void> | void;
    hasHydrated: () => boolean;
  };
};
