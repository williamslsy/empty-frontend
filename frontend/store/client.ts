import { Client, ClientConfig } from "~/types/client";
import { Prettify } from "~/types/utils";

type Extended = Prettify<
  { [_ in keyof Client]?: undefined } & {
    [key: string]: unknown;
  }
>;

export function createClient(parameters: ClientConfig): Client {
  const { name = "Base Client", type = "base", account } = parameters;

  const chain = parameters.chain;
  const { config, request } = parameters.transport({
    chain,
  });

  const transport = { ...config };

  const client = {
    account,
    chain,
    ecosystem: chain.ecosystem,
    name,
    request,
    transport,
    type,
    uid: crypto.randomUUID(),
  };

  function extend(base: typeof client) {
    type ExtendFn = (base: typeof client) => unknown;
    return (extendFn: ExtendFn) => {
      const extended = extendFn(base) as Extended;
      for (const key in client) delete extended[key];
      const combined = { ...base, ...extended };
      return Object.assign(combined, { extend: extend(combined as any) });
    };
  }

  return Object.assign(client, { extend: extend(client) as any }) as Client;
}
