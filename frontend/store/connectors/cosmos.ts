"use client";

import type { Keplr } from "@keplr-wallet/types";
import { createConnector } from "./createConnector";
import { Connector } from "~/types/connectors";
import { EncodeObject } from "@cosmjs/proto-signing";
import { toast } from "~/app/hooks";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { GasPrice, calculateFee, isDeliverTxFailure } from "@cosmjs/stargate";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { Tendermint37Client } from "@cosmjs/tendermint-rpc";

type CosmosConnectorParameters = {
  id?: string;
  name?: string;
  icon?: string;
  provider?: () => Promise<Keplr | undefined>;
};

export function cosmos(parameters: CosmosConnectorParameters = {}) {
  const {
    id = "cosmos",
    name = "Keplr Provider",
    icon = "https://raw.githubusercontent.com/quasar-finance/quasar-resources/main/assets/wallet/keplr.webp",
    provider: _provider = () => window.keplr,
  } = parameters;

  let _chainId: string;
  let _signingClient: SigningCosmWasmClient;
  let accountsChanged: Connector["onAccountsChanged"] | undefined;
  return createConnector<Keplr>(({ emitter, chains }) => ({
    id,
    name,
    icon,
    type: "cosmos",
    supportedEcosystem: ["cosmos"],
    get isInstalled() {
      return !!_provider;
    },
    async getChainId() {
      return _chainId;
    },
    async connect({ chainId }) {
      _chainId = String(chainId);
      const provider = await this.getProvider();
      await provider.enable([_chainId]);
      const chain = chains.find(({ id }) => id === _chainId);
      const accounts = await this.getAccounts();
      const signer = provider.getOfflineSignerOnlyAmino(_chainId);
      const tmClient = await Tendermint37Client.connect(chain!.rpcUrls.default.http[0]);
      _signingClient = await SigningCosmWasmClient.createWithSigner(tmClient, signer, {
        gasPrice: GasPrice.fromString("0.025" + "uosmo"),
      });
      if (!accountsChanged) {
        accountsChanged = this.onAccountsChanged?.bind(this);
        addEventListener("keplr_keystorechange", accountsChanged as unknown as EventListener);
      }
      emitter.emit("connect", { accounts, chainId });
      return { accounts, chainId };
    },
    async disconnect(error?: Error) {
      if (accountsChanged) {
        removeEventListener("keplr_keystorechange", accountsChanged as unknown as EventListener);
        accountsChanged = undefined;
      }
      emitter.emit("disconnect");
    },

    async getProvider() {
      const cosmosProvider = await _provider();
      if (!cosmosProvider) throw new Error(`${name} not installed`);
      return cosmosProvider;
    },
    async getAccounts() {
      const provider = await this.getProvider();
      const signer = provider.getOfflineSignerOnlyAmino(_chainId);
      const accounts = await signer.getAccounts();
      return accounts.map((account) => account.address);
    },
    async onAccountsChanged(_accounts) {
      const accounts = await this.getAccounts();
      emitter.emit("change", { accounts });
    },
    async requestSignature(payload: unknown) {
      const [address] = await this.getAccounts();
      const msgs = payload as EncodeObject[];
      const gasEstimation = await _signingClient.simulate(address, msgs, undefined);

      const usedFee = calculateFee(Math.round(gasEstimation * 1.4), GasPrice.fromString("0.025" + "uosmo"));

      const tx = await toast.promise(_signingClient.sign(address, msgs, usedFee, ""), {
        loading: {
          title: "Please Confirm Transaction",
          description: "Confirm and sign transaction in your wallet",
        },
        error: {
          title: "Tx Cancelled",
          description: "Transaction was cancelled",
        },
        success: {
          title: "Sign Succesful",
        },
      });

      const broadcastTx = async () => {
        const result = await _signingClient.broadcastTx(TxRaw.encode(tx).finish());
        if (isDeliverTxFailure(result)) {
          throw new Error(result.rawLog);
        }
        return result;
      };

      const result = await toast.promise(broadcastTx(), {
        loading: {
          title: "Transaction Submitted",
          description: "Waiting for the transaction to be included in the block",
        },
        success: {
          title: "Transaction Successful",
        },
        error: {
          title: "Transaction Error",
        },
      });

      return {
        logs: result.rawLog,
        height: result.height,
        transactionHash: result.transactionHash,
        events: result.events,
        gasWanted: result.gasWanted,
        gasUsed: result.gasUsed,
      };
    },
  }));
}
