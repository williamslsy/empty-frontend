import { Chain } from "~/types/chain";

export const babylonTestnet: Chain = {
  id: "bbn-test-5",
  name: "Babylon Testnet",
  icon: "https://raw.githubusercontent.com/cosmos/chain-registry/master/testnets/babylontestnet/images/logo.svg",
  ecosystem: "cosmos",
  blockExplorers: {
    default: {
      url: "https://www.mintscan.io/babylon",
      txPage: "https://www.mintscan.io/babylon/txs/${tx_hash}",
      accountPage: "https://www.mintscan.io/babylon/account/${address}",
    },
  },
  nativeCurrency: {
    denom: "ubbn",
    decimals: 6,
    name: "Babylon Token",
    symbol: "BABY",
    type: "native",
  },
  rpcUrls: {
    default: {
      http: ["https://babylon-testnet-rpc.nodes.guru"],
    },
  },
};
