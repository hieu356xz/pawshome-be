export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/** Helper to flatten type structure for better IDE tooltips */
type Finalize<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;
