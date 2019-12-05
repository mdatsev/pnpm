export declare type LockedFunc<T> = (key: string, fn: () => Promise<T>) => Promise<T>;
/**
 * Save promises for later
 */
export default function lock<T>(): LockedFunc<T>;
