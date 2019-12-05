export = deepResolveFrom;

declare function deepResolveFrom (fromDir: string, moduleIds: string[]): string;

declare namespace deepResolveFrom {
  export function silent (fromDir: string, moduleIds: string[]): string;
}
