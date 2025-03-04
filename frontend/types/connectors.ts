import { Address } from "~/types/address";
import { Chain, ChainId } from "~/types/chain";
import { Prettify } from "~/types/utils";
import { Emitter } from "./emitter";
import { Transport } from "./transports";
import { Client } from "./client";
import { Storage } from "./storage";

export type ConnectorEventMap = {
  change: {
    accounts?: readonly Address[];
    chainId?: string | number;
  };
  connect: { accounts: readonly Address[]; chainId: ChainId };
  disconnect: never;
  error: { error: Error };
  message: { type: string; data?: unknown | undefined };
};

export type CreateConnectorFn<
  provider = unknown,
  properties extends Record<string, unknown> = Record<string, unknown>,
  storageItem extends Record<string, unknown> = Record<string, unknown>
> = (config: {
  chains: readonly [Chain, ...Chain[]];
  emitter: Emitter<ConnectorEventMap>;
  storage?: Prettify<Storage<storageItem>> | null | undefined;
  transports?: Record<number, Transport> | undefined;
}) => Prettify<
  {
    readonly icon?: string | undefined;
    readonly id: string;
    readonly name: string;
    readonly type: string;
    readonly supportedEcosystem: string[];
    readonly isInstalled: boolean;

    setup?(): Promise<void>;
    connect(parameters: { chainId: ChainId }): Promise<{
      accounts: readonly Address[];
      chainId: ChainId;
    }>;
    disconnect(error?: unknown): Promise<void>;
    getAccounts(): Promise<readonly Address[]>;
    getChainId(): Promise<ChainId>;
    getProvider(): Promise<provider>;
    requestSignature(payload: unknown): Promise<unknown>;
    switchChain?(chainId: ChainId): Promise<void>;
    getClient?(parameters?: { chainId?: ChainId | undefined } | undefined): Promise<Client>;
    isAuthorized?(): Promise<boolean>;
    onAccountsChanged?(accounts: string[]): void;
    onChainChanged?(chainId: string): void;
    onDisconnect?(error?: Error | undefined): void;
    onConnect?(connectInfo: { chainId: ChainId }): void;
    onMessage?(message: { type: string; data: unknown }): void;
  } & properties
>;

export type Connection = {
  account: Address;
  accounts: readonly Address[];
  chainId: ChainId;
  connector: Connector;
};

export type Connector = ReturnType<CreateConnectorFn> & {
  emitter: Emitter<ConnectorEventMap>;
  uid: string;
};

export type ConnectorId = string;
