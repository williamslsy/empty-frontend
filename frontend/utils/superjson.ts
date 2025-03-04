import superjson from "superjson";
import { toBase64, fromBase64 } from "@cosmjs/encoding";

superjson.registerCustom(
  {
    isApplicable: (v: Uint8Array): v is Uint8Array => v?.constructor === Uint8Array,
    serialize: toBase64,
    deserialize: fromBase64,
  },
  "Uint8Array"
);

export function serialize<T>(value: T): string {
  return superjson.stringify(value);
}

export function deserialize<T>(value: string): T {
  return superjson.parse<T>(value);
}
