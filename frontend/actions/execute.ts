import { Coin } from "@cosmjs/proto-signing";
import { toUtf8 } from "@cosmjs/encoding";
import { Connector } from "~/types/connectors";

export type Instruction = {
  contractAddress: string;
  instruction: unknown;
  funds?: Coin[];
};

export type ExecuteMultipleParameters = {
  userAddress: string;
  connector: Connector;
  instructions: Instruction[];
};

export type ExecuteParameters = {
  userAddress: string;
  connector: Connector;
  instruction: Instruction;
};

export async function execute<T>(parameters: ExecuteParameters): Promise<T> {
  const { instruction, userAddress, connector } = parameters;
  return await executeMultiple<T>({ userAddress, connector, instructions: [instruction] });
}

export async function executeMultiple<T>(parameters: ExecuteMultipleParameters): Promise<T> {
  const { userAddress, instructions, connector } = parameters;
  const msgs = instructions.map(({ contractAddress, instruction, funds }) => ({
    typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
    value: {
      sender: userAddress,
      contract: contractAddress,
      msg: toUtf8(JSON.stringify(instruction)),
      funds: funds || [],
    },
  }));
  const result = await connector.requestSignature(msgs);
  return result as T;
}
