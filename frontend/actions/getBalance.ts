import { Client } from "~/types/client";

export type GetBalanceParameters = {
  address: string;
  denom: string;
};

export type GetBalanceReturnType = bigint;

export async function getBalance(client: Client<"tendermint">, parameters: GetBalanceParameters): Promise<GetBalanceReturnType> {
  const { address, denom } = parameters;
  const balance = await client.request.bank.balance(address, denom);
  return BigInt(balance.amount);
}
