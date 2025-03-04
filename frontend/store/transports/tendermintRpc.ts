import { Transport } from "~/types/transports";
import { createTransport } from "./createTransport";
import { HttpBatchClient, HttpClient, Tendermint37Client } from "@cosmjs/tendermint-rpc";
import { QueryClient, setupBankExtension, setupTxExtension } from "@cosmjs/stargate";
import { setupWasmExtension } from "@cosmjs/cosmwasm-stargate";

export type TendermintRpcConfig = {
  batch?: boolean | { sizeLimit: number; dispatchInterval: number };
  key?: string;
  name?: string;
};

export function tendermintRpc(url?: string | undefined, config: TendermintRpcConfig = {}): Transport<"tendermint"> {
  const { batch, key = "tendermint", name = "Tendermint JSON-RPC" } = config;
  return ({ chain } = {}) => {
    const url_ = url || chain?.rpcUrls.default.http[0];
    if (!url_) throw new Error("no url provided");

    const rpcClient = batch
      ? new HttpBatchClient(url_, typeof batch === "object" ? batch : { sizeLimit: 50, dispatchInterval: 100 })
      : new HttpClient(url_);

    // @ts-ignore
    const tmClient = new Tendermint37Client(rpcClient);

    async function broadcastTx(tx: Uint8Array): Promise<Uint8Array> {
      const { code, codespace, log, hash } = await tmClient.broadcastTxSync({ tx });
      if (code === 0) return hash;
      throw new Error(`failed to broadcast tx! codespace: ${codespace}, code: ${code}, log: ${log}`);
    }

    const queryClient = QueryClient.withExtensions(tmClient, setupBankExtension, setupTxExtension, setupWasmExtension);

    const request = Object.assign({}, queryClient, { broadcastTx });

    return createTransport<"tendermint">(
      {
        key,
        name,
        type: "tendermint",
      },
      request
    );
  };
}
