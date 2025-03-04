import { CreateConnectorFn } from "~/types/connectors";

export function createConnector<
  provider,
  properties extends Record<string, unknown> = Record<string, unknown>,
  storageItem extends Record<string, unknown> = Record<string, unknown>
>(createConnectorFn: CreateConnectorFn<provider, properties, storageItem>) {
  return createConnectorFn;
}
