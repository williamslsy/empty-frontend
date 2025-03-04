import { NativeCurrency } from "./currency";

export type Chain<custom extends Record<string, unknown> | undefined = Record<string, unknown> | undefined> = {
  blockExplorers: {
    [key: string]: BlockExplorer;
    default: BlockExplorer;
  };
  contracts?: {
    [key: string]: string;
  };
  ecosystem: string;
  id: ChainId;
  name: string;
  nativeCurrency: NativeCurrency;
  rpcUrls: {
    [key: string]: {
      http: string[];
    };
    default: {
      http: string[];
    };
  };
  testnet?: boolean | undefined;
} & custom;

export type ChainId = string | number;

export type BlockExplorer = {
  url: string;
  txPage: string;
  accountPage: string;
};
