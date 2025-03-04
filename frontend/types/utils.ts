export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type MaybePromise<T> = T | Promise<T>;

export type OneRequired<T, K1 extends keyof T, K2 extends keyof T> =
  | (Required<Pick<T, K1>> & Partial<Pick<T, K2>>)
  | (Required<Pick<T, K2>> & Partial<Pick<T, K1>>);
