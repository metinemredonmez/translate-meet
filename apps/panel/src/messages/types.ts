import type tr from "./tr";

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

/** Shape of every dictionary: same keys as Turkish, any string values. */
export type Messages = Widen<typeof tr>;

type Leaves<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Every valid translation key, e.g. "users.title". */
export type MessageKey = Leaves<Messages>;
