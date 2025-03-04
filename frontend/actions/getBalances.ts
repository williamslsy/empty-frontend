import { Coin } from "@cosmjs/proto-signing";
import { Client } from "~/types/client";

export type GetBalancesParameters = {
  address: string;
};

export type GetBalancesReturnType = Coin[];

export async function getBalances(client: Client<"tendermint">, parameters: GetBalancesParameters): Promise<GetBalancesReturnType> {
  const { address } = parameters;
  const balance = await client.request.bank.allBalances(address);
  return balance;
}
