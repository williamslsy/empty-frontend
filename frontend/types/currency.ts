import type { Prettify } from "./utils";

export type WithGasPriceStep<T> = T & {
  readonly gasPriceStep: {
    readonly low: number;
    readonly average: number;
    readonly high: number;
  };
};

export type BaseCurrency = {
  readonly symbol: string;
  readonly denom: string;
  readonly decimals: number;
  readonly logoURI: string;
  readonly coingeckoId?: string;
};

export type WithPrice<T> = T & {
  readonly price: number;
};

export type NativeCurrency = Prettify<
  BaseCurrency & {
    readonly type: "native";
  }
>;

export type ERC20Currency = Prettify<
  BaseCurrency & {
    readonly type: "erc-20";
    readonly contractAddress: string;
  }
>;

export type IBCCurrency = Prettify<
  BaseCurrency & {
    readonly type: "ibc";
    readonly portId: string;
    readonly channelId: string;
    readonly origin: {
      readonly portId: string;
      readonly channelId: string;
      readonly asset: Currency;
    };
  }
>;

export type FeeCurrency = WithGasPriceStep<NativeCurrency | IBCCurrency>;

export type Currency = NativeCurrency | ERC20Currency | IBCCurrency;
