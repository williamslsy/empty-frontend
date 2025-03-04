import { BaseStorage, CreateStorageParameters, Storage, StorageItemMap } from "~/types/storage";
import { Prettify } from "~/types/utils";
import { serialize as serialize_, deserialize as deserialize_ } from "~/utils/superjson";

export function createStorage<
  itemMap extends Record<string, unknown> = Record<string, unknown>,
  storageItemMap extends StorageItemMap = StorageItemMap & itemMap
>(parameters: CreateStorageParameters): Prettify<Storage<storageItemMap>> {
  const { deserialize = deserialize_, key: prefix = "tower", serialize = serialize_, storage = noopStorage } = parameters;

  function unwrap<type>(value: type): type | Promise<type> {
    if (value instanceof Promise) return value.then((x) => x).catch(() => null);
    return value;
  }

  return {
    ...storage,
    key: prefix,
    async getItem(key, defaultValue) {
      const value = storage.getItem(`${prefix}.${key as string}`);
      const unwrapped = await unwrap(value);
      if (unwrapped) return deserialize(unwrapped) ?? null;
      return (defaultValue ?? null) as any;
    },
    async setItem(key, value) {
      const storageKey = `${prefix}.${key as string}`;
      if (value === null) await unwrap(storage.removeItem(storageKey));
      else await unwrap(storage.setItem(storageKey, serialize(value)));
    },
    async removeItem(key) {
      await unwrap(storage.removeItem(`${prefix}.${key as string}`));
    },
  };
}

export const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
} satisfies BaseStorage;
